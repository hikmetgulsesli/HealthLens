import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useLogStore } from '../stores/logStore';
import { useUserStore } from '../stores/userStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { tr } from '../i18n';

import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { SyncStatusBanner } from '../components/dashboard/SyncStatusBanner';
import { CalorieRingSection } from '../components/dashboard/CalorieRingSection';
import { MacroProgressSection } from '../components/dashboard/MacroProgressSection';
import { HydrationSection } from '../components/dashboard/HydrationSection';
import { EmptyMealsCard } from '../components/dashboard/EmptyMealsCard';
import { MealCard } from '../components/dashboard/MealCard';
import { MealTotalsRow } from '../components/dashboard/MealTotalsRow';
import { CameraFab } from '../components/dashboard/CameraFab';

export function DashboardScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const entries = useLogStore(s => s.entries);
  const goals = useUserStore(s => s.profile.goals);
  const healthGoal = useUserStore(s => s.profile.healthGoal);
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);

  const queue = useOfflineQueueStore(s => s.queue);
  const isSyncing = useOfflineQueueStore(s => s.isProcessing);
  const processQueue = useOfflineQueueStore(s => s.processQueue);

  const todayKey = new Date().toISOString().split('T')[0];
  const pendingCount = useMemo(
    () => queue.filter(i => i.status === 'pending' || i.status === 'failed').length,
    [queue],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await processQueue();
    } finally {
      setIsRefreshing(false);
    }
  };

  const todayEntries = useMemo(
    () => entries[todayKey] ?? [],
    [entries, todayKey],
  );
  const totals = useMemo(() => {
    return todayEntries.reduce(
      (acc, e) => ({
        cal: acc.cal + e.totalCalories,
        protein: acc.protein + e.totalProtein,
        carbs: acc.carbs + e.totalCarbs,
        fat: acc.fat + e.totalFat,
      }),
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [todayEntries]);

  const goalCal = goals.dailyCalorieGoal ?? 2000;
  const remaining = Math.max(goalCal - totals.cal, 0);
  const hasEntries = todayEntries.length > 0;

  const handleMealPress = (entry: typeof todayEntries[number]) => {
    setAnalysis({
      id: entry.id,
      dateKey: entry.dateKey,
      createdAt: entry.createdAt,
      imageUri: entry.imageUri || '',
      mealCategory: entry.mealCategory,
      items: entry.items,
    });
    navigation.navigate('Review');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <DashboardHeader />

      {isSyncing && <SyncStatusBanner mode="syncing" pendingCount={pendingCount} />}
      {!isSyncing && pendingCount > 0 && (
        <SyncStatusBanner mode="pending" pendingCount={pendingCount} />
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
        <View style={styles.ringSection}>
          <Text style={styles.ringTitle}>{tr.dashboard.dailyEnergy}</Text>
          <Text style={styles.ringTarget}>
            {tr.dashboard.target}: {goalCal.toLocaleString()} kcal
          </Text>
          <CalorieRingSection consumed={totals.cal} goal={goalCal} />
          <View style={styles.ringFooter}>
            <Text style={styles.ringValue}>{Math.round(totals.cal)}</Text>
            <Text style={styles.ringFooterLabel}>
              {tr.dashboard.kcalConsumed}
            </Text>
            <Text style={styles.ringRemaining}>
              {remaining} {tr.dashboard.kcalRemaining}
            </Text>
          </View>
        </View>

        <MacroProgressSection
          title={tr.dashboard.macronutrients}
          proteinLabel={tr.dashboard.protein}
          carbsLabel={tr.dashboard.carbs}
          fatLabel={tr.dashboard.fat}
          totals={totals}
          goals={{
            protein: goals.dailyProteinGoal ?? 120,
            carbs: goals.dailyCarbGoal ?? 200,
            fat: goals.dailyFatGoal ?? 65,
          }}
        />

        <HydrationSection />

        <View style={styles.mealsSection}>
          <Text style={styles.mealsTitle}>{tr.dashboard.todaysMeals}</Text>

          {!hasEntries ? (
            <EmptyMealsCard
              emptyText={tr.dashboard.emptyMeals}
              ctaText="İlk öğünü fotoğraflayın"
              onPressCta={() => navigation.navigate('CameraTab')}
            />
          ) : (
            <View>
              {todayEntries.map(entry => (
                <MealCard
                  key={entry.id}
                  entry={entry}
                  healthGoal={healthGoal}
                  onPressOverride={handleMealPress}
                />
              ))}
              <MealTotalsRow
                label={tr.dashboard.totalLogged}
                entries={todayEntries}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <CameraFab onPress={() => navigation.navigate('CameraTab')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  ringSection: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.md,
  },
  ringTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  ringTarget: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  ringFooter: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  ringValue: {
    ...typography.headlineXl,
    color: colors.onSurface,
    fontWeight: '700',
  },
  ringFooterLabel: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  ringRemaining: {
    ...typography.bodySm,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  mealsSection: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing.md,
  },
  mealsTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
});
