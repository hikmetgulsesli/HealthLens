import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { UserProfile } from '../../types';
import { SCHEMA_VERSION } from '../../utils/constants';

interface Props {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: Props): React.JSX.Element {
  const displayName = profile.email
    ? profile.loginMethod === 'google'
      ? 'Google Kullanıcısı'
      : 'Apple Kullanıcısı'
    : 'HealthLens Kullanıcısı';

  const displayId = profile.email
    ? profile.email
    : `Sistem Modülü: v${SCHEMA_VERSION}`;

  return (
    <View style={styles.profileCard}>
      <View style={styles.profileCardHeader}>
        <View style={styles.avatarGlowContainer}>
          <View style={styles.avatarInner}>
            <Icon name="psychology" size={32} color={colors.primary} />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileId}>{displayId}</Text>
          {profile.isPremium ? (
            <View style={styles.premiumBadge}>
              <Icon name="verified" size={12} color="#00e676" />
              <Text style={styles.premiumText}>💎 PREMIUM AKTİF</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Icon name="lock-open" size={12} color={colors.success} />
              <Text style={styles.freeText}>ÜCRETSİZ SÜRÜM</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarGlowContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  profileInfo: { flex: 1 },
  profileName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  profileId: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#00e67622',
  },
  premiumText: {
    ...typography.labelSm,
    color: '#00e676',
    fontWeight: '700',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: `${colors.success}22`,
  },
  freeText: {
    ...typography.labelSm,
    color: colors.success,
    fontWeight: '700',
  },
});
