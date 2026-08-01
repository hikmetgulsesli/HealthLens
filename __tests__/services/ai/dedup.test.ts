import { DedupMap } from '../../../src/services/ai/dedup';

describe('DedupMap', () => {
  it('returns undefined when no entry exists', () => {
    const m = new DedupMap<number>();
    expect(m.get('nope')).toBeUndefined();
  });

  it('returns the same promise on second get within window', () => {
    const m = new DedupMap<number>();
    const p = Promise.resolve(42);
    m.set('k', p);
    expect(m.get('k')).toBe(p);
  });

  it('drops entries after window expires', () => {
    jest.useFakeTimers();
    try {
      const m = new DedupMap<number>({ windowMs: 1000 });
      m.set('k', Promise.resolve(1));
      expect(m.get('k')).toBeDefined();
      jest.advanceTimersByTime(1500);
      expect(m.get('k')).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('isolates keys', () => {
    const m = new DedupMap<number>();
    m.set('a', Promise.resolve(1));
    m.set('b', Promise.resolve(2));
    expect(m.get('a')).not.toBe(m.get('b'));
  });
});
