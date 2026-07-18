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
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { entries?: Record<string, LogEntry[]> };
        }
        return { entries: {} };
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
