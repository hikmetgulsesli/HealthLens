import { calculateHealthGrade } from '../src/utils/healthGrader';

describe('calculateHealthGrade', () => {
  test('standard grading rules (no goal)', () => {
    // Standard healthy food: low calories, high protein, high fiber
    const healthy = calculateHealthGrade(80, 15, 10, 2, 4, 1, 0.1, null);
    expect(healthy.grade).toBe('A+');

    // Junk food: high calorie, high fat, high sugar
    const junk = calculateHealthGrade(450, 2, 60, 25, 0.5, 30, 0.8, null);
    expect(junk.grade).toBe('D');
  });

  test('hypertension goal triggers high sodium penalty', () => {
    // High sodium food (400mg sodium per 100g)
    const highSodiumCal = 150;
    const pro = 10;
    const carb = 5;
    const fat = 4;
    const fiber = 2;
    const sugar = 1;
    const sodium = 0.4; // 400mg

    // Without hypertension goal: should be a standard B grade
    const noGoal = calculateHealthGrade(highSodiumCal, pro, carb, fat, fiber, sugar, sodium, null);
    expect(noGoal.grade).toBe('B');

    // With hypertension goal: must be capped at C
    const withHypertension = calculateHealthGrade(
      highSodiumCal,
      pro,
      carb,
      fat,
      fiber,
      sugar,
      sodium,
      'hypertension',
    );
    expect(withHypertension.grade).toBe('C');
  });

  test('diabetes goal triggers high sugar penalty', () => {
    // High sugar food (13g sugar per 100g)
    const cal = 60;
    const pro = 12;
    const carb = 15;
    const fat = 1;
    const fiber = 2;
    const sugar = 13; // > 12g
    const sodium = 0.05;

    // Without diabetes goal: should be an A grade (76.6 score)
    const noGoal = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, null);
    expect(noGoal.grade).toBe('A');

    // With diabetes goal: must be capped at C
    const withDiabetes = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, 'diabetes');
    expect(withDiabetes.grade).toBe('C');
  });

  test('gut_health goal rewards high fiber foods', () => {
    // Fiber rich food (5g fiber per 100g)
    const cal = 120;
    const pro = 5;
    const carb = 20;
    const fat = 2;
    const fiber = 5;
    const sugar = 3;
    const sodium = 0.05;

    // Without goal: score is 86 (A)
    const noGoal = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, null);
    expect(noGoal.grade).toBe('A');

    // With gut_health goal: score is boosted to 93.5 (A+)
    const withGutHealth = calculateHealthGrade(cal, pro, carb, fat, fiber, sugar, sodium, 'gut_health');
    expect(withGutHealth.grade).toBe('A+');
  });
});
