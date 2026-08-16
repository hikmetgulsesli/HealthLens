import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Keychain from 'react-native-keychain';
import type { UserProfile, NutritionGoals } from '../types';
import { getTodayKey } from '../utils/date';
import { createMmkvStorage } from '../lib/persist';

const userStorage = createMmkvStorage('user-storage');
const SCAN_KEYCHAIN_SERVICE = 'com.hikmetgulsesli.healthlens.scans';

const defaultGoals: NutritionGoals = {
  dailyCalorieGoal: null,
  dailyProteinGoal: null,
  dailyCarbGoal: null,
  dailyFatGoal: null,
  showMicronutrients: false,
  showSodium: false,
  showFiber: false,
  showSugar: false,
};

const defaultProfile: UserProfile = {
  id: 'default',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  goals: defaultGoals,
  unitSystem: 'metric',
  isFirstLaunch: true,
  isPremium: false,
  plan: 'free',
  trialEndsAt: null,
  freeScansDateKey: getTodayKey(),
  freeScansUsed: 0,
  healthGoal: null,
  email: null,
  loginMethod: null,
};

interface UserState {
  profile: UserProfile;
  setGoals: (goals: Partial<NutritionGoals>) => void;
  setUnitSystem: (system: 'metric' | 'imperial') => void;
  setProfile: (profile: Partial<UserProfile>) => void;
  incrementFreeScans: () => void;
  completeOnboarding: (
    data: Partial<UserProfile>,
    dynamicGoals: NutritionGoals,
  ) => void;
  startTrial: (durationDays: number) => void;
  loginUser: (email: string, method: 'google' | 'apple') => void;
  logoutUser: () => void;
  resetOnboarding: () => void;
  /** Returns true if the user can do one more AI scan under their current plan. */
  canScan: (
    freeQuotaPerDay: number,
    proQuotaPerDay: number,
  ) => { allowed: boolean; reason?: string };
  syncKeychainLimit: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      setGoals: goals =>
        set(state => ({
          profile: {
            ...state.profile,
            updatedAt: new Date().toISOString(),
            goals: { ...state.profile.goals, ...goals },
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
      setProfile: profile =>
        set(state => ({
          profile: {
            ...state.profile,
            ...profile,
            updatedAt: new Date().toISOString(),
          },
        })),
      incrementFreeScans: () =>
        set(state => {
          const todayKey = getTodayKey();
          const previousCount =
            state.profile.freeScansDateKey === todayKey
              ? state.profile.freeScansUsed
              : 0;
          const newCount = previousCount + 1;

          // Asynchronously write to hardware secure storage
          try {
            Keychain.setGenericPassword(todayKey, newCount.toString(), {
              service: SCAN_KEYCHAIN_SERVICE,
            }).catch((err: Error) =>
              console.warn(
                'Failed to save scans to keychain (expected if native module is not built):',
                err,
              ),
            );
          } catch {
            // Keychain is native, ignore on non-native environments
          }

          return {
            profile: {
              ...state.profile,
              freeScansDateKey: todayKey,
              freeScansUsed: newCount,
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      completeOnboarding: (data, dynamicGoals) =>
        set(state => ({
          profile: {
            ...state.profile,
            ...data,
            goals: { ...state.profile.goals, ...dynamicGoals },
            isFirstLaunch: false,
            updatedAt: new Date().toISOString(),
          },
        })),
      startTrial: durationDays =>
        set(state => {
          if (
            state.profile.trialEndsAt &&
            new Date(state.profile.trialEndsAt) > new Date()
          ) {
            return state; // Already in active trial
          }
          if (state.profile.plan !== 'free') {
            return state; // Already paid user
          }
          const trialEndsAt = new Date(
            Date.now() + durationDays * 24 * 60 * 60 * 1000,
          ).toISOString();
          return {
            profile: {
              ...state.profile,
              isPremium: true,
              plan: 'pro_plus', // Trial unlocks Pro+ features
              trialEndsAt,
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      loginUser: (email, method) =>
        set(state => ({
          profile: {
            ...state.profile,
            email,
            loginMethod: method,
            isPremium: true,
            updatedAt: new Date().toISOString(),
          },
        })),
      logoutUser: () =>
        set(state => {
          // Clear hardware secure storage on developer/manual logout
          try {
            Keychain.resetGenericPassword({
              service: SCAN_KEYCHAIN_SERVICE,
            }).catch((err: Error) =>
              console.warn('Failed to reset keychain scans:', err),
            );
          } catch {
            // Keychain is native, ignore on non-native environments
          }

          return {
            profile: {
              ...state.profile,
              email: null,
              loginMethod: null,
              isPremium: false,
              plan: 'free',
              trialEndsAt: null,
              freeScansDateKey: getTodayKey(),
              freeScansUsed: 0,
              updatedAt: new Date().toISOString(),
            },
          };
        }),
      canScan: (freeQuotaPerDay, proQuotaPerDay) => {
        const state = get();
        const profile = state.profile;
        const now = new Date();
        const todayKey = getTodayKey();
        const isInTrial =
          !!profile.trialEndsAt && new Date(profile.trialEndsAt) > now;
        const effectiveTier = isInTrial ? 'pro_plus' : profile.plan;

        // pro_plus = unlimited
        if (effectiveTier === 'pro_plus') {
          return { allowed: true };
        }

        const limit =
          effectiveTier === 'pro' ? proQuotaPerDay : freeQuotaPerDay;
        if (limit < 0) return { allowed: true };

        const scansUsedToday =
          profile.freeScansDateKey === todayKey ? profile.freeScansUsed : 0;

        if (scansUsedToday >= limit) {
          const upgradeMsg =
            effectiveTier === 'free'
              ? `Günlük ücretsiz ${limit} analiz hakkınız doldu. Pro'ya geçerek sınırsız analiz yapabilirsiniz!`
              : `Günlük Pro limitiniz (${limit}) doldu. Pro+ ile sınırsız analiz yapabilirsiniz!`;
          return { allowed: false, reason: upgradeMsg };
        }
        return { allowed: true };
      },
      resetOnboarding: () =>
        set(state => ({
          profile: {
            ...state.profile,
            isFirstLaunch: true,
            healthGoal: null,
            updatedAt: new Date().toISOString(),
          },
        })),
      syncKeychainLimit: async () => {
        try {
          const todayKey = getTodayKey();
          const credentials = await Keychain.getGenericPassword({
            service: SCAN_KEYCHAIN_SERVICE,
          });
          const keychainDateKey = credentials
            ? credentials.username ?? todayKey
            : todayKey;
          if (credentials && keychainDateKey === todayKey) {
            const keychainScans = parseInt(credentials.password, 10);
            const profile = get().profile;
            const scansUsedToday =
              profile.freeScansDateKey === todayKey ? profile.freeScansUsed : 0;
            if (!isNaN(keychainScans) && keychainScans > scansUsedToday) {
              set(state => ({
                profile: {
                  ...state.profile,
                  freeScansDateKey: todayKey,
                  freeScansUsed: keychainScans,
                  updatedAt: new Date().toISOString(),
                },
              }));
            }
          }
        } catch (error) {
          // Two known-benign failure modes are intentionally swallowed:
          //   1. Simulator runs without the keychain entitlement (the standard
          //      `Internal error when a required entitlement isn't present`).
          //   2. Tests / reduced environments without the native module linked.
          // Both are recoverable; surface only unknown failures so we don't
          // spam LogBox with redundant diagnostics on every foreground event.
          const message =
            error instanceof Error ? error.message : String(error);
          const isSimulatorEntitlementError =
            /required entitlement/i.test(message);
          if (!isSimulatorEntitlementError && __DEV__) {
            console.warn('Failed to sync scans from keychain:', error);
          }
        }
      },
    }),
    {
      name: 'user-profile',
      storage: createJSONStorage(() => userStorage),
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { profile: UserProfile };
        }
        return { profile: defaultProfile };
      },
      partialize: state => ({ profile: state.profile }),
    },
  ),
);
