import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Image,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useLogStore, getStreakForEntries } from '../stores/logStore';
import { useUserStore } from '../stores/userStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { getMealHealthGrade } from '../utils/healthGrader';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';
import { useHydrationStore } from '../stores/hydrationStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { tr } from '../i18n';

import { Illustrations } from '../assets/illustrations';
const emptyPlateImage = Illustrations.emptyPlate;

export function DashboardScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const entries = useLogStore(s => s.entries);
  const deleteEntry = useLogStore(s => s.deleteEntry);
  const goals = useUserStore(s => s.profile.goals);
  const healthGoal = useUserStore(s => s.profile.healthGoal);
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);

  const queue = useOfflineQueueStore(s => s.queue);
  const isSyncing = useOfflineQueueStore(s => s.isProcessing);
  const processQueue = useOfflineQueueStore(s => s.processQueue);

  // Hydration Store
  const waterIntake = useHydrationStore(s => s.waterIntake);
  const dailyWaterGoal = useHydrationStore(s => s.dailyWaterGoal);
  const addWater = useHydrationStore(s => s.addWater);
  const removeWater = useHydrationStore(s => s.removeWater);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayWater = waterIntake[todayKey] ?? 0;
  const waterPct = Math.min(todayWater / dailyWaterGoal, 1);

  // Animated Wave Height
  const animatedWaterHeight = useRef(new Animated.Value(0)).current;
  const [wavePhase, setWavePhase] = useState(0);

  // Ripple effect state loop
  useEffect(() => {
    const timer = setInterval(() => {
      setWavePhase(prev => (prev + 0.15) % (2 * Math.PI));
    }, 70);
    return () => clearInterval(timer);
  }, []);

  // Spring animation for water filling
  useEffect(() => {
    Animated.spring(animatedWaterHeight, {
      toValue: waterPct,
      useNativeDriver: false,
      friction: 6,
      tension: 40,
    }).start();
  }, [waterPct, animatedWaterHeight]);

  const pendingCount = useMemo(() => {
    return queue.filter(
      item =>
        (item.status === 'pending' || item.status === 'failed') &&
        item.retryCount < 3,
    ).length;
  }, [queue]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    processQueue();
  }, [processQueue]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await processQueue();
    } finally {
      setIsRefreshing(false);
    }
  };

  const streak = useMemo(() => getStreakForEntries(entries), [entries]);

  const todayEntries = React.useMemo(
    () => entries[todayKey] ?? [],
    [entries, todayKey],
  );

  const totals = useMemo(() => {
    return todayEntries.reduce(
      (acc, e) => {
        acc.cal += e.totalCalories;
        acc.protein += e.totalProtein;
        acc.carbs += e.totalCarbs;
        acc.fat += e.totalFat;
        return acc;
      },
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [todayEntries]);

  const goalCal = goals.dailyCalorieGoal ?? 2000;
  const calPercent = Math.min(totals.cal / goalCal, 1);
  const remaining = Math.max(goalCal - totals.cal, 0);

  // SVG progress ring math
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - calPercent);

  const hasEntries = todayEntries.length > 0;

  // Wave math generator for liquid hydration card
  const getWavePath = (heightPct: number) => {
    const cardHeight = 150;
    const cardWidth = 350;
    const targetY = cardHeight - cardHeight * heightPct;

    // Amplitude & Frequency
    const amplitude = heightPct === 0 ? 0 : 5;
    const y1 = targetY + Math.sin(wavePhase) * amplitude;
    const cpX = cardWidth / 2;
    const cpY = targetY + Math.cos(wavePhase) * amplitude;
    const y2 = targetY + Math.sin(wavePhase + Math.PI) * amplitude;

    return `M 0 ${y1} Q ${cpX} ${cpY} ${cardWidth} ${y2} L ${cardWidth} ${cardHeight} L 0 ${cardHeight} Z`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
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
          <TouchableOpacity activeOpacity={0.7}>
            <Icon name="calendar-today" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Status Banner */}
      {isSyncing && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.syncText}>
            Senkronize ediliyor... ({pendingCount} yemek kaldı)
          </Text>
        </View>
      )}

      {!isSyncing && pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <Icon name="cloud-queue" size={16} color={colors.primary} />
          <Text style={styles.syncText}>
            İnternet bağlantısı bekleniyor... ({pendingCount} yemek sırada)
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Calorie Progress Ring */}
        <View style={styles.ringSection}>
          <Text style={styles.ringTitle}>{tr.dashboard.dailyEnergy}</Text>
          <Text style={styles.ringTarget}>
            {tr.dashboard.target}: {goalCal.toLocaleString()} kcal
          </Text>
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
              <Text style={styles.ringValue}>
                {totals.cal.toLocaleString()}
              </Text>
              <Text style={styles.ringLabel}>{tr.dashboard.kcalConsumed}</Text>
              <View style={styles.ringDivider} />
              <Text style={styles.ringRemaining}>{remaining}</Text>
              <Text style={styles.ringRemainingLabel}>
                {tr.dashboard.kcalRemaining}
              </Text>
            </View>
          </View>
        </View>

        {/* Macro Progress Bars */}
        <View style={styles.macroSection}>
          <Text style={styles.macroTitle}>{tr.dashboard.macronutrients}</Text>
          <MacroBar
            label={tr.dashboard.protein}
            current={totals.protein}
            goal={goals.dailyProteinGoal ?? 120}
            barColor={colors.primary}
          />
          <MacroBar
            label={tr.dashboard.carbs}
            current={totals.carbs}
            goal={goals.dailyCarbGoal ?? 200}
            barColor={colors.secondary}
          />
          <MacroBar
            label={tr.dashboard.fat}
            current={totals.fat}
            goal={goals.dailyFatGoal ?? 65}
            barColor={colors.tertiary}
          />
        </View>

        {/* [PREMIUM] Liquid Hydration Wave Card */}
        <View style={styles.hydrationSection}>
          <Text style={styles.hydrationTitle}>💧 Su Tüketimi</Text>
          <View style={styles.hydrationContainer}>
            {/* SVG liquid representation */}
            <View style={styles.liquidCard}>
              <Svg width={350} height={150} style={StyleSheet.absoluteFill}>
                <Path
                  d={getWavePath(waterPct)}
                  fill={withAlpha(colors.primary, 0.45)}
                />
              </Svg>

              <View style={styles.liquidContent}>
                <Text style={styles.liquidValue}>
                  {todayWater} ml{' '}
                  <Text style={styles.liquidTarget}>/ {dailyWaterGoal} ml</Text>
                </Text>
                <Text style={styles.liquidPctText}>
                  Hedefin %{Math.round(waterPct * 100)} kadarı tamamlandı
                </Text>
              </View>
            </View>

            {/* Hydration quick buttons */}
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
                <Text
                  style={[
                    styles.hydrationButtonText,
                    styles.hydrationClearText,
                  ]}
                >
                  Temizle
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.mealsTitle}>{tr.dashboard.todaysMeals}</Text>

          {!hasEntries ? (
            <View style={styles.emptyCard}>
              <Image
                source={emptyPlateImage}
                style={styles.emptyPlateIllustration}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>{tr.dashboard.emptyMeals}</Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => navigation.navigate('CameraTab')}
              >
                <Icon name="photo-camera" size={16} color={colors.onPrimary} />
                <Text style={styles.emptyCtaText}>İlk öğünü fotoğraflayın</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {todayEntries.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.mealCard}
                  onPress={() => {
                    setAnalysis({
                      id: entry.id, // CRUD Edit Mode active!
                      dateKey: entry.dateKey,
                      createdAt: entry.createdAt,
                      imageUri: entry.imageUri || '',
                      mealCategory: entry.mealCategory,
                      items: entry.items,
                    });
                    navigation.navigate('Review');
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      'Öğün İşlemleri',
                      'Bu öğün için ne yapmak istersiniz?',
                      [
                        {
                          text: 'Düzenle',
                          onPress: () => {
                            setAnalysis({
                              id: entry.id,
                              dateKey: entry.dateKey,
                              createdAt: entry.createdAt,
                              imageUri: entry.imageUri || '',
                              mealCategory: entry.mealCategory,
                              items: entry.items,
                            });
                            navigation.navigate('Review');
                          },
                        },
                        {
                          text: 'Sil',
                          style: 'destructive',
                          onPress: () => deleteEntry(todayKey, entry.id),
                        },
                        { text: 'İptal', style: 'cancel' },
                      ],
                    );
                  }}
                >
                  <View style={styles.mealRow}>
                    <View style={styles.mealIconBox}>
                      {entry.imageUri &&
                      !entry.imageUri.startsWith('barcode://') ? (
                        <Image
                          source={{ uri: entry.imageUri }}
                          style={styles.mealImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Icon
                          name={
                            entry.mealCategory === 'breakfast'
                              ? 'breakfast-dining'
                              : 'lunch-dining'
                          }
                          size={20}
                          color={
                            entry.mealCategory === 'breakfast'
                              ? colors.primary
                              : colors.secondary
                          }
                        />
                      )}
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>
                        {entry.items.map(i => i.name).join(', ')}
                      </Text>
                      <Text style={styles.mealTime}>
                        {tr.meals[entry.mealCategory as keyof typeof tr.meals]}{' '}
                        •{' '}
                        {new Date(entry.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {(() => {
                      const mealGrade = getMealHealthGrade(
                        entry.items,
                        healthGoal,
                      );
                      const gradeClass = mealGrade.grade.startsWith('A')
                        ? 'A'
                        : (mealGrade.grade as 'B' | 'C' | 'D');
                      const badgeStyle =
                        gradeClass === 'A'
                          ? styles.gradeBadgeA
                          : gradeClass === 'B'
                          ? styles.gradeBadgeB
                          : gradeClass === 'C'
                          ? styles.gradeBadgeC
                          : styles.gradeBadgeD;
                      const textStyle =
                        gradeClass === 'A'
                          ? styles.gradeTextA
                          : gradeClass === 'B'
                          ? styles.gradeTextB
                          : gradeClass === 'C'
                          ? styles.gradeTextC
                          : styles.gradeTextD;
                      return (
                        <View style={styles.mealCalSection}>
                          <View style={[styles.gradeBadge, badgeStyle]}>
                            <Text style={[styles.gradeBadgeText, textStyle]}>
                              {mealGrade.grade}
                            </Text>
                          </View>
                          <Text style={styles.mealCal}>
                            {entry.totalCalories} kcal
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  {tr.dashboard.totalLogged}
                </Text>
                <Text style={styles.totalValue}>
                  {todayEntries
                    .reduce((s, e) => s + e.totalCalories, 0)
                    .toLocaleString()}{' '}
                  kcal
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* FAB Camera Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CameraTab')}
        activeOpacity={0.8}
      >
        <Icon name="photo-camera" size={24} color={colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function MacroBar({
  label,
  current,
  goal,
  barColor,
}: {
  label: string;
  current: number;
  goal: number;
  barColor: string;
}) {
  const pct = Math.min(current / goal, 1);
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroLabelRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <View style={styles.macroValueRow}>
          <Text style={styles.macroValue}>{current}g</Text>
          <Text style={styles.macroTarget}> / {goal}g</Text>
        </View>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${pct * 100}%`, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['margin-mobile'],
    height: 56,
    backgroundColor: withAlpha(colors.surface, 0.8),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  scrollContent: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  ringSection: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  ringTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  ringTarget: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 280,
    height: 280,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  ringLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ringDivider: {
    width: 48,
    height: 1,
    backgroundColor: colors.surfaceContainer,
    marginVertical: 8,
  },
  ringRemaining: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: fontFamily.headline,
  },
  ringRemainingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: withAlpha(colors.primary, 0.7),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroSection: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: spacing.md,
  },
  macroTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 4,
  },
  macroRow: {
    gap: 4,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  macroTarget: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  barTrack: {
    width: '100%',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
    height: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  hydrationSection: {
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  hydrationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  hydrationContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  liquidCard: {
    width: 350,
    height: 150,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  liquidContent: {
    alignItems: 'center',
    zIndex: 10,
  },
  liquidValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  liquidTarget: {
    fontSize: 18,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  liquidPctText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hydrationActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
  },
  hydrationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    paddingVertical: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  hydrationButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  hydrationClearButton: {
    backgroundColor: withAlpha(colors.error, 0.08),
    borderColor: withAlpha(colors.error, 0.25),
  },
  hydrationClearText: {
    color: colors.error,
  },
  mealsSection: {
    gap: spacing.md,
  },
  mealsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    paddingLeft: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  emptyPlateIllustration: {
    width: 120,
    height: 120,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    marginTop: spacing.sm,
  },
  emptyCtaText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
    marginBottom: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  mealTime: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
    marginTop: 2,
  },
  mealCal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    marginTop: spacing.sm,
  },
  totalLabel: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 100,
  },
  syncBanner: {
    backgroundColor: withAlpha(colors.primary, 0.1),
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.primary, 0.15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  syncText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
  },
  mealImage: {
    width: '100%',
    height: '100%',
    borderRadius: radii.lg,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 145, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 145, 0, 0.35)',
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
  },
  streakText: {
    color: '#FF9100',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fontFamily.bodyMedium,
  },
  mealCalSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  gradeBadge: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  gradeBadgeA: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: 'rgba(0, 230, 118, 0.4)',
  },
  gradeTextA: {
    color: '#00E676',
  },
  gradeBadgeB: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderColor: 'rgba(20, 184, 166, 0.4)',
  },
  gradeTextB: {
    color: '#14B8A6',
  },
  gradeBadgeC: {
    backgroundColor: 'rgba(255, 167, 38, 0.15)',
    borderColor: 'rgba(255, 167, 38, 0.4)',
  },
  gradeTextC: {
    color: '#FFA726',
  },
  gradeBadgeD: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  gradeTextD: {
    color: '#EF4444',
  },
});
