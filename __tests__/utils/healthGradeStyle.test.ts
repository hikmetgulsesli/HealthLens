import { getGradeStyle } from '../../src/utils/healthGradeStyle';

describe('getGradeStyle', () => {
  it('returns badge and text style for each grade', () => {
    (['A', 'B', 'C', 'D'] as const).forEach(grade => {
      const result = getGradeStyle(grade);
      expect(result.badgeStyle).toBeDefined();
      expect(result.textStyle).toBeDefined();
    });
  });

  it('returns different colors per grade', () => {
    const a = getGradeStyle('A');
    const d = getGradeStyle('D');
    expect(a.badgeStyle.backgroundColor).not.toBe(d.badgeStyle.backgroundColor);
  });
});
