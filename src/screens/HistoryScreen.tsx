import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useLogStore } from '../stores/logStore';
import { useUserStore } from '../stores/userStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { tr } from '../i18n';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function HistoryScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const entries = useLogStore(s => s.entries);
  const deleteEntry = useLogStore(s => s.deleteEntry);
  const dateKey = selectedDate.toISOString().split('T')[0];
  const dayEntries = useMemo(() => entries[dateKey] ?? [], [entries, dateKey]);
  const goals = useUserStore(s => s.profile.goals);
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);

  const totals = useMemo(() => {
    return dayEntries.reduce(
      (acc, e) => {
        acc.cal += e.totalCalories;
        acc.protein += e.totalProtein;
        acc.carbs += e.totalCarbs;
        acc.fat += e.totalFat;
        return acc;
      },
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [dayEntries]);

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const goalCal = goals.dailyCalorieGoal ?? 2000;
  const goalProtein = goals.dailyProteinGoal ?? 120;
  const goalCarbs = goals.dailyCarbGoal ?? 200;
  const goalFat = goals.dailyFatGoal ?? 65;

  // Mock 7-day trend data
  const trendData = [60, 75, 85, 50, 70, 65, 80];
  const trendLabels = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.history.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Calendar Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarRow}
        >
          {weekDays.map(d => {
            const key = d.toISOString().split('T')[0];
            const hasData = !!entries[key]?.length;
            const isSelected = key === dateKey;
            const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.dayCell, isSelected && styles.dayCellActive]}
                onPress={() => setSelectedDate(d)}
              >
                <Text
                  style={[styles.dayLabel, isSelected && styles.dayTextActive]}
                >
                  {DAYS[dayIndex]}
                </Text>
                <Text
                  style={[styles.dayNumber, isSelected && styles.dayTextActive]}
                >
                  {d.getDate()}
                </Text>
                {hasData && <View style={styles.dayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Daily Summary Bento */}
        <View style={styles.glassPanel}>
          <View style={styles.totalsHeader}>
            <Text style={styles.totalsTitle}>{tr.history.dailySummary}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tr.history.optimal}</Text>
            </View>
          </View>
          <View style={styles.grid}>
            <MacroCard
              icon="local-fire-department"
              label="Calories"
              value={`${totals.cal}`}
              pct={totals.cal / goalCal}
            />
            <MacroCard
              icon="egg-alt"
              label="Protein"
              value={`${totals.protein}g`}
              pct={totals.protein / goalProtein}
            />
            <MacroCard
              icon="grain"
              label="Carbs"
              value={`${totals.carbs}g`}
              pct={totals.carbs / goalCarbs}
            />
            <MacroCard
              icon="water-drop"
              label="Fat"
              value={`${totals.fat}g`}
              pct={totals.fat / goalFat}
            />
          </View>
        </View>

        {/* Compare to Goals */}
        <View style={styles.glassPanel}>
          <Text style={styles.goalsTitle}>{tr.history.compareGoals}</Text>
          <GoalBar label="Calories" current={totals.cal} goal={goalCal} />
          <GoalBar
            label="Protein"
            current={totals.protein}
            goal={goalProtein}
          />
        </View>

        {/* Today's Log */}
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>{tr.history.todaysLog}</Text>
          {dayEntries.length === 0 ? (
            <Text style={styles.emptyText}>{tr.history.noEntries}</Text>
          ) : (
            dayEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.mealItem}
                onPress={() => {
                  setAnalysis({
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
                        onPress: () => deleteEntry(dateKey, entry.id),
                      },
                      { text: 'İptal', style: 'cancel' },
                    ],
                  );
                }}
              >
                <View style={styles.mealThumb}>
                  <Icon name="restaurant" size={20} color={colors.primary} />
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>
                    {entry.items.map(i => i.name).join(', ')}
                  </Text>
                  <View style={styles.mealTimeRow}>
                    <Icon
                      name="schedule"
                      size={14}
                      color={colors.onSurfaceVariant}
                    />
                    <Text style={styles.mealTime}>
                      {tr.meals[entry.mealCategory as keyof typeof tr.meals]} •{' '}
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.mealCal}>{entry.totalCalories}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 7-Day Trend */}
        <View style={styles.glassPanel}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>{tr.history.sevenDayTrend}</Text>
            <Text style={styles.trendSubtitle}>{tr.history.calories}</Text>
          </View>
          <View style={styles.trendChart}>
            {trendData.map((h, i) => (
              <View key={i} style={styles.trendBarWrap}>
                <View
                  style={[
                    styles.trendBar,
                    {
                      height: `${h}%`,
                      backgroundColor:
                        i === 6
                          ? colors.primary
                          : withAlpha(colors.primary, 0.3),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.trendLabel,
                    i === 6 && { color: colors.primary },
                  ]}
                >
                  {trendLabels[i]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroCard({
  icon,
  label,
  value,
  pct,
}: {
  icon: string;
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <View style={styles.macroCard}>
      <View style={styles.macroCardHeader}>
        <Icon name={icon} size={16} color={colors.onSurfaceVariant} />
        <Text style={styles.macroCardLabel}>{label}</Text>
      </View>
      <Text style={styles.macroCardValue}>{value}</Text>
      <View style={styles.macroCardBarTrack}>
        <View
          style={[
            styles.macroCardBarFill,
            { width: `${Math.min(pct * 100, 100)}%` },
          ]}
        />
      </View>
    </View>
  );
}

function GoalBar({
  label,
  current,
  goal,
}: {
  label: string;
  current: number;
  goal: number;
}) {
  const pct = Math.min(current / goal, 1);
  const remaining = Math.max(goal - current, 0);
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalLabel}>{label}</Text>
      <View style={styles.goalBarTrack}>
        <View style={[styles.goalBarFill, { width: `${pct * 100}%` }]} />
        <View
          style={[
            styles.goalBarRemain,
            { width: `${(remaining / goal) * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.goalValue}>{goal}</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['margin-mobile'],
    height: 64,
    backgroundColor: withAlpha(colors.surface, 0.8),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71,89,105,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: 16,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  calendarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 8,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: withAlpha(colors.surfaceContainerHigh, 0.4),
    borderWidth: 0.5,
    borderColor: withAlpha(colors.outline, 0.2),
    gap: 4,
  },
  dayCellActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  dayLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.onSurface,
  },
  dayTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  glassPanel: {
    backgroundColor: withAlpha(colors.surfaceContainerHigh, 0.4),
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: withAlpha(colors.outline, 0.2),
    gap: spacing.md,
  },
  totalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71,89,105,0.3)',
    paddingBottom: spacing.sm,
  },
  totalsTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  badge: {
    backgroundColor: withAlpha(colors.primaryContainer, 0.2),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['gutter-mobile'],
  },
  macroCard: {
    backgroundColor: withAlpha(colors.surfaceContainerHigh, 0.5),
    borderRadius: radii.lg,
    padding: spacing.sm,
    width: '47%',
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  macroCardLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  macroCardValue: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  macroCardBarTrack: {
    width: '100%',
    backgroundColor: colors.surfaceVariant,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  macroCardBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  goalsTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
    width: 64,
  },
  goalBarTrack: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  goalBarRemain: {
    height: '100%',
    backgroundColor: colors.outlineVariant,
  },
  goalValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    width: 64,
    textAlign: 'right',
  },
  logSection: {
    gap: spacing.sm,
  },
  logTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 20,
  },
  mealItem: {
    backgroundColor: withAlpha(colors.surfaceContainerHigh, 0.4),
    borderRadius: radii.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 0.5,
    borderColor: withAlpha(colors.outline, 0.2),
  },
  mealThumb: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mealInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurface,
    fontWeight: '600',
  },
  mealTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mealTime: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  mealCal: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.onSurface,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.onSurface,
  },
  trendSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  trendChart: {
    height: 128,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 16,
  },
  trendBarWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trendBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
