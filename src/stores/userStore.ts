import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {MMKV} from 'react-native-mmkv';
import type {UserProfile, NutritionGoals} from '../types';

const storage = new MMKV({id: 'user-storage'});

const mmkvStorage: any = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: unknown) => storage.set(name, JSON.stringify(value)),
  removeItem: (name: string) => storage.delete(name),
};

const defaultGoals: NutritionGoals = {
  dailyCalorieGoal: null,
  dailyProteinGoal: null,
  dailyCarbGoal: null,
  dailyFatGoal: null,
  showMicronutrients: false,
};

const defaultProfile: UserProfile = {
  id: 'default',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  goals: defaultGoals,
  unitSystem: 'metric',
};

interface UserState {
  profile: UserProfile;
  setGoals: (goals: Partial<NutritionGoals>) => void;
  setUnitSystem: (system: 'metric' | 'imperial') => void;
}

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      profile: defaultProfile,
      setGoals: goals =>
        set(state => ({
          profile: {
            ...state.profile,
            updatedAt: new Date().toISOString(),
            goals: {...state.profile.goals, ...goals},
          },
        })),
      setUnitSystem: unitSystem =>
        set(state => ({
          profile: {
            ...state.profile,
            updatedAt: new Date().toISOString(),
            unitSystem,
          },
        })),
    }),
    {
      name: 'user-profile',
      storage: mmkvStorage,
    },
  ),
);
