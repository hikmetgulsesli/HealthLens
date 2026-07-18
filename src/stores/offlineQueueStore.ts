import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfflineQueueItem } from '../types';
import { analyzeFoodImage } from '../services/aiService';
import { useLogStore } from './logStore';
import { createMmkvStorage } from '../lib/persist';

const queueStorage = createMmkvStorage('offline-queue-storage');

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
        const pendingItems = queue.filter(
          item =>
            (item.status === 'pending' || item.status === 'failed') &&
            item.retryCount < 3,
        );

        if (isProcessing || pendingItems.length === 0) return;

        set({ isProcessing: true });

        try {
          for (const item of pendingItems) {
            try {
              get().updateStatus(item.id, 'uploading');
              
              // Run real food analysis
              const result = await analyzeFoodImage(item.imageUri);
              
              // Calculate macro totals from analysis result
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

              // Add successful entry to logStore
              const dateKey = new Date().toISOString().split('T')[0];
              useLogStore.getState().addEntry({
                id: Math.random().toString(36).substring(7),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                dateKey,
                mealCategory: item.mealCategory,
                imageUri: item.imageUri,
                items: result.items,
                totalCalories: Math.round(totals.cal),
                totalProtein: Math.round(totals.protein),
                totalCarbs: Math.round(totals.carbs),
                totalFat: Math.round(totals.fat),
              });

              // Remove successfully processed item from queue
              get().removeFromQueue(item.id);
            } catch (error) {
              console.error(`Failed to process queue item ${item.id}:`, error);
              get().incrementRetry(item.id);
              get().updateStatus(item.id, 'failed');
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
      storage: queueStorage,
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { queue?: OfflineQueueItem[]; isProcessing?: boolean };
        }
        return { queue: [], isProcessing: false };
      },
    },
  ),
);
