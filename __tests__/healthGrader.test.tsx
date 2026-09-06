import { calculateHealthGrade, getMealHealthGrade } from '../src/utils/healthGrader';
import type { FoodItem } from '../src/types';

describe('calculateHealthGrade', () => {
  test('standard grading rules (no goal)', () => {
    const healthy = calculateHealthGrade(80, 15, 10, 2, 4, 1, 0.1, null);
    expect(healthy.grade).toBe('A+');

    const junk = calculateHealthGrade(450, 2, 60, 25, 0.5, 30, 0.8, null);
    expect(junk.grade).toBe('D');
  });

  test('hypertension goal triggers high sodium penalty', () => {
    const highSodiumCal = 150;
    const pro = 10;
    const carb = 5;
    const fat = 4;
    const fiber = 2;
    const sugar = 1;
    const sodium = 0.4;

    const noGoal = calculateHealthGrade(highSodiumCal, pro, carb, fat, fiber, sugar, sodium, null);
    expect(noGoal.grade).toBe('B');

    const withHypertension = calculateHealthGrade(
      highSodiumCal, pro, carb, fat, fiber, sugar, sodium, 'hypertension',
    );
    expect(withHypertension.grade).toBe('C');
  });

  test('diabetes goal triggers high sugar penalty', () => {
    const cal = 60;
    const pro = 12;
    const carb = 15;
    const fat = 1;
    const fiber = 2;
    const sugar = 13;
    const sodium = 0.05;

    const noGoal = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, null);
    expect(noGoal.grade).toBe('A');

    const withDiabetes = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, 'diabetes');
    expect(withDiabetes.grade).toBe('C');
  });

  test('gut_health goal rewards high fiber foods', () => {
    const cal = 120;
    const pro = 5;
    const carb = 20;
    const fat = 2;
    const fiber = 5;
    const sugar = 3;
    const sodium = 0.05;

    const noGoal = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, null);
    expect(noGoal.grade).toBe('A');

    const withGutHealth = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, 'gut_health');
    expect(withGutHealth.grade).toBe('A+');
  });

  test('boundary: each grade label/color/description is non-empty', () => {
    for (const sugar of [0, 5, 25]) {
      const g = calculateHealthGrade(200, 5, 30, 10, 1, sugar, 0.3, null);
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.color.length).toBeGreaterThan(0);
      expect(g.description.length).toBeGreaterThan(0);
    }
  });

  test('weight_management goal does NOT trigger extra penalties', () => {
    const baseline = calculateHealthGrade(200, 10, 25, 8, 2, 5, 0.2, null);
    const wm = calculateHealthGrade(200, 10, 25, 8, 2, 5, 0.2, 'weight_management');
    expect(wm.grade).toBe(baseline.grade);
  });

  test('very high sodium reduces the grade relative to zero sodium', () => {
    const noSalt = calculateHealthGrade(150, 8, 12, 5, 1, 2, 0, null);
    const salty = calculateHealthGrade(150, 8, 12, 5, 1, 2, 1.5, null);
    const gradeRank = { 'A+': 6, A: 5, B: 4, C: 3, D: 2 };
    expect(gradeRank[salty.grade]).toBeLessThan(gradeRank[noSalt.grade]);
  });
});

describe('getMealHealthGrade', () => {
  function item(overrides: Partial<FoodItem>): FoodItem {
    return {
      id: 'x',
      name: 'Sample',
      confidence: 1,
      estimatedPortionGrams: 100,
      caloriesPer100g: 100,
      proteinPer100g: 5,
      carbsPer100g: 10,
      fatPer100g: 2,
      ...overrides,
    };
  }

  test('returns a neutral grade on empty list', () => {
    const empty = getMealHealthGrade([], null);
    const zero = calculateHealthGrade(0, 0, 0, 0, 0, 0, 0, null);
    expect(empty.grade).toBe(zero.grade);
  });

  test('handles a null/undefined items list gracefully', () => {
    // Pass undefined intentionally to exercise the runtime safety path.
    const empty = getMealHealthGrade(
      undefined as unknown as FoodItem[],
      null,
    );
    expect(empty.grade).toBeDefined();
  });

  test('weighted average per 100g reflects portion proportions', () => {
    // Zero out everything except calories so the baseline is deterministic.
    const items = [
      item({
        id: 'a',
        caloriesPer100g: 200,
        estimatedPortionGrams: 100,
        proteinPer100g: 0,
        carbsPer100g: 0,
        fatPer100g: 0,
        fiberPer100g: 0,
        sugarPer100g: 0,
        sodiumPer100g: 0,
      }),
      item({
        id: 'b',
        caloriesPer100g: 100,
        estimatedPortionGrams: 100,
        proteinPer100g: 0,
        carbsPer100g: 0,
        fatPer100g: 0,
        fiberPer100g: 0,
        sugarPer100g: 0,
        sodiumPer100g: 0,
      }),
    ];
    const baseline = calculateHealthGrade(150, 0, 0, 0, 0, 0, 0, null);
    const meal = getMealHealthGrade(items, null);
    expect(meal.grade).toBe(baseline.grade);
  });

  test('larger portion of healthy food lifts a meal grade', () => {
    const items = [
      item({ id: 'a', caloriesPer100g: 50, estimatedPortionGrams: 800, proteinPer100g: 15, fiberPer100g: 4 }),
      item({ id: 'b', caloriesPer100g: 500, estimatedPortionGrams: 200 }),
    ];
    const meal = getMealHealthGrade(items, null);
    expect(['A', 'A+']).toContain(meal.grade);
  });

  test('hypertension goal downgrades high-sodium meals', () => {
    const items = [
      item({ id: 'a', sodiumPer100g: 0.4, estimatedPortionGrams: 100 }),
      item({ id: 'b', sodiumPer100g: 0.4, estimatedPortionGrams: 100 }),
    ];
    const noGoal = getMealHealthGrade(items, null);
    const withGoal = getMealHealthGrade(items, 'hypertension');
    const gradeRank = { 'A+': 6, A: 5, B: 4, C: 3, D: 2 };
    expect(gradeRank[withGoal.grade]).toBeLessThanOrEqual(gradeRank[noGoal.grade]);
  });

  test('zero-weight items are skipped (totalWeight stays sane)', () => {
    const items = [
      item({ id: 'a', estimatedPortionGrams: 0, caloriesPer100g: 999 }),
      item({ id: 'b', estimatedPortionGrams: 100, caloriesPer100g: 50 }),
    ];
    const meal = getMealHealthGrade(items, null);
    // Healthy item wins because the zero-weight junk contributes 0 to totals.
    expect(['A', 'A+', 'B']).toContain(meal.grade);
  });
});

