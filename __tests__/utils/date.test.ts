import { getTodayKey } from '../../src/utils/date';

describe('getTodayKey', () => {
  it('returns a YYYY-MM-DD string', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses local date components', () => {
    const fake = new Date(2026, 6, 18, 14, 30);
    expect(getTodayKey(fake)).toBe('2026-07-18');
  });

  it('pads single-digit months and days', () => {
    const fake = new Date(2026, 0, 5, 9, 0);
    expect(getTodayKey(fake)).toBe('2026-01-05');
  });
});
