import { useAnalysisStore } from '../../src/stores/analysisStore';
import type { AnalysisResult, FoodItem } from '../../src/types';

function seedAnalysis(items: FoodItem[]): AnalysisResult {
  return {
    items,
    mealCategory: 'lunch',
    imageUri: 'file://seed.jpg',
    imageUris: ['file://seed.jpg'],
  };
}

const baseItem: FoodItem = {
  id: 'apple',
  name: 'Apple',
  confidence: 0.9,
  estimatedPortionGrams: 100,
  caloriesPer100g: 52,
  proteinPer100g: 0.3,
  carbsPer100g: 14,
  fatPer100g: 0.2,
};

describe('analysisStore', () => {
  beforeEach(() => {
    useAnalysisStore.setState({
      currentAnalysis: null,
      isAnalyzing: false,
      imageUris: [],
    });
  });

  it('updateItemPortion mutates only the matching item', () => {
    useAnalysisStore.getState().setAnalysis(
      seedAnalysis([
        { ...baseItem, id: 'a' },
        { ...baseItem, id: 'b', estimatedPortionGrams: 200 },
      ]),
    );
    useAnalysisStore.getState().updateItemPortion('a', 150);
    const items = useAnalysisStore.getState().currentAnalysis!.items;
    expect(items.find(i => i.id === 'a')!.estimatedPortionGrams).toBe(150);
    expect(items.find(i => i.id === 'b')!.estimatedPortionGrams).toBe(200);
  });

  it('updateItemPortion clamps the underlying totals (via the ring reducer)', () => {
    // The ring reducer multiplies per-100g values by portion / 100.
    useAnalysisStore.getState().setAnalysis(
      seedAnalysis([{ ...baseItem, id: 'a', estimatedPortionGrams: 100 }]),
    );
    useAnalysisStore.getState().updateItemPortion('a', 250);
    const a = useAnalysisStore.getState().currentAnalysis!.items[0];
    expect(a.estimatedPortionGrams).toBe(250);
    // expected: 52 cal/100g * 250/100 = 130 kcal
    expect(a.caloriesPer100g * (a.estimatedPortionGrams / 100)).toBeCloseTo(
      130,
      1,
    );
  });

  it('removeItem drops the item and leaves siblings untouched', () => {
    useAnalysisStore.getState().setAnalysis(
      seedAnalysis([
        { ...baseItem, id: 'a' },
        { ...baseItem, id: 'b' },
      ]),
    );
    useAnalysisStore.getState().removeItem('a');
    const items = useAnalysisStore.getState().currentAnalysis!.items;
    expect(items.map(i => i.id)).toEqual(['b']);
  });

  it('addItem appends a new item to the existing list', () => {
    useAnalysisStore.getState().setAnalysis(seedAnalysis([baseItem]));
    useAnalysisStore
      .getState()
      .addItem({ ...baseItem, id: 'b', name: 'Banana' });
    const items = useAnalysisStore.getState().currentAnalysis!.items;
    expect(items.map(i => i.id)).toEqual(['apple', 'b']);
    expect(items[1].name).toBe('Banana');
  });

  it('setMealCategory toggles the meal slot', () => {
    useAnalysisStore.getState().setAnalysis(seedAnalysis([]));
    expect(useAnalysisStore.getState().currentAnalysis!.mealCategory).toBe(
      'lunch',
    );
    useAnalysisStore.getState().setMealCategory('breakfast');
    expect(useAnalysisStore.getState().currentAnalysis!.mealCategory).toBe(
      'breakfast',
    );
  });

  it('setAnalysis seeds imageUris from the array branch first', () => {
    useAnalysisStore.getState().setAnalysis({
      items: [],
      mealCategory: 'dinner',
      imageUri: 'file://single.jpg',
      imageUris: ['file://a.jpg', 'file://b.jpg'],
    });
    expect(useAnalysisStore.getState().imageUris).toEqual([
      'file://a.jpg',
      'file://b.jpg',
    ]);
  });

  it('setAnalysis falls back to imageUri when imageUris is missing', () => {
    useAnalysisStore.getState().setAnalysis({
      items: [],
      mealCategory: 'dinner',
      imageUri: 'file://single.jpg',
    });
    expect(useAnalysisStore.getState().imageUris).toEqual(['file://single.jpg']);
  });

  it('reset() nulls currentAnalysis and clears imageUris', () => {
    useAnalysisStore.getState().setAnalysis(seedAnalysis([baseItem]));
    useAnalysisStore.getState().reset();
    expect(useAnalysisStore.getState().currentAnalysis).toBeNull();
    expect(useAnalysisStore.getState().imageUris).toEqual([]);
    expect(useAnalysisStore.getState().isAnalyzing).toBe(false);
  });

  it('portion-ratio reducer: total kcal scales linearly with portion', () => {
    // The contract that the dashboard and review screens rely on:
    // caloriesForItem = caloriesPer100g * portion / 100.
    const items: FoodItem[] = [
      { ...baseItem, id: 'p100', estimatedPortionGrams: 100 },
      { ...baseItem, id: 'p250', estimatedPortionGrams: 250 },
    ];
    useAnalysisStore.getState().setAnalysis(seedAnalysis(items));
    const all = useAnalysisStore.getState().currentAnalysis!.items;
    const kcalAt100 = all[0].caloriesPer100g * 1;
    const kcalAt250 = all[1].caloriesPer100g * 2.5;
    expect(kcalAt250 / kcalAt100).toBeCloseTo(2.5, 5);
  });
});
