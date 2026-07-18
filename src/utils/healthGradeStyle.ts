import { colors, withAlpha } from '../theme/colors';
import type { TextStyle, ViewStyle } from 'react-native';

export type HealthGrade = 'A' | 'B' | 'C' | 'D';

export interface GradeStyle {
  badgeStyle: ViewStyle;
  textStyle: TextStyle;
}

const PALETTE: Record<HealthGrade, { bg: string; fg: string }> = {
  A: { bg: withAlpha('#22C55E', 0.18), fg: '#22C55E' },
  B: { bg: withAlpha('#84CC16', 0.18), fg: '#84CC16' },
  C: { bg: withAlpha('#EAB308', 0.18), fg: '#EAB308' },
  D: { bg: withAlpha(colors.error, 0.18), fg: colors.error },
};

export function getGradeStyle(grade: HealthGrade): GradeStyle {
  const tone = PALETTE[grade];
  return {
    badgeStyle: { backgroundColor: tone.bg },
    textStyle: { color: tone.fg },
  };
}
