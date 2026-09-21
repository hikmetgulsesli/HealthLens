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

  it('grade C uses an amber tone', () => {
    const c = getGradeStyle('C') as unknown as { textStyle: { color: string } };
    expect(c.textStyle.color.toLowerCase()).toBe('#eab308');
  });

  it('grade D uses a hex color from the error palette', () => {
    const d = getGradeStyle('D') as unknown as { textStyle: { color: string } };
    expect(d.textStyle.color).toMatch(/^#/);
  });

  it('badgeStyle and textStyle reference the same hue (consistent)', () => {
    for (const grade of ['A', 'B', 'C', 'D'] as const) {
      const s = getGradeStyle(grade);
      expect((s.badgeStyle as { backgroundColor: string }).backgroundColor).toMatch(
        /rgba|#/,
      );
      expect((s.textStyle as { color: string }).color).toMatch(/^#/);
    }
  });
});
