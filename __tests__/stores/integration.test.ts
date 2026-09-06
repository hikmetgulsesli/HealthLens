import { useAnalysisStore } from '../../src/stores/analysisStore';
import { useLogStore } from '../../src/stores/logStore';
import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';
import { useUserStore } from '../../src/stores/userStore';
import type { AnalysisResult, FoodItem, LogEntry } from '../../src/types';

function mkItem(
  id: string,
  name: string,
  cal: number,
  pro: number,
  carb: number,
  fat: number,
  portion = 100,
): FoodItem {
  return {
    id,
    name,
    confidence: 0.9,
    estimatedPortionGrams: portion,
    caloriesPer100g: cal,
    proteinPer100g: pro,
    carbsPer100g: carb,
    fatPer100g: fat,
  };
}

function resetStores(): void {
  useAnalysisStore.setState({
    currentAnalysis: null,
    isAnalyzing: false,
    imageUris: [],
  });
  useLogStore.setState({ entries: {} });
  useOfflineQueueStore.setState({ queue: [], isProcessing: false });
  useUserStore.setState(state => ({
    profile: { ...state.profile, isFirstLaunch: true, plan: 'free', isPremium: false },
  }));
}

describe('Integration: capture -> review -> log -> dashboard', () => {
  beforeEach(resetStores);

  it('seeds an analysis, propagates through to a log entry on save', () => {
    const todayKey = new Date().toISOString().split('T')[0];
    const items: FoodItem[] = [
      mkItem('a', 'Yogurt', 60, 5, 7, 2),
      mkItem('b', 'Honey', 300, 0, 80, 0),
    ];
    const analysis: AnalysisResult = {
      id: 'a1',
      items,
      mealCategory: 'breakfast',
      imageUri: 'file:///x.jpg',
      imageUris: ['file:///x.jpg'],
    };
    useAnalysisStore.getState().setAnalysis(analysis);

    // User edits portions via the portion slider.
    useAnalysisStore.getState().updateItemPortion('a', 200);
    expect(
      useAnalysisStore.getState().currentAnalysis!.items.find(i => i.id === 'a')!
        .estimatedPortionGrams,
    ).toBe(200);

    // User drops an item.
    useAnalysisStore.getState().removeItem('b');
    expect(useAnalysisStore.getState().currentAnalysis!.items).toHaveLength(1);

    // User picks a meal slot.
    useAnalysisStore.getState().setMealCategory('snack');
    expect(useAnalysisStore.getState().currentAnalysis!.mealCategory).toBe('snack');

    // Save: persist as a LogEntry with computed totals.
    const final = useAnalysisStore.getState().currentAnalysis!;
    const ratio = (item: FoodItem) => item.estimatedPortionGrams / 100;
    const totals = final.items.reduce(
      (acc, i) => ({
        cal: acc.cal + i.caloriesPer100g * ratio(i),
        pro: acc.pro + i.proteinPer100g * ratio(i),
        carb: acc.carb + i.carbsPer100g * ratio(i),
        fat: acc.fat + i.fatPer100g * ratio(i),
      }),
      { cal: 0, pro: 0, carb: 0, fat: 0 },
    );
    const entry: LogEntry = {
      id: final.id ?? 'auto',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateKey: todayKey,
      mealCategory: final.mealCategory,
      imageUri: final.imageUri ?? '',
      items: final.items,
      totalCalories: Math.round(totals.cal),
      totalProtein: Math.round(totals.pro),
      totalCarbs: Math.round(totals.carb),
      totalFat: Math.round(totals.fat),
    };
    useLogStore.getState().addEntry(entry);

    // Dashboard reads back the entry and sees a total matching the math.
    const list = useLogStore.getState().getEntriesForDate(todayKey);
    expect(list).toHaveLength(1);
    const saved = list[0];
    expect(saved.totalCalories).toBe(120); // 60 * 200/100 = 120
    expect(saved.totalProtein).toBe(10); // 5 * 200/100 = 10
    expect(saved.mealCategory).toBe('snack');

    // Editing the saved entry replaces the row.
    const editedEntry: LogEntry = {
      ...saved,
      items: [...saved.items, mkItem('c', 'Tea', 1, 0, 0.5, 0)],
      totalCalories: saved.totalCalories + 1,
    };
    useLogStore.getState().updateEntry(editedEntry);
    const listAfter = useLogStore.getState().getEntriesForDate(todayKey);
    expect(listAfter[0].items).toHaveLength(2);
    expect(listAfter[0].totalCalories).toBe(121);

    // Deletion removes the entry.
    useLogStore.getState().deleteEntry(todayKey, saved.id);
    expect(useLogStore.getState().getEntriesForDate(todayKey)).toHaveLength(0);
  });

  it('offline queue persists an item across the same session', () => {
    useOfflineQueueStore.getState().addToQueue({
      imageUri: 'file:///x.jpg',
      mealCategory: 'lunch',
    });
    expect(useOfflineQueueStore.getState().queue).toHaveLength(1);
    const item = useOfflineQueueStore.getState().queue[0];
    expect(item.status).toBe('pending');
    expect(item.retryCount).toBe(0);
    expect(item.nextRetryAt).toBeNull();
  });

  it('userStore quota is recomputed when freeScansUsed changes mid-day', () => {
    useUserStore.setState(state => ({
      profile: {
        ...state.profile,
        plan: 'free',
        freeScansUsed: 0,
        freeScansDateKey: new Date().toISOString().split('T')[0],
      },
    }));
    expect(useUserStore.getState().canScan(3, 100).allowed).toBe(true);
    for (let i = 0; i < 3; i += 1) {
      useUserStore.getState().incrementFreeScans();
    }
    expect(useUserStore.getState().canScan(3, 100).allowed).toBe(false);
  });

  it('userStore.isFirstLaunch flag is the gating signal between onboarding and main tabs', () => {
    // Default state is first-launch = true, so AppNavigator routes to Onboarding.
    expect(useUserStore.getState().profile.isFirstLaunch).toBe(true);
    // Once the user completes onboarding the flag flips.
    useUserStore.getState().completeOnboarding(
      { healthGoal: 'weight_management' },
      {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 100,
        dailyCarbGoal: 250,
        dailyFatGoal: 65,
        showMicronutrients: false,
        showSodium: false,
        showFiber: false,
        showSugar: false,
      },
    );
    expect(useUserStore.getState().profile.isFirstLaunch).toBe(false);
    expect(useUserStore.getState().profile.healthGoal).toBe('weight_management');
  });
});
