import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { OfflineQueueItem } from '../types';

const storage = new MMKV({ id: 'offline-queue-storage' });

const mmkvStorage: any = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) =>
    storage.set(name, JSON.stringify(value)),
  removeItem: (name: string) => storage.delete(name),
};

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
        if (isProcessing || queue.length === 0) return;

        set({ isProcessing: true });

        try {
          for (const item of queue) {
            if (item.status === 'pending' && item.retryCount < 3) {
              try {
                get().updateStatus(item.id, 'uploading');
                // Retry logic will be handled by the caller
                await new Promise(resolve => setTimeout(resolve, 1000));
                get().updateStatus(item.id, 'pending');
              } catch {
                get().incrementRetry(item.id);
                get().updateStatus(item.id, 'failed');
              }
            }
          }
        } finally {
          set({ isProcessing: false });
        }
      },
      clearCompleted: () =>
        set(state => ({
          queue: state.queue.filter(
            item => item.status !== 'failed' || item.retryCount < 3,
          ),
        })),
    }),
    {
      name: 'offline-queue',
      storage: mmkvStorage,
    },
  ),
);
