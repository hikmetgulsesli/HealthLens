import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {MMKV} from 'react-native-mmkv';
import type {LogEntry, MealCategory} from '../types';

const storage = new MMKV({id: 'log-storage'});

const mmkvStorage: any = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => storage.set(name, JSON.stringify(value)),
  removeItem: (name: string) => storage.delete(name),
};

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
      storage: mmkvStorage,
    },
  ),
);
