import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../theme/colors';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useLogStore } from '../stores/logStore';
import { useUserStore } from '../stores/userStore';
import { useAnalysisStore } from '../stores/analysisStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import { tr } from '../i18n';

const C = colors;
const D = {
  bg: C.dashboardBackground,
  surface: C.dashboardSurface,
  surfaceContainer: C.dashboardSurfaceContainer,
  surfaceContainerHigh: C.dashboardSurfaceContainerHigh,
  surfaceVariant: C.dashboardSurfaceVariant,
  onSurface: C.dashboardOnSurface,
  onSurfaceVariant: C.dashboardOnSurfaceVariant,
  primary: C.dashboardPrimary,
  secondary: C.dashboardSecondary,
  tertiary: C.dashboardTertiary,
  outline: C.dashboardOutline,
};

export function DashboardScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const entries = useLogStore(s => s.entries);
  const deleteEntry = useLogStore(s => s.deleteEntry);
  const goals = useUserStore(s => s.profile.goals);
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);
  const todayKey = new Date().toISOString().split('T')[0];
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

  // SVG ring math
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - calPercent);

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Icon name="person" size={18} color={D.onSurfaceVariant} />
          </View>
          <Text style={styles.headerTitle}>{tr.appName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.todayLabel}>{tr.dashboard.today}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Icon name="calendar-today" size={20} color={D.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                stroke={D.surfaceContainerHigh}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={D.primary}
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
            barColor={D.primary}
          />
          <MacroBar
            label={tr.dashboard.carbs}
            current={totals.carbs}
            goal={goals.dailyCarbGoal ?? 200}
            barColor={D.secondary}
          />
          <MacroBar
            label={tr.dashboard.fat}
            current={totals.fat}
            goal={goals.dailyFatGoal ?? 65}
            barColor={D.tertiary}
          />
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <Text style={styles.mealsTitle}>{tr.dashboard.todaysMeals}</Text>
          {todayEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="no-meals" size={40} color={D.onSurfaceVariant} />
              <Text style={styles.emptyText}>{tr.dashboard.emptyMeals}</Text>
            </View>
          ) : (
            <>
              {todayEntries.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.mealCard}
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
                          onPress: () => deleteEntry(todayKey, entry.id),
                        },
                        { text: 'İptal', style: 'cancel' },
                      ],
                    );
                  }}
                >
                  <View style={styles.mealRow}>
                    <View style={styles.mealIconBox}>
                      <Icon
                        name={
                          entry.mealCategory === 'breakfast'
                            ? 'breakfast-dining'
                            : 'lunch-dining'
                        }
                        size={20}
                        color={
                          entry.mealCategory === 'breakfast'
                            ? D.primary
                            : D.secondary
                        }
                      />
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
                    <Text style={styles.mealCal}>
                      {entry.totalCalories} kcal
                    </Text>
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
    backgroundColor: D.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: withAlpha(D.surface, 0.8),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: D.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: D.onSurface,
    fontFamily: fontFamily.headline,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: D.onSurfaceVariant,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 24,
    paddingBottom: 140,
  },
  ringSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ringTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: D.onSurface,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  ringTarget: {
    fontSize: 15,
    lineHeight: 20,
    color: D.onSurfaceVariant,
    marginBottom: 16,
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
    lineHeight: 34,
    fontWeight: '700',
    color: D.onSurface,
    fontFamily: fontFamily.headline,
  },
  ringLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    color: D.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ringDivider: {
    width: 48,
    height: 1,
    backgroundColor: D.surfaceContainerHigh,
    marginVertical: 8,
  },
  ringRemaining: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: D.primary,
    fontFamily: fontFamily.headline,
  },
  ringRemainingLabel: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '600',
    color: withAlpha(D.primary, 0.7),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  macroTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: D.onSurface,
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: D.onSurfaceVariant,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValue: {
    fontSize: 15,
    lineHeight: 20,
    color: D.onSurface,
  },
  macroTarget: {
    fontSize: 11,
    lineHeight: 13,
    color: D.onSurfaceVariant,
  },
  barTrack: {
    width: '100%',
    backgroundColor: D.surfaceContainerHigh,
    borderRadius: radii.full,
    height: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  mealsSection: {
    gap: 12,
  },
  mealsTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: D.onSurface,
    paddingLeft: 4,
  },
  emptyCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: radii.lg,
    padding: 40,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: D.onSurfaceVariant,
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    backgroundColor: D.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  mealName: {
    fontSize: 17,
    lineHeight: 22,
    color: D.onSurface,
    fontWeight: '600',
  },
  mealTime: {
    fontSize: 11,
    lineHeight: 13,
    color: D.onSurfaceVariant,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  mealCal: {
    fontSize: 15,
    lineHeight: 20,
    color: D.primary,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: D.onSurfaceVariant,
  },
  totalValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: D.onSurface,
  },
});
