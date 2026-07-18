import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

interface Props {
  mode: 'syncing' | 'pending';
  pendingCount: number;
}

export function SyncStatusBanner({ mode, pendingCount }: Props): React.JSX.Element {
  return (
    <View style={styles.syncBanner}>
      {mode === 'syncing' ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Icon name="cloud-queue" size={16} color={colors.primary} />
      )}
      <Text style={styles.syncText}>
        {mode === 'syncing'
          ? `Senkronize ediliyor... (${pendingCount} yemek kaldı)`
          : `İnternet bağlantısı bekleniyor... (${pendingCount} yemek sırada)`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.sm,
    backgroundColor: `${colors.primary}1A`,
  },
  syncText: {
    ...typography.bodySm,
    color: colors.primary,
  },
});
