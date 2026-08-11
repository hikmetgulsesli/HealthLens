import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OfflineQueueItem } from '../types';
import { analyzeFoodImage } from '../services/aiService';
import { AiError } from '../services/ai/errors';
import { useLogStore } from './logStore';
import { createMmkvStorage } from '../lib/persist';
import { getTodayKey } from '../utils/date';

const queueStorage = createMmkvStorage('offline-queue-storage');

const BASE_RETRY_MS = 1_000;
const MAX_RETRY = 3;
const RETRYABLE_KINDS = new Set(['timeout', 'network', 'provider_error', 'rate_limit']);

function computeNextRetryAt(retryCount: number): string {
  const ms = BASE_RETRY_MS * Math.pow(2, retryCount);
  return new Date(Date.now() + ms).toISOString();
}

function isRetryable(err: unknown): boolean {
  if (err instanceof AiError) return RETRYABLE_KINDS.has(err.kind);
  return true;
}

interface OfflineQueueState {
  queue: OfflineQueueItem[];
  isProcessing: boolean;
  addToQueue: (
    item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'status' | 'retryCount'>,
  ) => void;
  removeFromQueue: (id: string) => void;
  updateStatus: (id: string, status: OfflineQueueItem['status']) => void;
  incrementRetry: (id: string) => void;
  processQueue: () => Promise<void>;
  clearCompleted: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isProcessing: false,
      addToQueue: item =>
        set(state => ({
          queue: [
            ...state.queue,
            {
              ...item,
              id: `queue-${Date.now()}`,
              createdAt: new Date().toISOString(),
              status: 'pending',
              retryCount: 0,
              nextRetryAt: null,
            },
          ],
        })),
      removeFromQueue: id =>
        set(state => ({
          queue: state.queue.filter(item => item.id !== id),
        })),
      updateStatus: (id, status) =>
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id ? { ...item, status } : item,
          ),
        })),
      incrementRetry: id =>
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id
              ? { ...item, retryCount: item.retryCount + 1 }
              : item,
          ),
        })),
      processQueue: async () => {
        const { queue, isProcessing } = get();
        if (isProcessing) return;
        const now = Date.now();
        const candidates = queue.filter(item => {
          if (item.retryCount >= MAX_RETRY) return false;
          if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) {
            return false;
          }
          return (
            item.status === 'pending' ||
            item.status === 'failed' ||
            item.status === 'uploading'
          );
        });
        if (candidates.length === 0) return;

        set({ isProcessing: true });
        try {
          for (const item of candidates) {
            try {
              get().updateStatus(item.id, 'uploading');
              const result = await analyzeFoodImage(item.imageUri);

              const totals = result.items.reduce(
                (acc, food) => {
                  const ratio = food.estimatedPortionGrams / 100;
                  acc.cal += food.caloriesPer100g * ratio;
                  acc.protein += food.proteinPer100g * ratio;
                  acc.carbs += food.carbsPer100g * ratio;
                  acc.fat += food.fatPer100g * ratio;
                  return acc;
                },
                { cal: 0, protein: 0, carbs: 0, fat: 0 },
              );

              useLogStore.getState().addEntry({
                id: Math.random().toString(36).substring(7),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dateKey: getTodayKey(),
                mealCategory: item.mealCategory,
                imageUri: item.imageUri,
                items: result.items,
                totalCalories: Math.round(totals.cal),
                totalProtein: Math.round(totals.protein),
                totalCarbs: Math.round(totals.carbs),
                totalFat: Math.round(totals.fat),
              });

              get().removeFromQueue(item.id);
            } catch (err) {
              if (!isRetryable(err)) {
                get().removeFromQueue(item.id);
                continue;
              }
              get().incrementRetry(item.id);
              const aiErr = err instanceof AiError ? err : null;
              const updated = get().queue.find(q => q.id === item.id);
              const newRetryCount = updated?.retryCount ?? item.retryCount + 1;
              const retryAt =
                aiErr?.kind === 'rate_limit' && aiErr.retryAfterSec
                  ? new Date(Date.now() + aiErr.retryAfterSec * 1000).toISOString()
                  : computeNextRetryAt(newRetryCount);
              set(state => ({
                queue: state.queue.map(q =>
                  q.id === item.id
                    ? { ...q, status: 'failed' as const, nextRetryAt: retryAt }
                    : q,
                ),
              }));
            }
          }
        } finally {
          set({ isProcessing: false });
        }
      },
      clearCompleted: () =>
        set(state => ({
          queue: state.queue.filter(
            item => item.status !== 'failed' || item.retryCount < MAX_RETRY,
          ),
        })),
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => queueStorage),
      version: 2,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 2 && persisted && typeof persisted === 'object') {
          return persisted as { queue?: OfflineQueueItem[]; isProcessing?: boolean };
        }
        if (version === 1 && persisted && typeof persisted === 'object') {
          const old = persisted as { queue?: Array<Omit<OfflineQueueItem, 'nextRetryAt'>>; isProcessing?: boolean };
          return {
            queue: (old.queue ?? []).map(item => ({ ...item, nextRetryAt: null })),
            isProcessing: old.isProcessing ?? false,
          };
        }
        return { queue: [], isProcessing: false };
      },
    },
  ),
);