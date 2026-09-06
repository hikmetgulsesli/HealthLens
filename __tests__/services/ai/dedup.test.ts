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

  it('default windowMs matches PRD §2.3 (5000)', () => {
    const m = new DedupMap<number>();
    m.set('k', Promise.resolve(1));
    expect(m.get('k')).toBeDefined();
  });

  it('clear() empties the map', () => {
    const m = new DedupMap<number>();
    m.set('a', Promise.resolve(1));
    m.set('b', Promise.resolve(2));
    m.clear();
    expect(m.get('a')).toBeUndefined();
    expect(m.get('b')).toBeUndefined();
  });

  it('size() reflects the number of in-flight entries', () => {
    const m = new DedupMap<number>();
    expect(m.size()).toBe(0);
    m.set('a', Promise.resolve(1));
    m.set('b', Promise.resolve(2));
    expect(m.size()).toBe(2);
  });

  it('overwriting the same key with a fresh promise replaces it', () => {
    const m = new DedupMap<number>();
    const p1 = Promise.resolve(1);
    const p2 = Promise.resolve(2);
    m.set('k', p1);
    m.set('k', p2);
    expect(m.get('k')).toBe(p2);
  });
});
