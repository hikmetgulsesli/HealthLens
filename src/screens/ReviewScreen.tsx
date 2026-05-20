import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors, spacing, radii} from '../theme/colors';
import {useAnalysisStore} from '../stores/analysisStore';
import {useLogStore} from '../stores/logStore';
import type {MealCategory} from '../types';

const MEAL_CATEGORIES: {label: string; value: MealCategory}[] = [
  {label: 'Kahvaltı', value: 'breakfast'},
  {label: 'Öğle', value: 'lunch'},
  {label: 'Akşam', value: 'dinner'},
  {label: 'Ara Öğün', value: 'snack'},
];

export function ReviewScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const analysis = useAnalysisStore(s => s.currentAnalysis);
  const updateItemPortion = useAnalysisStore(s => s.updateItemPortion);
  const removeItem = useAnalysisStore(s => s.removeItem);
  const setMealCategory = useAnalysisStore(s => s.setMealCategory);
  const addEntry = useLogStore(s => s.addEntry);

  const totals = useMemo(() => {
    if (!analysis) return {cal: 0, protein: 0, carbs: 0, fat: 0};
    return analysis.items.reduce(
      (acc, item) => {
        const ratio = item.estimatedPortionGrams / 100;
        acc.cal += item.caloriesPer100g * ratio;
        acc.protein += item.proteinPer100g * ratio;
        acc.carbs += item.carbsPer100g * ratio;
        acc.fat += item.fatPer100g * ratio;
        return acc;
      },
      {cal: 0, protein: 0, carbs: 0, fat: 0},
    );
  }, [analysis]);

  if (!analysis) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Analiz bulunamadı</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (analysis.items.length === 0) {
      Alert.alert('Hata', 'En az bir besin ekleyin.');
      return;
    }
    const dateKey = new Date().toISOString().split('T')[0];
    addEntry({
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dateKey,
      mealCategory: analysis.mealCategory,
      imageUri: analysis.imageUri,
      items: analysis.items,
      totalCalories: Math.round(totals.cal),
      totalProtein: Math.round(totals.protein),
      totalCarbs: Math.round(totals.carbs),
      totalFat: Math.round(totals.fat),
    });
    useAnalysisStore.getState().setAnalysis(null);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerAction}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sonuçları İncele</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageCard}>
          <Image
            source={{uri: analysis.imageUri}}
            style={styles.foodImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.categoryRow}>
          {MEAL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                analysis.mealCategory === cat.value &&
                  styles.categoryChipActive,
              ]}
              onPress={() => setMealCategory(cat.value)}>
              <Text
                style={[
                  styles.categoryText,
                  analysis.mealCategory === cat.value &&
                    styles.categoryTextActive,
                ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {analysis.items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemConfidence}>
                  Güven: %{Math.round(item.confidence * 100)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Porsiyon (g)</Text>
              <TextInput
                style={styles.portionInput}
                keyboardType="numeric"
                value={String(item.estimatedPortionGrams)}
                onChangeText={text => {
                  const val = parseInt(text, 10);
                  if (!isNaN(val) && val > 0) {
                    updateItemPortion(item.id, val);
                  }
                }}
              />
            </View>
            <View style={styles.macroRow}>
              <MacroBadge label="Kal" value={Math.round((item.caloriesPer100g * item.estimatedPortionGrams) / 100)} />
              <MacroBadge label="Prot" value={Math.round((item.proteinPer100g * item.estimatedPortionGrams) / 100)} />
              <MacroBadge label="Karb" value={Math.round((item.carbsPer100g * item.estimatedPortionGrams) / 100)} />
              <MacroBadge label="Yağ" value={Math.round((item.fatPer100g * item.estimatedPortionGrams) / 100)} />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Besin Ekle</Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Toplam</Text>
          <View style={styles.summaryRow}>
            <SummaryItem label="Kalori" value={`${Math.round(totals.cal)}`} />
            <SummaryItem label="Protein" value={`${Math.round(totals.protein)}g`} />
            <SummaryItem label="Karbonhidrat" value={`${Math.round(totals.carbs)}g`} />
            <SummaryItem label="Yağ" value={`${Math.round(totals.fat)}g`} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          testID="saveLogButton">
          <Text style={styles.saveButtonText}>Öğünü Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MacroBadge({label, value}: {label: string; value: number}) {
  return (
    <View style={styles.macroBadge}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function SummaryItem({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  emptyText: {color: colors.onSurface, textAlign: 'center', marginTop: 40},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  headerTitle: {color: colors.onSurface, fontSize: 17, fontWeight: '600'},
  headerAction: {color: colors.onSurface, fontSize: 20},
  content: {padding: 16, gap: 12},
  imageCard: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  foodImage: {width: '100%', height: 200},
  categoryRow: {flexDirection: 'row', gap: 8, flexWrap: 'wrap'},
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  categoryText: {color: colors.onSurfaceVariant, fontSize: 13},
  categoryTextActive: {color: colors.onPrimaryContainer, fontWeight: '600'},
  itemCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 16,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {color: colors.onSurface, fontSize: 16, fontWeight: '600'},
  itemConfidence: {color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2},
  deleteIcon: {fontSize: 18},
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderLabel: {color: colors.onSurfaceVariant, fontSize: 13},
  portionInput: {
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
  },
  macroRow: {flexDirection: 'row', gap: 8},
  macroBadge: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    padding: 8,
    alignItems: 'center',
  },
  macroValue: {color: colors.onSurface, fontSize: 14, fontWeight: '700'},
  macroLabel: {color: colors.onSurfaceVariant, fontSize: 10, marginTop: 2},
  addButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryContainer,
  },
  addButtonText: {color: colors.onSecondaryContainer, fontWeight: '600'},
  summaryCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    padding: 16,
    gap: 10,
  },
  summaryTitle: {color: colors.onSurface, fontSize: 16, fontWeight: '700'},
  summaryRow: {flexDirection: 'row', justifyContent: 'space-around'},
  summaryItem: {alignItems: 'center'},
  summaryValue: {color: colors.primary, fontSize: 20, fontWeight: '700'},
  summaryLabel: {color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2},
  footer: {
    padding: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderTopWidth: 0.5,
    borderTopColor: colors.outline,
  },
  saveButton: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  saveButtonText: {color: colors.onPrimaryContainer, fontSize: 16, fontWeight: '700'},
});
