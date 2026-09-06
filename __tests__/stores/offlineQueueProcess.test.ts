import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';
import { useLogStore } from '../../src/stores/logStore';
import { AiError } from '../../src/services/ai/errors';

// Mock aiService with jest.fn so each test can program resolve/reject.
jest.mock('../../src/services/aiService', () => ({
  analyzeFoodImage: jest.fn(),
  analyzeTextMeal: jest.fn(),
}));

// Pull a live reference to the same jest.fn() the store will call.
import { analyzeFoodImage } from '../../src/services/aiService';
const analyzeFoodImageMock = analyzeFoodImage as unknown as jest.Mock;

const flushAsync = () => new Promise<void>(resolve => setImmediate(resolve));

const ITEM_RESULT = {
  imageUri: 'file:///x.jpg',
  imageUris: ['file:///x.jpg'],
  mealCategory: 'lunch' as const,
  smartInsight: 'OK',
  items: [
    {
      id: 'food-1',
      name: 'Yogurt',
      confidence: 0.95,
      estimatedPortionGrams: 200,
      caloriesPer100g: 60,
      proteinPer100g: 5,
      carbsPer100g: 7,
      fatPer100g: 2,
    },
  ],
};

function addOne() {
  useOfflineQueueStore.getState().addToQueue({
    imageUri: 'file:///x.jpg',
    mealCategory: 'lunch',
  });
}

async function flush() {
  await flushAsync();
  await flushAsync();
}

describe('offlineQueueStore.processQueue', () => {
  beforeEach(() => {
    useOfflineQueueStore.setState({ queue: [], isProcessing: false });
    useLogStore.setState({ entries: {} });
    analyzeFoodImageMock.mockReset();
  });

  it('processes pending items and removes them on success', async () => {
    analyzeFoodImageMock.mockResolvedValueOnce(ITEM_RESULT);
    addOne();
    await useOfflineQueueStore.getState().processQueue();
    await flush();
    expect(useOfflineQueueStore.getState().queue).toHaveLength(0);
    const todayKey = new Date().toISOString().split('T')[0];
    expect(useLogStore.getState().getEntriesForDate(todayKey)).toHaveLength(1);
  });

  it('is a no-op when the queue is empty', async () => {
    await useOfflineQueueStore.getState().processQueue();
    expect(analyzeFoodImage).not.toHaveBeenCalled();
  });

  it('does not retry items with a future nextRetryAt timestamp', async () => {
    analyzeFoodImageMock.mockResolvedValue(ITEM_RESULT);
    addOne();
    // Schedule retry 5 minutes into the future.
    const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    useOfflineQueueStore.setState(state => ({
      queue: state.queue.map(i => ({ ...i, nextRetryAt: future })),
    }));
    await useOfflineQueueStore.getState().processQueue();
    await flush();
    expect(analyzeFoodImage).not.toHaveBeenCalled();
    // The original item is still pending.
    expect(useOfflineQueueStore.getState().queue[0].status).toBe('pending');
  });

  it('skips items that have already exhausted MAX_RETRY', async () => {
    addOne();
    useOfflineQueueStore.setState(state => ({
      queue: state.queue.map(i => ({ ...i, retryCount: 3 })),
    }));
    await useOfflineQueueStore.getState().processQueue();
    await flush();
    expect(analyzeFoodImage).not.toHaveBeenCalled();
  });

  it('on failure marks status=failed and stamps nextRetryAt (exponential)', async () => {
    analyzeFoodImageMock.mockRejectedValueOnce(
      new Error('network down'),
    );
    addOne();
    const before = Date.now();
    await useOfflineQueueStore.getState().processQueue();
    await flush();
    const queue = useOfflineQueueStore.getState().queue;
    expect(queue.length).toBe(1);
    const item = queue[0];
    expect(item.status).toBe('failed');
    expect(item.retryCount).toBe(1);
    const ts = new Date(item.nextRetryAt!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before + 900);
    expect(ts).toBeLessThanOrEqual(before + 3000);
  });

  it('drops non-retryable items (auth) without retrying', async () => {
    addOne();
    analyzeFoodImageMock.mockRejectedValueOnce(
      new AiError('auth', 'unauthorized'),
    );
    await useOfflineQueueStore.getState().processQueue();
    await flush();
    expect(useOfflineQueueStore.getState().queue).toHaveLength(0);
  });

  it('rate_limit AiError sets nextRetryAt to now + retryAfterSec * 1000', async () => {
    addOne();
    const before = Date.now();
    analyzeFoodImageMock.mockRejectedValueOnce(
      new AiError('rate_limit', 'rate_limited', 30),
    );
    await useOfflineQueueStore.getState().processQueue();
    await flush();
    const item = useOfflineQueueStore.getState().queue[0];
    const ts = new Date(item.nextRetryAt!).getTime();
    expect(ts).toBeGreaterThanOrEqual(before + 29_000);
    expect(ts).toBeLessThanOrEqual(before + 31_000);
  });

  it('isProcessing flag flips true while in flight, false after', async () => {
    let resolveAi: (v: unknown) => void = () => {};
    analyzeFoodImageMock.mockImplementationOnce(
      () => new Promise(r => { resolveAi = r; }),
    );
    addOne();
    const p = useOfflineQueueStore.getState().processQueue();
    await flushAsync();
    expect(useOfflineQueueStore.getState().isProcessing).toBe(true);
    resolveAi(ITEM_RESULT);
    await p;
    expect(useOfflineQueueStore.getState().isProcessing).toBe(false);
  });

  it('re-entrance guard: second processQueue call while in-flight is a no-op', async () => {
    let resolveAi: (v: unknown) => void = () => {};
    analyzeFoodImageMock.mockImplementationOnce(
      () => new Promise(r => { resolveAi = r; }),
    );
    addOne();
    const first = useOfflineQueueStore.getState().processQueue();
    await flushAsync();
    // While in-flight, a second call returns *immediately* without
    // starting another request. We assert by counting calls.
    const callsBefore = analyzeFoodImageMock.mock.calls.length;
    await useOfflineQueueStore.getState().processQueue();
    expect(analyzeFoodImageMock.mock.calls.length).toBe(callsBefore);
    expect(useOfflineQueueStore.getState().isProcessing).toBe(true);
    resolveAi(ITEM_RESULT);
    await first;
    expect(useOfflineQueueStore.getState().queue).toHaveLength(0);
    expect(useOfflineQueueStore.getState().isProcessing).toBe(false);
  });
});
