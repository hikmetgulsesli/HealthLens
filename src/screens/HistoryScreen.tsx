import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {colors, spacing, radii} from '../theme/colors';
import {useLogStore} from '../stores/logStore';
import {useUserStore} from '../stores/userStore';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function HistoryScreen(): React.JSX.Element {
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Geçmiş</Text>

        <View style={styles.calendarRow}>
          {weekDays.map(d => {
            const key = d.toISOString().split('T')[0];
            const hasData = !!entries[key]?.length;
            const isSelected = key === dateKey;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(d)}>
                <Text style={[styles.dayLabel, isSelected && styles.dayTextSelected]}>
                  {DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                </Text>
                <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                  {d.getDate()}
                </Text>
                {hasData && <View style={styles.dayDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>{dateKey}</Text>
          <View style={styles.totalRow}>
            <TotalItem label="Kalori" value={`${totals.cal}`} />
            <TotalItem label="Protein" value={`${totals.protein}g`} />
            <TotalItem label="Karbonhidrat" value={`${totals.carbs}g`} />
            <TotalItem label="Yağ" value={`${totals.fat}g`} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Öğünler</Text>
        {dayEntries.length === 0 ? (
          <Text style={styles.emptyText}>Bu tarihte kayıt yok</Text>
        ) : (
          dayEntries.map(entry => (
            <View key={entry.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealCategory}>{categoryLabel(entry.mealCategory)}</Text>
                <Text style={styles.mealCal}>{entry.totalCalories} kcal</Text>
              </View>
              <Text style={styles.mealItems}>
                {entry.items.map(i => `${i.name} (${i.estimatedPortionGrams}g)`).join(', ')}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TotalItem({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.totalItem}>
      <Text style={styles.totalValue}>{value}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
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
  content: {padding: 16, gap: 12, paddingBottom: 40},
  header: {color: colors.onSurface, fontSize: 28, fontWeight: '700', marginBottom: 4},
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 12,
  },
  dayCell: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    gap: 4,
  },
  dayCellSelected: {backgroundColor: colors.primaryContainer},
  dayLabel: {color: colors.onSurfaceVariant, fontSize: 11},
  dayNumber: {color: colors.onSurface, fontSize: 16, fontWeight: '600'},
  dayTextSelected: {color: colors.onPrimaryContainer, fontWeight: '700'},
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  totalCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 16,
    gap: 10,
  },
  totalTitle: {color: colors.onSurfaceVariant, fontSize: 12, textTransform: 'uppercase'},
  totalRow: {flexDirection: 'row', justifyContent: 'space-around'},
  totalItem: {alignItems: 'center'},
  totalValue: {color: colors.onSurface, fontSize: 18, fontWeight: '700'},
  totalLabel: {color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2},
  sectionTitle: {color: colors.onSurface, fontSize: 18, fontWeight: '700', marginTop: 8},
  emptyText: {color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 20},
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
});
