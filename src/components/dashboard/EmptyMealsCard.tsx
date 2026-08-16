import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Illustrations } from '../../assets/illustrations';

interface Props {
  emptyText: string;
  ctaText: string;
  onPressCta: () => void;
}

export function EmptyMealsCard({
  emptyText,
  ctaText,
  onPressCta,
}: Props): React.JSX.Element {
  return (
    <View style={styles.emptyCard}>
      <Image
        source={Illustrations.emptyPlate}
        style={styles.emptyPlateIllustration}
        resizeMode="contain"
        testID="dashboardEmptyPlate"
      />
      <Text style={styles.emptyText}>{emptyText}</Text>
      <TouchableOpacity
        style={styles.emptyCta}
        onPress={onPressCta}
        testID="dashboardFirstCaptureCta"
      >
        <Icon name="photo-camera" size={16} color={colors.onPrimary} />
        <Text style={styles.emptyCtaText}>{ctaText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    gap: spacing.sm,
  },
  emptyPlateIllustration: {
    width: 120,
    height: 120,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  emptyCtaText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
