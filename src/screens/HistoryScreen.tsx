import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {radii} from '../theme/radii';
import {typography, fontFamily} from '../theme/typography';
import {useLogStore} from '../stores/logStore';
import {useUserStore} from '../stores/userStore';
import {useNavigation} from '@react-navigation/native';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function HistoryScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const entries = useLogStore(s => s.entries);
  const dateKey = selectedDate.toISOString().split('T')[0];
  const dayEntries = entries[dateKey] ?? [];
  const goals = useUserStore(s => s.profile.goals);

  const totals = useMemo(() => {
    return dayEntries.reduce(
      (acc, e) => {
        acc.cal += e.totalCalories;
        acc.protein += e.totalProtein;
        acc.carbs += e.totalCarbs;
        acc.fat += e.totalFat;
        return acc;
      },
      {cal: 0, protein: 0, carbs: 0, fat: 0},
    );
  }, [dayEntries]);

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));

  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const goalCal = goals.dailyCalorieGoal ?? 2000;
  const goalProtein = goals.dailyProteinGoal ?? 120;
  const goalCarbs = goals.dailyCarbGoal ?? 200;
  const goalFat = goals.dailyFatGoal ?? 65;

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Geçmiş</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Calendar Picker */}
        <View style={styles.calendarRow}>
          {weekDays.map(d => {
            const key = d.toISOString().split('T')[0];
            const hasData = !!entries[key]?.length;
            const isSelected = key === dateKey;
            const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellActive,
                ]}
                onPress={() => setSelectedDate(d)}>
                <Text style={[styles.dayLabel, isSelected && styles.dayTextActive]}>
                  {DAYS[dayIndex]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextActive]}>
                  {d.getDate()}
                </Text>
                {hasData && <View style={styles.dayDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Totals Card */}
        <View style={styles.totalsCard}>
          <View style={styles.totalsHeader}>
            <Text style={styles.totalsTitle}>Günlük Özet</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Hedef</Text>
            </View>
          </View>
          <View style={styles.grid}>
            <MacroCard icon="🔥" label="Kalori" value={`${totals.cal}`} pct={totals.cal / goalCal} />
            <MacroCard icon="🥚" label="Protein" value={`${totals.protein}g`} pct={totals.protein / goalProtein} />
            <MacroCard icon="🌾" label="Karbonhidrat" value={`${totals.carbs}g`} pct={totals.carbs / goalCarbs} />
            <MacroCard icon="💧" label="Yağ" value={`${totals.fat}g`} pct={totals.fat / goalFat} />
          </View>
        </View>

        {/* Goals Comparison */}
        <View style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>HEDEFLERLE KARŞILAŞTIR</Text>
          <GoalBar label="Kalori" current={totals.cal} goal={goalCal} />
          <GoalBar label="Protein" current={totals.protein} goal={goalProtein} />
        </View>

        {/* Meal Log */}
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>BUGÜNKÜ KAYIT</Text>
          {dayEntries.length === 0 ? (
            <Text style={styles.emptyText}>Bu tarihte kayıt yok</Text>
          ) : (
            dayEntries.map(entry => (
              <View key={entry.id} style={styles.mealItem}>
                <View style={styles.mealThumb}>
                  <Text style={styles.mealThumbText}>🍽</Text>
                </View>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>
                    {entry.items.map(i => i.name).join(', ')}
                  </Text>
                  <Text style={styles.mealTime}>{categoryLabel(entry.mealCategory)}</Text>
                </View>
                <Text style={styles.mealCal}>{entry.totalCalories}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MacroCard({icon, label, value, pct}: {icon: string; label: string; value: string; pct: number}) {
  return (
    <View style={styles.macroCard}>
      <View style={styles.macroCardHeader}>
        <Text style={styles.macroCardIcon}>{icon}</Text>
        <Text style={styles.macroCardLabel}>{label}</Text>
      </View>
      <Text style={styles.macroCardValue}>{value}</Text>
      <View style={styles.macroCardBarTrack}>
        <View style={[styles.macroCardBarFill, {width: `${Math.min(pct * 100, 100)}%`}]} />
      </View>
    </View>
  );
}

function GoalBar({label, current, goal}: {label: string; current: number; goal: number}) {
  const pct = Math.min(current / goal, 1);
  const remaining = Math.max(goal - current, 0);
  return (
    <View style={styles.goalRow}>
      <Text style={styles.goalLabel}>{label}</Text>
      <View style={styles.goalBarTrack}>
        <View style={[styles.goalBarFill, {width: `${pct * 100}%`}]} />
        <View style={[styles.goalBarRemain, {width: `${(remaining / goal) * 100}%`}]} />
      </View>
      <Text style={styles.goalValue}>{goal}</Text>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['margin-mobile'],
    height: 64,
    backgroundColor: 'rgba(11,19,38,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71,89,105,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.primary,
    fontSize: 20,
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
    fontFamily: fontFamily.headline,
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  scrollContent: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: 80,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  calendarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 8,
  },
  dayCell: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(34,42,61,0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(136,147,148,0.2)',
    gap: 4,
  },
  dayCellActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  dayLabel: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  dayNumber: {
    ...typography.bodyLg,
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
  totalsCard: {
    backgroundColor: 'rgba(34,42,61,0.4)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(136,147,148,0.2)',
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
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  badge: {
    backgroundColor: 'rgba(0,109,119,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeText: {
    ...typography.labelCaps,
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing['gutter-mobile'],
  },
  macroCard: {
    backgroundColor: 'rgba(34,42,61,0.5)',
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'column',
    width: '47%',
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  macroCardIcon: {
    fontSize: 16,
  },
  macroCardLabel: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  macroCardValue: {
    ...typography.headlineLg,
    color: colors.onSurface,
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
  goalsCard: {
    backgroundColor: 'rgba(34,42,61,0.4)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(136,147,148,0.2)',
    gap: spacing.sm,
  },
  goalsTitle: {
    ...typography.labelCaps,
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
    ...typography.bodySm,
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
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    width: 64,
    textAlign: 'right',
  },
  logSection: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  logTitle: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  emptyText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 20,
  },
  mealItem: {
    backgroundColor: 'rgba(34,42,61,0.4)',
    borderRadius: radii.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(136,147,148,0.2)',
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
  mealThumbText: {
    fontSize: 20,
  },
  mealInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mealName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  mealTime: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  mealCal: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
});
