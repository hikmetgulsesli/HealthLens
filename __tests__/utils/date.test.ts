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

  it('crosses midnight boundary into a new day', () => {
    const justBefore = new Date(2026, 11, 31, 23, 59, 59);
    // 23:59:59 Dec 31 stays in 2026-12-31; next day 00:00:01 is 2027-01-01.
    expect(getTodayKey(justBefore)).toBe('2026-12-31');
    const nextDay = new Date(2027, 0, 1, 0, 0, 1);
    expect(getTodayKey(nextDay)).toBe('2027-01-01');
  });
});
