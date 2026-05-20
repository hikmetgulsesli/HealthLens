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
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {radii} from '../theme/radii';
import {typography, fontFamily} from '../theme/typography';
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageCard}>
            <Image
              source={{uri: analysis.imageUri}}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.categoryRow}>
          {MEAL_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryChip,
                analysis.mealCategory === cat.value && styles.categoryChipActive,
              ]}
              onPress={() => setMealCategory(cat.value)}>
              <Text
                style={[
                  styles.categoryText,
                  analysis.mealCategory === cat.value && styles.categoryTextActive,
                ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Item Cards */}
        {analysis.items.map(item => (
          <View key={item.id} style={styles.itemCard}>
            {/* Header */}
            <View style={styles.itemHeader}>
              <View style={styles.itemHeaderLeft}>
                <View style={styles.itemIcon}>
                  <Text style={styles.itemIconText}>🍽</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text style={styles.deleteIcon}>🗑</Text>
              </TouchableOpacity>
            </View>

            {/* Portion Slider */}
            <View style={styles.portionSection}>
              <View style={styles.portionLabelRow}>
                <Text style={styles.portionLabel}>Porsiyon</Text>
                <Text style={styles.portionValue}>{item.estimatedPortionGrams}g</Text>
              </View>
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

            {/* Macros Data */}
            <View style={styles.macroSection}>
              <View style={styles.macroLeft}>
                <Text style={styles.macroLabelSmall}>Energy</Text>
                <View style={styles.macroValueRow}>
                  <Text style={styles.macroValueLarge}>
                    {Math.round((item.caloriesPer100g * item.estimatedPortionGrams) / 100)}
                  </Text>
                  <Text style={styles.macroUnit}>kcal</Text>
                </View>
              </View>
              <View style={styles.macroRight}>
                <MacroBadge label="PRO" value={`${Math.round((item.proteinPer100g * item.estimatedPortionGrams) / 100)}g`} />
                <MacroBadge label="CARB" value={`${Math.round((item.carbsPer100g * item.estimatedPortionGrams) / 100)}g`} />
                <MacroBadge label="FAT" value={`${Math.round((item.fatPer100g * item.estimatedPortionGrams) / 100)}g`} />
              </View>
            </View>
          </View>
        ))}

        {/* Add Item Button */}
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Besin Ekle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Summary Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>TOPLAM BESİN</Text>
              <View style={styles.summaryValueRow}>
                <Text style={styles.summaryValue}>{Math.round(totals.cal)}</Text>
                <Text style={styles.summaryUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <MacroBento label="PRO" value={`${Math.round(totals.protein)}g`} />
              <MacroBento label="CARB" value={`${Math.round(totals.carbs)}g`} />
              <MacroBento label="FAT" value={`${Math.round(totals.fat)}g`} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.retakeText}>Tekrar Çek</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              testID="saveLogButton">
              <Text style={styles.saveText}>Öğünü Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function MacroBadge({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.macroBadge}>
      <Text style={styles.macroBadgeLabel}>{label}</Text>
      <Text style={styles.macroBadgeValue}>{value}</Text>
    </View>
  );
}

function MacroBento({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.macroBento}>
      <Text style={styles.macroBentoLabel}>{label}</Text>
      <Text style={styles.macroBentoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 260,
  },
  emptyText: {
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: 40,
    ...typography.bodyMd,
  },
  imageSection: {
    width: '100%',
    maxWidth: 672,
    alignSelf: 'center',
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  imageCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodImage: {
    width: '100%',
    height: 256,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing['margin-mobile'],
    paddingBottom: spacing.md,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  categoryText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
  itemCard: {
    backgroundColor: 'rgba(23,31,51,0.4)',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(62,73,74,0.4)',
    flexDirection: 'column',
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: spacing['margin-mobile'],
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(62,73,74,0.3)',
  },
  itemIconText: {
    fontSize: 16,
  },
  itemName: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
  },
  deleteIcon: {
    fontSize: 20,
    color: colors.outline,
  },
  portionSection: {
    paddingHorizontal: 4,
  },
  portionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  portionLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  portionValue: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  portionInput: {
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    textAlign: 'center',
    ...typography.bodyMd,
  },
  macroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(62,73,74,0.2)',
  },
  macroLeft: {
    flexDirection: 'column',
  },
  macroLabelSmall: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValueLarge: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  macroUnit: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  macroRight: {
    flexDirection: 'row',
    gap: 16,
  },
  macroBadge: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  macroBadgeLabel: {
    ...typography.labelCaps,
    color: colors.outline,
    marginBottom: 4,
  },
  macroBadgeValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '500',
  },
  addButton: {
    width: '100%',
    paddingVertical: 16,
    marginTop: 8,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(136,147,148,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing['margin-mobile'],
  },
  addButtonText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.48,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11,19,38,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(62,73,74,0.3)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 40,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomContent: {
    maxWidth: 672,
    alignSelf: 'center',
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: spacing.lg,
    paddingBottom: 32,
    flexDirection: 'column',
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  summaryLeft: {
    flexDirection: 'column',
  },
  summaryLabel: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
    letterSpacing: 0.96,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  summaryValue: {
    ...typography['headlineXlMobile'],
    color: colors.primary,
    fontWeight: '700',
    fontFamily: fontFamily.headline,
  },
  summaryUnit: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  summaryRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroBento: {
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: 'rgba(62,73,74,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.lg,
    alignItems: 'center',
    minWidth: 48,
  },
  macroBentoLabel: {
    ...typography.labelCaps,
    color: colors.outline,
    marginBottom: 2,
  },
  macroBentoValue: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(62,73,74,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeText: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: radii.xl,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveText: {
    ...typography.labelMd,
    color: colors.onPrimaryContainer,
    fontWeight: '700',
  },
});
