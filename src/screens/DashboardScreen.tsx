import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {radii} from '../theme/radii';
import {typography, fontFamily} from '../theme/typography';
import {useLogStore} from '../stores/logStore';
import {useUserStore} from '../stores/userStore';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/AppNavigator';

export function DashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const entries = useLogStore(s => s.entries);
  const goals = useUserStore(s => s.profile.goals);
  const todayKey = new Date().toISOString().split('T')[0];
  const todayEntries = entries[todayKey] ?? [];

  const totals = useMemo(() => {
    return todayEntries.reduce(
      (acc, e) => {
        acc.cal += e.totalCalories;
        acc.protein += e.totalProtein;
        acc.carbs += e.totalCarbs;
        acc.fat += e.totalFat;
        return acc;
      },
      {cal: 0, protein: 0, carbs: 0, fat: 0},
    );
  }, [todayEntries]);

  const goalCal = goals.dailyCalorieGoal ?? 2000;
  const calPercent = Math.min(totals.cal / goalCal, 1);
  const remaining = Math.max(goalCal - totals.cal, 0);

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.headerTitle}>HealthLens</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.todayLabel}>Bugün</Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Calorie Progress Ring */}
        <View style={styles.ringSection}>
          <Text style={styles.ringTitle}>Günlük Enerji</Text>
          <Text style={styles.ringTarget}>Hedef: {goalCal.toLocaleString()} kcal</Text>
          <View style={styles.ringContainer}>
            <View style={[styles.ringOuter, {borderColor: colors.surfaceContainerHigh}]}>
              <View
                style={[
                  styles.ringInner,
                  {
                    borderColor: colors.primary,
                    borderBottomWidth: 8 * calPercent,
                    borderRightWidth: 8 * calPercent,
                    borderTopWidth: 8 * (calPercent > 0.5 ? 1 : 0),
                    borderLeftWidth: 8 * (calPercent > 0.75 ? 1 : 0),
                  },
                ]}
              />
              <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>{totals.cal.toLocaleString()}</Text>
                <Text style={styles.ringLabel}>kcal tüketildi</Text>
                <View style={styles.ringDivider} />
                <Text style={styles.ringRemaining}>{remaining}</Text>
                <Text style={styles.ringRemainingLabel}>kcal kaldı</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Macro Progress Bars */}
        <View style={styles.macroSection}>
          <Text style={styles.macroTitle}>Makro Besinler</Text>
          <MacroBar
            label="Protein"
            current={totals.protein}
            goal={goals.dailyProteinGoal ?? 120}
            barColor={colors.primary}
          />
          <MacroBar
            label="Karbonhidrat"
            current={totals.carbs}
            goal={goals.dailyCarbGoal ?? 200}
            barColor={colors.secondary}
          />
          <MacroBar
            label="Yağ"
            current={totals.fat}
            goal={goals.dailyFatGoal ?? 65}
            barColor={colors.tertiary}
          />
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.mealsTitle}>Bugünkü Öğünler</Text>
          {todayEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🍽</Text>
              <Text style={styles.emptyText}>İlk öğününüzü fotoğraflayın</Text>
            </View>
          ) : (
            todayEntries.map(entry => (
              <View key={entry.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealCategory}>{categoryLabel(entry.mealCategory)}</Text>
                  <Text style={styles.mealCal}>{entry.totalCalories} kcal</Text>
                </View>
                <Text style={styles.mealItems}>
                  {entry.items.map(i => i.name).join(', ')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Camera FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CameraTab' as never)}
        testID="cameraCaptureButton">
        <Text style={styles.fabText}>📷</Text>
      </TouchableOpacity>
    </View>
  );
}

function MacroBar({label, current, goal, barColor}: {label: string; current: number; goal: number; barColor: string}) {
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
        <View style={[styles.barFill, {width: `${pct * 100}%`, backgroundColor: barColor}]} />
      </View>
    </View>
  );
}

function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle',
    dinner: 'Akşam',
    snack: 'Ara Öğün',
  };
  return map[cat] ?? cat;
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
    width: '100%',
    zIndex: 50,
    backgroundColor: 'rgba(11,19,38,0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
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
  avatarText: {
    fontSize: 16,
  },
  headerTitle: {
    ...typography['headlineMd'],
    color: colors.onSurface,
    fontWeight: '700',
    fontFamily: fontFamily.headline,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['stack-sm'],
  },
  todayLabel: {
    ...typography['labelMd'],
    color: colors.onSurfaceVariant,
  },
  calendarIcon: {
    fontSize: 20,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingVertical: spacing['stack-md'],
    gap: spacing['stack-lg'],
    maxWidth: 672,
    alignSelf: 'center',
    paddingBottom: 120,
  },
  ringSection: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: spacing['stack-md'],
    flexDirection: 'column',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ringTitle: {
    ...typography['headlineMd'],
    color: colors.onSurface,
    marginBottom: spacing['stack-sm'],
    alignSelf: 'flex-start',
  },
  ringTarget: {
    ...typography['bodyMd'],
    color: colors.onSurfaceVariant,
    marginBottom: spacing['stack-md'],
    alignSelf: 'flex-start',
  },
  ringContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  ringOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
  },
  ringCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography['headlineLg'],
    color: colors.onSurface,
    fontWeight: '700',
    fontFamily: fontFamily.headline,
  },
  ringLabel: {
    ...typography['labelSm'],
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.48,
    marginTop: 4,
  },
  ringDivider: {
    width: 48,
    height: 1,
    backgroundColor: colors.surfaceContainerHigh,
    marginVertical: 8,
  },
  ringRemaining: {
    ...typography['headlineMd'],
    color: colors.primary,
    fontWeight: '700',
    fontFamily: fontFamily.headline,
  },
  ringRemainingLabel: {
    ...typography['labelSm'],
    color: 'rgba(130,211,222,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.48,
  },
  macroSection: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: spacing['stack-md'],
    flexDirection: 'column',
    gap: spacing['stack-md'],
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  macroTitle: {
    ...typography['bodyLg'],
    color: colors.onSurface,
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'column',
    gap: spacing['stack-sm'],
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  macroLabel: {
    ...typography['labelMd'],
    color: colors.onSurfaceVariant,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    ...typography['bodyMd'],
    color: colors.onSurface,
  },
  macroTarget: {
    ...typography['labelSm'],
    color: colors.onSurfaceVariant,
  },
  barTrack: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.full,
    height: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  mealsSection: {
    flexDirection: 'column',
    gap: spacing['stack-md'],
  },
  mealsTitle: {
    ...typography['headlineMd'],
    color: colors.onSurface,
    marginBottom: 4,
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    ...typography['bodySm'],
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: 14,
    gap: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealCategory: {
    ...typography['bodyMd'],
    color: colors.onSurface,
    fontWeight: '600',
  },
  mealCal: {
    ...typography['bodyMd'],
    color: colors.primary,
    fontWeight: '700',
  },
  mealItems: {
    ...typography['bodySm'],
    color: colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    fontSize: 24,
  },
});
