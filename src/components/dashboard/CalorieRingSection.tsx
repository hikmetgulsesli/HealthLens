import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Svg, Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRingSection({
  consumed,
  goal,
  size = 280,
  strokeWidth = 12,
}: Props): React.JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const calPercent = Math.min(consumed / goal, 1);
  const strokeDashoffset = circumference * (1 - calPercent);

  return (
    <View style={styles.ringContainer}>
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceContainer}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{Math.round(consumed)}</Text>
        <Text style={styles.ringUnit}>kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography.headlineXl,
    color: colors.onSurface,
    fontWeight: '700',
  },
  ringUnit: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
