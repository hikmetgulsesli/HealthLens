import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { PlanDef } from '../../config/plans';

interface Props {
  plan: PlanDef;
  isSelected: boolean;
  onSelect: () => void;
  formatPrice: (cents: number) => string;
  formatPerMonth: (yearlyCents: number) => string;
}

export function PlanCard({
  plan,
  isSelected,
  formatPrice,
  formatPerMonth,
}: Props): React.JSX.Element {
  return (
    <View
      style={[styles.planCard, isSelected && styles.planCardSelected]}
    >
      {plan.isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>EN POPÜLER</Text>
        </View>
      )}
      <View style={styles.planHeader}>
        <View>
          <Text style={styles.planName}>{plan.displayName}</Text>
          <Text style={styles.planTagline}>{plan.tagline}</Text>
        </View>
        <View style={styles.checkBadge}>
          <Icon
            name={isSelected ? 'check' : 'add'}
            size={18}
            color={isSelected ? colors.primary : colors.onSurfaceVariant}
          />
        </View>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.priceValue}>{formatPrice(plan.monthlyCents)}</Text>
        <Text style={styles.priceUnit}>/ay</Text>
      </View>
      <Text style={styles.priceYearly}>
        Yıllık: {formatPerMonth(plan.yearlyCents)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  planCard: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.md,
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  popularText: {
    ...typography.labelSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  planTagline: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.15),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    ...typography.headlineXl,
    color: colors.onSurface,
    fontWeight: '700',
  },
  priceUnit: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  priceYearly: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
