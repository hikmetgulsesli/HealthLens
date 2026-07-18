import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { MacroBar } from './MacroBar';

interface Props {
  title: string;
  proteinLabel: string;
  carbsLabel: string;
  fatLabel: string;
  totals: { protein: number; carbs: number; fat: number };
  goals: { protein: number; carbs: number; fat: number };
}

export function MacroProgressSection({
  title,
  proteinLabel,
  carbsLabel,
  fatLabel,
  totals,
  goals,
}: Props): React.JSX.Element {
  return (
    <View style={styles.macroSection}>
      <Text style={styles.macroTitle}>{title}</Text>
      <MacroBar
        label={proteinLabel}
        current={totals.protein}
        goal={goals.protein}
        barColor={colors.primary}
      />
      <MacroBar
        label={carbsLabel}
        current={totals.carbs}
        goal={goals.carbs}
        barColor={colors.secondary}
      />
      <MacroBar
        label={fatLabel}
        current={totals.fat}
        goal={goals.fat}
        barColor={colors.tertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  macroSection: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  macroTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
});
