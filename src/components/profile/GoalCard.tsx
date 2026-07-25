import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  label: string;
  value: string;
  placeholder: string;
  unit: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  accentColor: string;
  accentInputColor: string;
  icon: string;
}

export function GoalCard({
  label,
  value,
  placeholder,
  unit,
  onChange,
  onBlur,
  onIncrement,
  onDecrement,
  accentColor,
  accentInputColor,
  icon,
}: Props): React.JSX.Element {
  return (
    <View style={styles.bentoCard}>
      <View style={styles.bentoCardHeader}>
        <Icon name={icon} size={20} color={accentColor} />
        <Text style={styles.bentoLabel}>{label}</Text>
      </View>
      <View style={styles.bentoAdjustRow}>
        <TouchableOpacity style={styles.adjustBtn} onPress={onDecrement}>
          <Icon name="remove" size={16} color={colors.onSurface} />
        </TouchableOpacity>
        <TextInput
          style={[styles.bentoInput, { borderColor: accentInputColor }]}
          keyboardType="numeric"
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.outline}
          onChangeText={onChange}
          onBlur={onBlur}
        />
        <TouchableOpacity style={styles.adjustBtn} onPress={onIncrement}>
          <Icon name="add" size={16} color={colors.onSurface} />
        </TouchableOpacity>
      </View>
      <Text style={styles.bentoUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bentoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bentoLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bentoAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  bentoInput: {
    flex: 1,
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    fontWeight: '700',
  },
  bentoUnit: {
    ...typography.labelSm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
