import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LogEntry } from '../types';
import { createMmkvStorage } from '../lib/persist';

const logStorage = createMmkvStorage('log-storage');

interface LogState {
  entries: Record<string, LogEntry[]>;
  addEntry: (entry: LogEntry) => void;
  updateEntry: (entry: LogEntry) => void;
  deleteEntry: (dateKey: string, id: string) => void;
  getEntriesForDate: (dateKey: string) => LogEntry[];
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      entries: {},
      addEntry: entry =>
        set(state => {
          const list = state.entries[entry.dateKey] ?? [];
          return {
            entries: {
              ...state.entries,
              [entry.dateKey]: [...list, entry],
            },
          };
        }),
      updateEntry: entry =>
        set(state => {
          const list = state.entries[entry.dateKey] ?? [];
          return {
            entries: {
              ...state.entries,
              [entry.dateKey]: list.map(e => (e.id === entry.id ? entry : e)),
            },
          };
        }),
      deleteEntry: (dateKey, id) =>
        set(state => {
          const list = state.entries[dateKey] ?? [];
          return {
            entries: {
              ...state.entries,
              [dateKey]: list.filter(e => e.id !== id),
            },
          };
        }),
      getEntriesForDate: (dateKey: string): LogEntry[] => {
        const list = get().entries[dateKey];
        return list ?? [];
      },
    }),
    {
      name: 'daily-logs',
      storage: createJSONStorage(() => logStorage),
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version !== 1 || !persisted || typeof persisted !== 'object') {
          return { entries: {} };
        }
        const raw = persisted as {
          entries?: Record<string, LogEntry[] | undefined>;
        };
        const normalized: Record<string, LogEntry[]> = {};
        for (const [date, list] of Object.entries(raw.entries ?? {})) {
          if (!Array.isArray(list)) continue;
          normalized[date] = list.map(e => {
            // Backfill totalCalories/Protein/Carbs/Fat for legacy entries
            // that stored raw items without totals. Without this, the
            // dashboard ring reducer sums undefined values → NaN.
            const itemTotals = (e.items ?? []).reduce(
              (acc, item) => {
                const ratio = (item.estimatedPortionGrams || 100) / 100;
                return {
                  cal: acc.cal + (item.caloriesPer100g || 0) * ratio,
                  pro: acc.pro + (item.proteinPer100g || 0) * ratio,
                  carb: acc.carb + (item.carbsPer100g || 0) * ratio,
                  fat: acc.fat + (item.fatPer100g || 0) * ratio,
                };
              },
              { cal: 0, pro: 0, carb: 0, fat: 0 },
            );
            return {
              ...e,
              totalCalories:
                typeof e.totalCalories === 'number'
                  ? e.totalCalories
                  : Math.round(itemTotals.cal),
              totalProtein:
                typeof e.totalProtein === 'number'
                  ? e.totalProtein
                  : Math.round(itemTotals.pro),
              totalCarbs:
                typeof e.totalCarbs === 'number'
                  ? e.totalCarbs
                  : Math.round(itemTotals.carb),
              totalFat:
                typeof e.totalFat === 'number'
                  ? e.totalFat
                  : Math.round(itemTotals.fat),
            };
          });
        }
        return { entries: normalized };
      },
    },
  ),
);

/**
 * Dynamically calculates the consecutive logging streak of days from the entries record.
 * Keeps streak active if logged today or yesterday.
 */
export function getStreakForEntries(entries: Record<string, LogEntry[]>): number {
  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);
  let key = checkDate.toISOString().split('T')[0];

  if (!entries[key] || entries[key].length === 0) {
    checkDate.setDate(checkDate.getDate() - 1);
    key = checkDate.toISOString().split('T')[0];
  }

  while (entries[key] && entries[key].length > 0) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    key = checkDate.toISOString().split('T')[0];
  }

  return streak;
}
