import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useLogStore } from '../../stores/logStore';
import { getStreakForEntries } from '../../stores/logStore';
import { tr } from '../../i18n';

export function DashboardHeader(): React.JSX.Element {
  const entries = useLogStore(s => s.entries);
  const streak = getStreakForEntries(entries);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          <Icon name="person" size={18} color={colors.onSurfaceVariant} />
        </View>
        <Text style={styles.headerTitle}>{tr.appName}</Text>
      </View>
      <View style={styles.headerRight}>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Icon name="local-fire-department" size={16} color="#FF9100" />
            <Text style={styles.streakText}>{streak} Gün</Text>
          </View>
        )}
        <Text style={styles.todayLabel}>{tr.dashboard.today}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF910033',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    ...typography.labelMd,
    color: '#FF9100',
    fontWeight: '700',
  },
  todayLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
});
