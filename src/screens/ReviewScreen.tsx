import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useAnalysisStore } from '../stores/analysisStore';
import { useLogStore } from '../stores/logStore';
import type { MealCategory } from '../types';
import { tr } from '../i18n';

const MEAL_CATEGORIES: { label: string; value: MealCategory }[] = [
  { label: tr.review.breakfast, value: 'breakfast' },
  { label: tr.review.lunch, value: 'lunch' },
  { label: tr.review.dinner, value: 'dinner' },
  { label: tr.review.snack, value: 'snack' },
];

export function ReviewScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const analysis = useAnalysisStore(s => s.currentAnalysis);
  const updateItemPortion = useAnalysisStore(s => s.updateItemPortion);
  const removeItem = useAnalysisStore(s => s.removeItem);
  const setMealCategory = useAnalysisStore(s => s.setMealCategory);
  const addItem = useAnalysisStore(s => s.addItem);
  const addEntry = useLogStore(s => s.addEntry);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCalories, setNewItemCalories] = useState('');
  const [newItemProtein, setNewItemProtein] = useState('');
  const [newItemCarbs, setNewItemCarbs] = useState('');
  const [newItemFat, setNewItemFat] = useState('');
  const [newItemPortion, setNewItemPortion] = useState('100');

  const totals = useMemo(() => {
    if (!analysis) return { cal: 0, protein: 0, carbs: 0, fat: 0 };
    return analysis.items.reduce(
      (acc, item) => {
        const ratio = item.estimatedPortionGrams / 100;
        acc.cal += item.caloriesPer100g * ratio;
        acc.protein += item.proteinPer100g * ratio;
        acc.carbs += item.carbsPer100g * ratio;
        acc.fat += item.fatPer100g * ratio;
        return acc;
      },
      { cal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [analysis]);

  if (!analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>{tr.review.noAnalysis}</Text>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (analysis.items.length === 0) {
      Alert.alert('Hata', tr.review.errorNoItems);
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.appName}</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Card */}
        <View style={styles.imageCard}>
          {analysis.imageUri && !analysis.imageUri.startsWith('mock://') ? (
            <Image
              source={{ uri: analysis.imageUri }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.foodImage, styles.placeholderImage]}>
              <Icon
                name="restaurant"
                size={48}
                color={colors.onSurfaceVariant}
              />
              <Text style={styles.placeholderText}>{tr.review.noAnalysis}</Text>
            </View>
          )}
          <View style={styles.matchBadge}>
            <Icon name="check-circle" size={16} color={colors.primary} />
            <Text style={styles.matchText}>98% {tr.review.match}</Text>
          </View>
        </View>

        {/* Meal Category */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionLabel}>{tr.review.mealCategory}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {MEAL_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  analysis.mealCategory === cat.value &&
                    styles.categoryChipActive,
                ]}
                onPress={() => setMealCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    analysis.mealCategory === cat.value &&
                      styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Detected Items */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionLabel}>{tr.review.detectedItems}</Text>
            <View style={styles.itemsBadge}>
              <Text style={styles.itemsBadgeText}>
                {analysis.items.length} {tr.review.items}
              </Text>
            </View>
          </View>

          {analysis.items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderLeft}>
                  <View style={styles.itemIcon}>
                    <Icon name="restaurant" size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Icon
                    name="delete"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              </View>

              {/* Portion Slider */}
              <View style={styles.portionSection}>
                <View style={styles.portionLabelRow}>
                  <Text style={styles.portionLabel}>{tr.review.portion}</Text>
                  <Text style={styles.portionValue}>
                    {item.estimatedPortionGrams}g
                  </Text>
                </View>
                <SimpleSlider
                  value={item.estimatedPortionGrams}
                  min={0}
                  max={500}
                  onChange={val => updateItemPortion(item.id, Math.round(val))}
                />
              </View>

              {/* Macros */}
              <View style={styles.macroSection}>
                <View style={styles.macroLeft}>
                  <Text style={styles.macroLabelSmall}>{tr.review.energy}</Text>
                  <View style={styles.macroValueRow}>
                    <Text style={styles.macroValueLarge}>
                      {Math.round(
                        (item.caloriesPer100g * item.estimatedPortionGrams) /
                          100,
                      )}
                    </Text>
                    <Text style={styles.macroUnit}>kcal</Text>
                  </View>
                </View>
                <View style={styles.macroRight}>
                  <MacroBadge
                    label={tr.review.pro}
                    value={`${Math.round(
                      (item.proteinPer100g * item.estimatedPortionGrams) / 100,
                    )}g`}
                  />
                  <MacroBadge
                    label={tr.review.carb}
                    value={`${Math.round(
                      (item.carbsPer100g * item.estimatedPortionGrams) / 100,
                    )}g`}
                  />
                  <MacroBadge
                    label={tr.review.fat}
                    value={`${Math.round(
                      (item.fatPer100g * item.estimatedPortionGrams) / 100,
                    )}g`}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add Item Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>{tr.review.addItem}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Summary Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Text style={styles.summaryLabel}>
                {tr.review.totalNutrition}
              </Text>
              <View style={styles.summaryValueRow}>
                <Text style={styles.summaryValue}>
                  {Math.round(totals.cal)}
                </Text>
                <Text style={styles.summaryUnit}>kcal</Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <MacroBento
                label={tr.review.pro}
                value={`${Math.round(totals.protein)}g`}
              />
              <MacroBento
                label={tr.review.carb}
                value={`${Math.round(totals.carbs)}g`}
              />
              <MacroBento
                label={tr.review.fat}
                value={`${Math.round(totals.fat)}g`}
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retakeText}>{tr.review.retake}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              testID="saveLogButton"
            >
              <Icon name="save" size={18} color={colors.onPrimary} />
              <Text style={styles.saveText}>{tr.review.saveMeal}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tr.review.addItem}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Yiyecek adı"
              placeholderTextColor={colors.onSurfaceVariant}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Kalori (100g)"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              value={newItemCalories}
              onChangeText={setNewItemCalories}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Protein (100g)"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              value={newItemProtein}
              onChangeText={setNewItemProtein}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Karbonhidrat (100g)"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              value={newItemCarbs}
              onChangeText={setNewItemCarbs}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Yağ (100g)"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              value={newItemFat}
              onChangeText={setNewItemFat}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Porsiyon (g)"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="numeric"
              value={newItemPortion}
              onChangeText={setNewItemPortion}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>{tr.review.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={() => {
                  if (!newItemName.trim()) {
                    Alert.alert('Hata', 'Yiyecek adı gerekli');
                    return;
                  }
                  addItem({
                    id: `manual-${Date.now()}`,
                    name: newItemName.trim(),
                    confidence: 1,
                    estimatedPortionGrams: parseInt(newItemPortion, 10) || 100,
                    caloriesPer100g: parseFloat(newItemCalories) || 0,
                    proteinPer100g: parseFloat(newItemProtein) || 0,
                    carbsPer100g: parseFloat(newItemCarbs) || 0,
                    fatPer100g: parseFloat(newItemFat) || 0,
                  });
                  setNewItemName('');
                  setNewItemCalories('');
                  setNewItemProtein('');
                  setNewItemCarbs('');
                  setNewItemFat('');
                  setNewItemPortion('100');
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.modalSaveText}>{tr.review.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SimpleSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const pct = (value - min) / (max - min);
  const [trackWidth, setTrackWidth] = React.useState(0);
  return (
    <TouchableOpacity
      style={styles.sliderTrack}
      activeOpacity={1}
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      onPress={e => {
        const locationX = e.nativeEvent.locationX;
        const newPct = Math.max(0, Math.min(1, locationX / trackWidth));
        onChange(min + newPct * (max - min));
      }}
    >
      <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
      <View
        style={[styles.sliderThumb, { left: `${pct * 100}%`, marginLeft: -10 }]}
      />
    </TouchableOpacity>
  );
}

function MacroBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroBadge}>
      <Text style={styles.macroBadgeLabel}>{label}</Text>
      <Text style={styles.macroBadgeValue}>{value}</Text>
    </View>
  );
}

