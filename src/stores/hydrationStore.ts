import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKV} from 'react-native-mmkv';

const storage = new MMKV({id: 'hydration-storage'});

const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
}));

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
      storage: mmkvStorage,
    },
  ),
);
