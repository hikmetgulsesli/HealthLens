import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {colors, spacing, radii} from '../theme/colors';
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Bugün</Text>

        <View style={styles.ringCard}>
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
                <Text style={styles.ringValue}>{totals.cal}</Text>
                <Text style={styles.ringLabel}>/{goalCal} kcal</Text>
              </View>
            </View>
          </View>
          <Text style={styles.remaining}>Kalan: {remaining} kcal</Text>
        </View>

        <View style={styles.macroCard}>
          <MacroBar label="Protein" current={totals.protein} goal={goals.dailyProteinGoal ?? 120} color={colors.secondary} />
          <MacroBar label="Karbonhidrat" current={totals.carbs} goal={goals.dailyCarbGoal ?? 250} color={colors.tertiary} />
          <MacroBar label="Yağ" current={totals.fat} goal={goals.dailyFatGoal ?? 70} color={colors.error} />
        </View>

        <Text style={styles.sectionTitle}>Öğünler</Text>
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
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CameraTab' as never)}
        testID="cameraCaptureButton">
        <Text style={styles.fabText}>📷</Text>
      </TouchableOpacity>
    </View>
  );
}

function MacroBar({label, current, goal, color}: {label: string; current: number; goal: number; color: string}) {
  const pct = Math.min(current / goal, 1);
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, {width: `${pct * 100}%`, backgroundColor: color}]} />
      </View>
      <Text style={styles.macroText}>
        {current}/{goal}g
      </Text>
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
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: 16, gap: 12, paddingBottom: 100},
  header: {color: colors.onSurface, fontSize: 28, fontWeight: '700', marginBottom: 4},
  ringCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
  },
  ringContainer: {alignItems: 'center', marginVertical: 8},
  ringOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
  },
  ringCenter: {alignItems: 'center'},
  ringValue: {color: colors.onSurface, fontSize: 32, fontWeight: '700'},
  ringLabel: {color: colors.onSurfaceVariant, fontSize: 14},
  remaining: {color: colors.primary, fontSize: 14, fontWeight: '600', marginTop: 8},
  macroCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
  },
  macroRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  macroLabel: {color: colors.onSurfaceVariant, width: 90, fontSize: 13},
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  barFill: {height: '100%', borderRadius: 4},
  macroText: {color: colors.onSurface, fontSize: 12, width: 70, textAlign: 'right'},
  sectionTitle: {color: colors.onSurface, fontSize: 18, fontWeight: '700', marginTop: 8},
  emptyCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: {fontSize: 40},
  emptyText: {color: colors.onSurfaceVariant, fontSize: 14, textAlign: 'center'},
  mealCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 14,
    gap: 4,
  },
  mealHeader: {flexDirection: 'row', justifyContent: 'space-between'},
  mealCategory: {color: colors.onSurface, fontSize: 15, fontWeight: '600'},
  mealCal: {color: colors.primary, fontSize: 14, fontWeight: '700'},
  mealItems: {color: colors.onSurfaceVariant, fontSize: 12},
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
  fabText: {fontSize: 24},
});
