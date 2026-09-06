import { useLogStore, getStreakForEntries } from '../../src/stores/logStore';
import type { LogEntry } from '../../src/types';

function mkEntry(
  id: string,
  dateKey: string,
  cals: number,
  protein: number,
  carbs: number,
  fat: number,
): LogEntry {
  return {
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dateKey,
    mealCategory: 'lunch',
    imageUri: '',
    items: [],
    totalCalories: cals,
    totalProtein: protein,
    totalCarbs: carbs,
    totalFat: fat,
  };
}

describe('logStore — totals + streak', () => {
  beforeEach(() => {
    useLogStore.setState({ entries: {} });
  });

  it('addEntry appends to the right date bucket', () => {
    useLogStore.getState().addEntry(mkEntry('a', '2026-08-16', 100, 5, 10, 2));
    useLogStore.getState().addEntry(mkEntry('b', '2026-08-16', 200, 10, 20, 4));
    const list = useLogStore.getState().getEntriesForDate('2026-08-16');
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('a');
    expect(list[1].id).toBe('b');
  });

  it('getEntriesForDate returns empty array for unknown dates', () => {
    const list = useLogStore.getState().getEntriesForDate('1999-01-01');
    expect(list).toEqual([]);
  });

  it('updateEntry replaces matching id without disturbing other entries', () => {
    useLogStore.getState().addEntry(mkEntry('a', '2026-08-16', 100, 5, 10, 2));
    useLogStore.getState().addEntry(mkEntry('b', '2026-08-16', 200, 10, 20, 4));
    useLogStore.getState().updateEntry(mkEntry('a', '2026-08-16', 999, 99, 99, 99));
    const list = useLogStore.getState().getEntriesForDate('2026-08-16');
    expect(list).toHaveLength(2);
    const a = list.find(e => e.id === 'a')!;
    expect(a.totalCalories).toBe(999);
    expect(list.find(e => e.id === 'b')?.totalCalories).toBe(200);
  });

  it('deleteEntry removes a single entry without disturbing other dates', () => {
    useLogStore.getState().addEntry(mkEntry('a', '2026-08-16', 100, 5, 10, 2));
    useLogStore.getState().addEntry(mkEntry('b', '2026-08-17', 200, 10, 20, 4));
    useLogStore.getState().deleteEntry('2026-08-16', 'a');
    expect(useLogStore.getState().getEntriesForDate('2026-08-16')).toHaveLength(0);
    expect(useLogStore.getState().getEntriesForDate('2026-08-17')).toHaveLength(1);
  });

  it('computes a 3-day streak from today, yesterday, two-days-ago', () => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 1);
    const twoBefore = new Date(today);
    twoBefore.setDate(today.getDate() - 2);

    const entries = {
      [fmt(today)]: [mkEntry('1', fmt(today), 100, 5, 10, 2)],
      [fmt(dayBefore)]: [mkEntry('2', fmt(dayBefore), 100, 5, 10, 2)],
      [fmt(twoBefore)]: [mkEntry('3', fmt(twoBefore), 100, 5, 10, 2)],
    };
    expect(getStreakForEntries(entries)).toBe(3);
  });

  it('streak falls back to yesterday when today has no entries', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const entries = {
      [fmt(yesterday)]: [mkEntry('1', fmt(yesterday), 100, 5, 10, 2)],
    };
    expect(getStreakForEntries(entries)).toBe(1);
  });

  it('streak returns 0 when no recent entry exists', () => {
    const old = new Date();
    old.setDate(old.getDate() - 10);
    const entries = {
      [old.toISOString().split('T')[0]]: [
        mkEntry('1', old.toISOString().split('T')[0], 100, 5, 10, 2),
      ],
    };
    expect(getStreakForEntries(entries)).toBe(0);
  });

  it('reducer math: aggregator sum equals input sums', () => {
    // Mirror the Dashboard totals reducer to lock the contract used by
    // the dashboard ring + macro bars.
    const entries = [
      mkEntry('1', '2026-08-16', 320, 18, 40, 8),
      mkEntry('2', '2026-08-16', 540, 32, 60, 14),
      mkEntry('3', '2026-08-16', 0, 0, 0, 0),
    ];
    const total = entries.reduce(
      (acc, e) => ({
        cal: acc.cal + e.totalCalories,
        protein: acc.protein + e.totalProtein,
        carbs: acc.carbs + e.totalCarbs,
        fat: acc.fat + e.totalFat,
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    );
    expect(total).toEqual({ cal: 860, protein: 50, carbs: 100, fat: 22 });
  });
});
