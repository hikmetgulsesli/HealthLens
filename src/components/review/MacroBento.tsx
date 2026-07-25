import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface Props {
  label: string;
  value: string;
}

export function MacroBento({ label, value }: Props): React.JSX.Element {
  return (
    <View
      style={{
        padding: spacing.sm,
        borderRadius: 12,
        backgroundColor: colors.surfaceContainer,
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
          ...typography.headlineMd,
          color: colors.onSurface,
          fontWeight: '700',
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
