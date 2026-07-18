import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {createMmkvStorage} from '../lib/persist';

const hydrationStorage = createMmkvStorage('hydration-storage');

interface HydrationState {
  waterIntake: Record<string, number>; // dateKey (YYYY-MM-DD) -> ml
  dailyWaterGoal: number; // default: 2500 ml
  addWater: (ml: number, dateKey: string) => void;
  removeWater: (ml: number, dateKey: string) => void;
  setWaterGoal: (ml: number) => void;
}

export const useHydrationStore = create<HydrationState>()(
  persist(
    set => ({
      waterIntake: {},
      dailyWaterGoal: 2500,
      addWater: (ml, dateKey) =>
        set(state => ({
          waterIntake: {
            ...state.waterIntake,
            [dateKey]: (state.waterIntake[dateKey] ?? 0) + ml,
          },
        })),
      removeWater: (ml, dateKey) =>
        set(state => ({
          waterIntake: {
            ...state.waterIntake,
            [dateKey]: Math.max((state.waterIntake[dateKey] ?? 0) - ml, 0),
          },
        })),
      setWaterGoal: dailyWaterGoal => set({dailyWaterGoal}),
    }),
    {
      name: 'hydration-data',
      storage: hydrationStorage,
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { waterIntake?: Record<string, number>; dailyWaterGoal?: number };
        }
        return { waterIntake: {}, dailyWaterGoal: 2500 };
      },
    },
  ),
);