function MacroBento({ label, value }: { label: string; value: string }) {
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['margin-mobile'],
    height: 56,
    backgroundColor: withAlpha(colors.surface, 0.8),
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  scrollContent: {
    paddingBottom: 280,
  },
  emptyText: {
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  imageCard: {
    margin: spacing['margin-mobile'],
    backgroundColor: colors.surface,
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: withAlpha(colors.surface, 0.9),
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  categorySection: {
    paddingHorizontal: spacing['margin-mobile'],
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
  },
  categoryChipActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  categoryTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  itemsSection: {
    paddingHorizontal: spacing['margin-mobile'],
    gap: spacing.md,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemsBadge: {
    backgroundColor: withAlpha(colors.primary, 0.15),
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  itemsBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
    gap: spacing.md,
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
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: '600',
    fontFamily: fontFamily.bodyMedium,
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
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  },
  portionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sliderTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 2,
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  macroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
  },
  macroLeft: {
    flexDirection: 'column',
  },
  macroLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroValueLarge: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
  },
  macroUnit: {
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  macroBadgeValue: {
    fontSize: 14,
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
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: withAlpha(colors.background, 0.95),
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 40,
  },
  bottomContent: {
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
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: fontFamily.headline,
  },
  summaryUnit: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  summaryRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroBento: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outline,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.lg,
    alignItems: 'center',
    minWidth: 56,
  },
  macroBentoLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  macroBentoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.background, 0.8),
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.outline,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 14,
  },
  modalSave: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
