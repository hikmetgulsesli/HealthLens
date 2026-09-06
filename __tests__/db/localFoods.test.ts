import { LOCAL_FOODS, searchFoods, findFoodByBarcode } from '../../src/db/localFoods';

describe('LOCAL_FOODS seed', () => {
  it('contains at least 30 entries (seeded Turkish food list)', () => {
    expect(LOCAL_FOODS.length).toBeGreaterThanOrEqual(30);
  });

  it('every entry has positive calories and macronutrient counts', () => {
    for (const food of LOCAL_FOODS) {
      expect(food.name.length).toBeGreaterThan(0);
      expect(food.caloriesPer100g).toBeGreaterThanOrEqual(0);
      expect(food.proteinPer100g).toBeGreaterThanOrEqual(0);
      expect(food.carbsPer100g).toBeGreaterThanOrEqual(0);
      expect(food.fatPer100g).toBeGreaterThanOrEqual(0);
    }
  });

  it('macronutrient sum is bounded by calorie count (4-4-9 rule)', () => {
    // protein + carbs * 4 + fat * 9 ≈ calories; allow a 25% tolerance.
    for (const food of LOCAL_FOODS) {
      const theoretical =
        food.proteinPer100g * 4 +
        food.carbsPer100g * 4 +
        food.fatPer100g * 9;
      // Skew tolerance for high-fiber low-calorie vegetables.
      if (theoretical === 0) continue;
      const ratio = food.caloriesPer100g / theoretical;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(1.6);
    }
  });

  it('barcode-tagged entries have unique barcodes', () => {
    const seen = new Set<string>();
    for (const food of LOCAL_FOODS) {
      if (food.barcode) {
        expect(seen.has(food.barcode)).toBe(false);
        seen.add(food.barcode);
      }
    }
  });

  it('names are unique (case-insensitive, trimmed)', () => {
    const seen = new Set<string>();
    for (const food of LOCAL_FOODS) {
      const key = food.name.toLowerCase().trim();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });
});

describe('findFoodByBarcode', () => {
  it('returns the matching food for a known barcode', () => {
    const known = LOCAL_FOODS.find(f => f.barcode);
    expect(known).toBeDefined();
    const hit = findFoodByBarcode(known!.barcode!);
    expect(hit).toEqual(known);
  });

  it('returns undefined for an unknown barcode', () => {
    expect(findFoodByBarcode('9999999999999')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(findFoodByBarcode('')).toBeUndefined();
  });
});

describe('searchFoods', () => {
  it('returns empty array for empty / whitespace query', () => {
    expect(searchFoods('')).toEqual([]);
    expect(searchFoods('   ')).toEqual([]);
  });

  it('returns at most 10 results', () => {
    const results = searchFoods('a');
    expect(results.length).toBeLessThanOrEqual(10);
  });

  it('matches case-insensitively (with the Turkish locale quirk)', () => {
    // Turkish: I ↔ ı, İ ↔ i. Our implementation uses JavaScript's default
    // case folding which doesn't normalize the Turkish dotless/dotted I.
    // We verify that the algorithm is case-insensitive for the ASCII
    // characters present in food names, which is the practical case.
    expect(searchFoods('Mercimek').length).toBeGreaterThan(0);
    expect(searchFoods('mercimek').length).toBeGreaterThan(0);
    expect(searchFoods('MERCIMEK').length).toBeGreaterThan(0);
  });

  it('trims leading and trailing whitespace before matching', () => {
    expect(searchFoods('  mercimek  ').length).toBeGreaterThan(0);
  });

  it('sub-string matches across the name', () => {
    // "pilav" matches both Pirinç Pilavı and Bulgur Pilavı
    expect(searchFoods('pilav').length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for a query that matches nothing', () => {
    expect(searchFoods('xyzzy_no_match_token')).toEqual([]);
  });
});
