import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface Props {
  label: string;
  value: string;
}

export function MacroBento({ label, value }: Props): React.JSX.Element {
  return (
    <View style={styles.bento}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bento: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
  },
  label: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
  },
  value: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
    marginTop: 2,
  },
});
