import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { LogEntry } from '../../types';

interface Props {
  label: string;
  entries: LogEntry[];
}

export function MealTotalsRow({ label, entries }: Props): React.JSX.Element {
  const total = entries.reduce((s, e) => s + e.totalCalories, 0);
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={styles.totalValue}>{total.toLocaleString()} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  totalLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  totalValue: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
});
