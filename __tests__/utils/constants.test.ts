import {
  APP_NAME,
  MIN_PORTION_GRAMS,
  MAX_PORTION_GRAMS,
  MIN_CALORIE_GOAL,
  MAX_CALORIE_GOAL,
  MAX_MACRO_GRAMS,
  SCHEMA_VERSION,
} from '../../src/utils/constants';

describe('constants', () => {
  it('APP_NAME is the product name', () => {
    expect(APP_NAME).toBe('HealthLens');
  });

  it('portion bounds are sane (1 g – 5 kg)', () => {
    expect(MIN_PORTION_GRAMS).toBe(1);
    expect(MAX_PORTION_GRAMS).toBe(5000);
    expect(MIN_PORTION_GRAMS).toBeLessThan(MAX_PORTION_GRAMS);
  });

  it('calorie goal bounds mirror PRD §10 (500 – 10000 kcal)', () => {
    expect(MIN_CALORIE_GOAL).toBe(500);
    expect(MAX_CALORIE_GOAL).toBe(10000);
  });

  it('macro gram ceiling is 500 (PRD §10)', () => {
    expect(MAX_MACRO_GRAMS).toBe(500);
  });

  it('schema version is a positive integer (used by zustand persist)', () => {
    expect(SCHEMA_VERSION).toBeGreaterThan(0);
    expect(Number.isInteger(SCHEMA_VERSION)).toBe(true);
  });
});
