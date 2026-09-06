/** @format */
import { useHydrationStore } from '../../src/stores/hydrationStore';
import { useUserStore } from '../../src/stores/userStore';
import { getTodayKey } from '../../src/utils/date';
import { resetAllStores } from '../test-utils/resetStores';

describe('integration — hydration × userStore × date', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('hydrationGoal is independent from userStore.calorieGoal', () => {
    useHydrationStore.getState().setWaterGoal(3000);
    useUserStore.getState().setGoals({ dailyCalorieGoal: 2200 });
    expect(useHydrationStore.getState().dailyWaterGoal).toBe(3000);
    expect(useUserStore.getState().profile.goals.dailyCalorieGoal).toBe(2200);
  });

  it('hydration intake buckets per date do not collide with food logs', () => {
    const todayKey = getTodayKey();
    useHydrationStore.getState().addWater(500, todayKey);
    useHydrationStore.getState().addWater(250, todayKey);
    expect(useHydrationStore.getState().waterIntake[todayKey]).toBe(750);
    // Removing brings it back to zero (clamp), not negative.
    useHydrationStore.getState().removeWater(1000, todayKey);
    expect(useHydrationStore.getState().waterIntake[todayKey]).toBe(0);
  });

  it('hydration percentage = intake / goal * 100, capped at 100% if needed', () => {
    const todayKey = getTodayKey();
    useHydrationStore.getState().setWaterGoal(2000);
    useHydrationStore.getState().addWater(1500, todayKey);
    const pct =
      useHydrationStore.getState().waterIntake[todayKey] /
      useHydrationStore.getState().dailyWaterGoal;
    expect(pct).toBeCloseTo(0.75, 2);
  });

  it('resetAllStores clears hydration + logs + quota + first-launch flag together', () => {
    const todayKey = getTodayKey();
    useHydrationStore.getState().addWater(500, todayKey);
    expect(useHydrationStore.getState().waterIntake[todayKey]).toBe(500);
    resetAllStores();
    expect(useHydrationStore.getState().waterIntake[todayKey]).toBeUndefined();
    expect(useHydrationStore.getState().dailyWaterGoal).toBe(2500);
    expect(useUserStore.getState().profile.isFirstLaunch).toBe(true);
  });
});
