import { useHydrationStore } from '../../src/stores/hydrationStore';

describe('hydrationStore', () => {
  beforeEach(() => {
    useHydrationStore.setState({
      waterIntake: {},
      dailyWaterGoal: 2500,
    });
  });

  it('seeds with empty intake + 2500 ml goal', () => {
    expect(useHydrationStore.getState().waterIntake).toEqual({});
    expect(useHydrationStore.getState().dailyWaterGoal).toBe(2500);
  });

  it('addWater accumulates per-date ml', () => {
    useHydrationStore.getState().addWater(250, '2026-08-16');
    expect(useHydrationStore.getState().waterIntake['2026-08-16']).toBe(250);
    useHydrationStore.getState().addWater(500, '2026-08-16');
    expect(useHydrationStore.getState().waterIntake['2026-08-16']).toBe(750);
  });

  it('addWater isolates entries by date', () => {
    useHydrationStore.getState().addWater(250, '2026-08-16');
    useHydrationStore.getState().addWater(250, '2026-08-17');
    expect(useHydrationStore.getState().waterIntake).toEqual({
      '2026-08-16': 250,
      '2026-08-17': 250,
    });
  });

  it('removeWater subtracts from current intake', () => {
    useHydrationStore.getState().addWater(500, '2026-08-16');
    useHydrationStore.getState().removeWater(200, '2026-08-16');
    expect(useHydrationStore.getState().waterIntake['2026-08-16']).toBe(300);
  });

  it('removeWater clamps at zero (never goes negative)', () => {
    useHydrationStore.getState().addWater(100, '2026-08-16');
    useHydrationStore.getState().removeWater(500, '2026-08-16');
    expect(useHydrationStore.getState().waterIntake['2026-08-16']).toBe(0);
  });

  it('removeWater on missing date leaves intake unchanged', () => {
    useHydrationStore.getState().removeWater(200, '2099-01-01');
    expect(useHydrationStore.getState().waterIntake['2099-01-01']).toBe(0);
  });

  it('setWaterGoal overrides the daily target', () => {
    useHydrationStore.getState().setWaterGoal(3000);
    expect(useHydrationStore.getState().dailyWaterGoal).toBe(3000);
  });

  it('dashboard progress = current intake / goal (no rounding contract here)', () => {
    useHydrationStore.getState().setWaterGoal(2000);
    useHydrationStore.getState().addWater(1500, '2026-08-16');
    const pct =
      useHydrationStore.getState().waterIntake['2026-08-16'] /
      useHydrationStore.getState().dailyWaterGoal;
    expect(pct).toBeCloseTo(0.75, 2);
  });
});
