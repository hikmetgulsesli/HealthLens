import { tr } from 'src/i18n';

describe('i18n — Turkish string contract', () => {
  it('exposes the product name on the root', () => {
    expect(tr.appName).toBe('HealthLens');
  });

  it('camera strings include every action the screen needs', () => {
    const requiredKeys = [
      'title',
      'alignFood',
      'gallery',
      'flashOn',
      'flashOff',
      'captureError',
      'errorTitle',
      'galleryError',
      'processing',
    ];
    for (const key of requiredKeys) {
      expect(typeof (tr.camera as Record<string, unknown>)[key]).toBe('string');
      expect(((tr.camera as Record<string, string>)[key]).length).toBeGreaterThan(0);
    }
  });

  it('alignFood message guides the user to center the dish', () => {
    expect(tr.camera.alignFood).toMatch(/çerçeve|hizalay/i);
  });

  it('dashboard strings include the macro labels + empty-state copy', () => {
    const requiredKeys = [
      'today',
      'dailyEnergy',
      'target',
      'kcalConsumed',
      'kcalRemaining',
      'macronutrients',
      'protein',
      'carbs',
      'fat',
      'todaysMeals',
      'emptyMeals',
      'totalLogged',
    ];
    for (const key of requiredKeys) {
      expect(typeof (tr.dashboard as Record<string, unknown>)[key]).toBe('string');
      expect(((tr.dashboard as Record<string, string>)[key]).length).toBeGreaterThan(0);
    }
    expect(tr.dashboard.protein.toLowerCase()).toBe('protein');
    expect(tr.dashboard.carbs.toLowerCase()).toBe('karbonhidrat');
    expect(tr.dashboard.fat.toLowerCase()).toBe('yağ');
  });

  it('history strings include the calendar + summary + optimal labels', () => {
    for (const key of [
      'title',
      'dailySummary',
      'optimal',
      'compareGoals',
      'todaysLog',
      'noEntries',
      'calories',
    ]) {
      expect(typeof (tr.history as Record<string, unknown>)[key]).toBe('string');
    }
    expect(tr.history.noEntries.toLowerCase()).toContain('kayıt yok');
  });

  it('review strings cover meal slot labels + save/cancel + errors', () => {
    const requiredKeys = [
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'addItem',
      'saveMeal',
      'retake',
      'noAnalysis',
      'errorNoItems',
      'portion',
    ];
    for (const key of requiredKeys) {
      expect(typeof (tr.review as Record<string, unknown>)[key]).toBe('string');
      expect(((tr.review as Record<string, string>)[key]).length).toBeGreaterThan(0);
    }
    expect(tr.review.breakfast.toLowerCase()).toBe('kahvaltı');
    expect(tr.review.lunch.toLowerCase()).toBe('öğle yemeği');
    expect(tr.review.dinner.toLowerCase()).toBe('akşam yemeği');
    expect(tr.review.snack.toLowerCase()).toBe('ara öğün');
  });

  it('profile / tabs / meals strings are populated (no empty)', () => {
    for (const section of ['profile', 'tabs', 'meals'] as const) {
      const obj = (tr as unknown as Record<string, Record<string, string>>)[section];
      for (const v of Object.values(obj)) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it('uses Turkish-specific characters where appropriate (ı, İ, ç, ş, ğ, ö, ü)', () => {
    const corpus = JSON.stringify(tr);
    expect(corpus).toMatch(/[ıİçşğöüÇŞĞÖÜ]/);
  });
});
