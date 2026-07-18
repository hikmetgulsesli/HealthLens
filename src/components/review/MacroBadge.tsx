import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface Props {
  label: string;
  value: string;
}

export function MacroBadge({ label, value }: Props): React.JSX.Element {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
      }}
    >
      <Text
        style={{
          ...typography.labelCaps,
          color: colors.onSurfaceVariant,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...typography.bodyMd,
          color: colors.onSurface,
          fontWeight: '600',
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
