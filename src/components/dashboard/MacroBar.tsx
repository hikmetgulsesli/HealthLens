import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  label: string;
  current: number;
  goal: number;
  barColor: string;
}

export function MacroBar({ label, current, goal, barColor, testID }: Props & { testID?: string }): React.JSX.Element {
  const pct = Math.min(current / goal, 1);
  return (
    <View
      style={styles.macroRow}
      testID={testID ?? `dashboardMacroBar-${label}`}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label} makro ilerlemesi`}
      accessibilityValue={{
        min: 0,
        max: Math.round(goal),
        now: Math.round(current),
      }}
    >
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <View style={styles.macroValueRow}>
          <Text style={styles.macroValue} testID={`macroValue-${label}`}>{current}g</Text>
          <Text style={styles.macroTarget}> / {goal}g</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%`, backgroundColor: barColor },
          ]}
          testID={`macroFill-${label}`}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  macroRow: {
    marginVertical: spacing.xs,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '500',
  },
  macroValueRow: {
    flexDirection: 'row',
  },
  macroValue: {
    ...typography.bodySm,
    color: colors.onSurface,
    fontWeight: '700',
  },
  macroTarget: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
});
