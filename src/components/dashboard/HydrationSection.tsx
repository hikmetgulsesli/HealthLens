import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useHydrationStore } from '../../stores/hydrationStore';
import { getTodayKey } from '../../utils/date';

export function HydrationSection(): React.JSX.Element {
  const waterIntake = useHydrationStore(s => s.waterIntake);
  const dailyWaterGoal = useHydrationStore(s => s.dailyWaterGoal);
  const addWater = useHydrationStore(s => s.addWater);
  const removeWater = useHydrationStore(s => s.removeWater);

  const todayKey = getTodayKey();
  const todayWater = waterIntake[todayKey] ?? 0;
  const waterPct = Math.min(todayWater / dailyWaterGoal, 1);

  const [wavePhase, setWavePhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWavePhase(p => (p + 0.12) % (Math.PI * 2));
    }, 70);
    return () => clearInterval(timer);
  }, []);

  const getWavePath = (heightPct: number) => {
    const cardHeight = 150;
    const cardWidth = 350;
    const targetY = cardHeight - cardHeight * heightPct;
    const amplitude = heightPct === 0 ? 0 : 5;
    const y1 = targetY + Math.sin(wavePhase) * amplitude;
    const cpX = cardWidth / 2;
    const cpY = targetY + Math.cos(wavePhase) * amplitude;
    const y2 = targetY + Math.sin(wavePhase + Math.PI) * amplitude;
    return `M 0 ${y1} Q ${cpX} ${cpY} ${cardWidth} ${y2} L ${cardWidth} ${cardHeight} L 0 ${cardHeight} Z`;
  };

  return (
    <View style={styles.hydrationSection}>
      <Text style={styles.hydrationTitle}>Su Tüketimi</Text>
      <View style={styles.hydrationContainer}>
        <View style={styles.liquidCard}>
          <Svg width={350} height={150} style={StyleSheet.absoluteFill}>
            <Path
              d={getWavePath(waterPct)}
              fill={withAlpha(colors.primary, 0.45)}
            />
          </Svg>
          <View style={styles.liquidContent}>
            <Text style={styles.liquidValue}>
              {todayWater} ml <Text style={styles.liquidTarget}>/ {dailyWaterGoal} ml</Text>
            </Text>
            <Text style={styles.liquidPctText}>
              Hedefin %{Math.round(waterPct * 100)} kadarı tamamlandı
            </Text>
          </View>
        </View>
        <View style={styles.hydrationActionRow}>
          <TouchableOpacity
            style={styles.hydrationButton}
            activeOpacity={0.7}
            onPress={() => addWater(250, todayKey)}
          >
            <Icon name="local-cafe" size={16} color={colors.primary} />
            <Text style={styles.hydrationButtonText}>+ 250 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.hydrationButton}
            activeOpacity={0.7}
            onPress={() => addWater(500, todayKey)}
          >
            <Icon name="local-drink" size={16} color={colors.primary} />
            <Text style={styles.hydrationButtonText}>+ 500 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hydrationButton, styles.hydrationClearButton]}
            activeOpacity={0.7}
            onPress={() => removeWater(todayWater, todayKey)}
          >
            <Icon name="refresh" size={16} color={colors.error} />
            <Text style={[styles.hydrationButtonText, styles.hydrationClearText]}>
              Temizle
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hydrationSection: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.md,
  },
  hydrationTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  hydrationContainer: {
    gap: spacing.md,
  },
  liquidCard: {
    height: 150,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  liquidContent: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  liquidValue: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  liquidTarget: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontWeight: '400',
  },
  liquidPctText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  hydrationActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hydrationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
  },
  hydrationButtonText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
  },
  hydrationClearButton: {
    backgroundColor: `${colors.error}1A`,
  },
  hydrationClearText: {
    color: colors.error,
  },
});
