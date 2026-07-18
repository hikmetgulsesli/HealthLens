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
import { useUserStore } from '../stores/userStore';
import type { MealCategory } from '../types';
import { tr } from '../i18n';
import { searchFoods, LocalFood } from '../db/localFoods';
import { calculateHealthGrade } from '../utils/healthGrader';
import { MacroBadge } from '../components/review/MacroBadge';
import { SimpleSlider } from '../components/review/SimpleSlider';

const MEAL_CATEGORIES: { label: string; value: MealCategory }[] = [
  { label: tr.review.breakfast, value: 'breakfast' },
  { label: tr.review.lunch, value: 'lunch' },
  { label: tr.review.dinner, value: 'dinner' },
  { label: tr.review.snack, value: 'snack' },
];

export function ReviewScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const analysis = useAnalysisStore(s => s.currentAnalysis);
  const imageUris = useAnalysisStore(s => s.imageUris);
  const updateItemPortion = useAnalysisStore(s => s.updateItemPortion);
  const removeItem = useAnalysisStore(s => s.removeItem);
  const setMealCategory = useAnalysisStore(s => s.setMealCategory);
  const addItem = useAnalysisStore(s => s.addItem);

  const addEntry = useLogStore(s => s.addEntry);
  const updateEntry = useLogStore(s => s.updateEntry);
  const deleteEntry = useLogStore(s => s.deleteEntry);
  const entries = useLogStore(s => s.entries);

  const healthGoal = useUserStore(s => s.profile.healthGoal);

  const isEditMode = !!analysis?.id;
  const existingEntry = useMemo(() => {
    if (!analysis?.id) return null;

    for (const dayEntries of Object.values(entries)) {
      const match = dayEntries.find(entry => entry.id === analysis.id);
      if (match) return match;
    }

    return null;
  }, [analysis?.id, entries]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCalories, setNewItemCalories] = useState('');
  const [newItemProtein, setNewItemProtein] = useState('');
  const [newItemCarbs, setNewItemCarbs] = useState('');
  const [newItemFat, setNewItemFat] = useState('');
  const [newItemPortion, setNewItemPortion] = useState('100');

  // Autocomplete search states
  const [searchResults, setSearchResults] = useState<LocalFood[]>([]);
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(
    null,
  );

  // Portion edit modal states
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [portionValue, setPortionValue] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState('');

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

  const handleAddHiddenIngredient = (
    name: string,
    portion: number,
    calories: number,
    pro: number,
    carb: number,
    fat: number,
    sodium = 0,
  ) => {
    addItem({
      id: `hidden-${Date.now()}-${name.replace(/\s+/g, '')}`,
      name: name,
      confidence: 1.0,
      estimatedPortionGrams: portion,
      caloriesPer100g: Math.round((calories * 100) / portion),
      proteinPer100g: Math.round((pro * 100) / portion),
      carbsPer100g: Math.round((carb * 100) / portion),
      fatPer100g: Math.round((fat * 100) / portion),
      fiberPer100g: 0,
      sugarPer100g: 0,
      sodiumPer100g: sodium ? Math.round((sodium * 100) / portion) : 0,
      isVerified: true,
    });
  };

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

    const dateKey =
      existingEntry?.dateKey ??
      analysis.dateKey ??
      new Date().toISOString().split('T')[0];

    if (isEditMode && analysis.id) {
      // Edit Mode: Overwrite saved log entry
      updateEntry({
        id: analysis.id,
        createdAt:
          existingEntry?.createdAt ??
          analysis.createdAt ??
          new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateKey,
        mealCategory: analysis.mealCategory,
        imageUri: imageUris[0] || '',
        items: analysis.items,
        totalCalories: Math.round(totals.cal),
        totalProtein: Math.round(totals.protein),
        totalCarbs: Math.round(totals.carbs),
        totalFat: Math.round(totals.fat),
      });
      Alert.alert('Başarılı', 'Öğün başarıyla güncellendi.', [
        { text: 'Tamam' },
      ]);
    } else {
      // New Mode: Create new log entry
      addEntry({
        id: Math.random().toString(36).substring(7),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateKey,
        mealCategory: analysis.mealCategory,
        imageUri: imageUris[0] || '',
        items: analysis.items,
        totalCalories: Math.round(totals.cal),
        totalProtein: Math.round(totals.protein),
        totalCarbs: Math.round(totals.carbs),
        totalFat: Math.round(totals.fat),
      });

      // Charge a scan token if it is a camera scan and user is not premium
      const userProfile = useUserStore.getState().profile;
      const isInTrial =
        !!userProfile.trialEndsAt &&
        new Date(userProfile.trialEndsAt) > new Date();
      if (
        imageUris.length > 0 &&
        userProfile.plan !== 'pro_plus' &&
        !isInTrial
      ) {
        useUserStore.getState().incrementFreeScans();
      }

      Alert.alert('Başarılı', 'Öğün başarıyla kaydedildi.', [
        { text: 'Tamam' },
      ]);
    }

    useAnalysisStore.getState().reset();
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!analysis.id) return;

    Alert.alert(
      'Öğünü Sil',
      'Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            const dateKey =
              existingEntry?.dateKey ??
              analysis.dateKey ??
              new Date().toISOString().split('T')[0];
            deleteEntry(dateKey, analysis.id!);
            useAnalysisStore.getState().reset();
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleSearchTextChange = (text: string) => {
    setNewItemName(text);
    if (text.trim().length > 1) {
      const results = searchFoods(text);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectAutofill = (food: LocalFood) => {
    setNewItemName(food.name);
    setNewItemCalories(food.caloriesPer100g.toString());
    setNewItemProtein(food.proteinPer100g.toString());
    setNewItemCarbs(food.carbsPer100g.toString());
    setNewItemFat(food.fatPer100g.toString());
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            useAnalysisStore.getState().reset();
            navigation.goBack();
          }}
        >
          <Icon name="close" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Öğünü Düzenle' : tr.appName}
        </Text>
        {isEditMode ? (
          <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
            <Icon name="delete" size={24} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRightSpacer} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Multimodal Carousel / Image View */}
        {imageUris.length > 0 ? (
          <View style={styles.imageCard}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
            >
              {imageUris.map((uri, idx) => (
                <View key={idx} style={styles.carouselImageWrapper}>
                  {uri.startsWith('barcode://') ? (
                    <View style={[styles.foodImage, styles.placeholderImage]}>
                      <Icon name="qr-code" size={48} color={colors.primary} />
                      <Text style={styles.placeholderText}>
                        Barkod Taraması
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri }}
                      style={styles.foodImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Glowing computer-vision pointer scanner dots */}
            {analysis.items.map((item, idx) => {
              const dotStyle =
                idx === 0
                  ? styles.scannerDotPos0
                  : idx === 1
                  ? styles.scannerDotPos1
                  : idx === 2
                  ? styles.scannerDotPos2
                  : styles.scannerDotPos3;
              const isActive = activeTooltipIndex === idx;
              return (
                <View
                  key={`dot-${item.id}`}
                  style={[styles.scannerDotContainer, dotStyle]}
                >
                  <TouchableOpacity
                    style={[
                      styles.scannerDot,
                      isActive && styles.scannerDotActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActiveTooltipIndex(isActive ? null : idx)}
                  >
                    <View style={styles.scannerDotInner} />
                    <Text style={styles.scannerDotText}>{idx + 1}</Text>
                  </TouchableOpacity>

                  {isActive && (
                    <View style={styles.scannerTooltip}>
                      <Text style={styles.tooltipName}>{item.name}</Text>
                      <Text style={styles.tooltipCal}>
                        {item.estimatedPortionGrams}g •{' '}
                        {Math.round(
                          (item.caloriesPer100g * item.estimatedPortionGrams) /
                            100,
                        )}{' '}
                        kcal
                      </Text>
                      <Text style={styles.tooltipMacros}>
                        P:{' '}
                        {Math.round(
                          (item.proteinPer100g * item.estimatedPortionGrams) /
                            100,
                        )}
                        g • Y:{' '}
                        {Math.round(
                          (item.fatPer100g * item.estimatedPortionGrams) / 100,
                        )}
                        g
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {imageUris.length > 1 && (
              <View style={styles.carouselPageIndicator}>
                <Text style={styles.carouselPageText}>
                  1/{imageUris.length} Görsel (Kaydırın)
                </Text>
              </View>
            )}
            <View style={styles.matchBadge}>
              <Icon name="check-circle" size={16} color={colors.primary} />
              <Text style={styles.matchText}>98% {tr.review.match}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.imageCard}>
            <View style={[styles.foodImage, styles.placeholderImage]}>
              <Icon
                name="restaurant"
                size={48}
                color={colors.onSurfaceVariant}
              />
              <Text style={styles.placeholderText}>{tr.review.noAnalysis}</Text>
            </View>
          </View>
        )}

        {/* AI Smart Insight Card (Klinik Tavsiye Kartı) */}
        {analysis.smartInsight && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Icon name="spa" size={18} color={colors.primary} />
              <Text style={styles.insightTitle}>Sağlık İpucu</Text>
            </View>
            <Text style={styles.insightContent}>{analysis.smartInsight}</Text>
          </View>
        )}

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
                  <View style={styles.itemHeaderInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {(() => {
                        const scoreInfo = calculateHealthGrade(
                          item.caloriesPer100g,
                          item.proteinPer100g,
                          item.carbsPer100g,
                          item.fatPer100g,
                          item.fiberPer100g ?? 0,
                          item.sugarPer100g ?? 0,
                          item.sodiumPer100g ?? 0,
                          healthGoal,
                        );
                        const gradeClass = scoreInfo.grade.startsWith('A')
                          ? 'A'
                          : (scoreInfo.grade as 'B' | 'C' | 'D');
                        const badgeStyle =
                          gradeClass === 'A'
                            ? styles.gradeBadgeA
                            : gradeClass === 'B'
                            ? styles.gradeBadgeB
                            : gradeClass === 'C'
                            ? styles.gradeBadgeC
                            : styles.gradeBadgeD;
                        const textStyle =
                          gradeClass === 'A'
                            ? styles.gradeTextA
                            : gradeClass === 'B'
                            ? styles.gradeTextB
                            : gradeClass === 'C'
                            ? styles.gradeTextC
                            : styles.gradeTextD;
                        return (
                          <View style={[styles.itemGradeBadge, badgeStyle]}>
                            <Text style={[styles.itemGradeText, textStyle]}>
                              {scoreInfo.grade}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    {item.isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Icon name="verified" size={10} color="#00e676" />
                        <Text style={styles.verifiedText}>
                          Doğrulanmış Besin
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.aiEstimatedBadge}>
                        <Icon name="psychology" size={10} color="#90caf9" />
                        <Text style={styles.aiEstimatedText}>
                          Yapay Zeka Tahmini
                        </Text>
                      </View>
                    )}
                  </View>
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
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setEditingItemId(item.id);
                      setEditingItemName(item.name);
                      setPortionValue(item.estimatedPortionGrams.toString());
                      setPortionModalVisible(true);
                    }}
                  >
                    <View style={styles.portionValueContainer}>
                      <Text style={styles.portionValueInteractive}>
                        {item.estimatedPortionGrams}g
                      </Text>
                      <Icon
                        name="edit"
                        size={10}
                        color={colors.primaryLight}
                        style={styles.portionEditIcon}
                      />
                    </View>
                  </TouchableOpacity>
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

          {/* Gizli Yağlar & Soslar (Ekstra Kalori Ekle) Çubuğu */}
          <View style={styles.hiddenIngredientsSection}>
            <Text style={styles.hiddenLabel}>
              Gizli Yağlar, Soslar & Ekstralar
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hiddenScroll}
            >
              <TouchableOpacity
                style={styles.hiddenChip}
                onPress={() =>
                  handleAddHiddenIngredient(
                    'Zeytinyağı (1 YK)',
                    10,
                    90,
                    0,
                    0,
                    10,
                  )
                }
              >
                <Icon
                  name="opacity"
                  size={14}
                  color={colors.primary}
                  style={styles.chipIcon}
                />
                <Text style={styles.hiddenChipText}>
                  + Zeytinyağı (90 kcal)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hiddenChip}
                onPress={() =>
                  handleAddHiddenIngredient('Tereyağı (1 TK)', 5, 36, 0, 0, 4)
                }
              >
                <Icon
                  name="layers"
                  size={14}
                  color={colors.primary}
                  style={styles.chipIcon}
                />
                <Text style={styles.hiddenChipText}>+ Tereyağı (36 kcal)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hiddenChip}
                onPress={() =>
                  handleAddHiddenIngredient('Mayonez (1 YK)', 15, 100, 0, 0, 11)
                }
              >
                <Icon
                  name="lens"
                  size={14}
                  color={colors.primary}
                  style={styles.chipIcon}
                />
                <Text style={styles.hiddenChipText}>+ Mayonez (100 kcal)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hiddenChip}
                onPress={() =>
                  handleAddHiddenIngredient('Ketçap (1 YK)', 15, 15, 0, 4, 0)
                }
              >
                <Icon
                  name="adjust"
                  size={14}
                  color={colors.primary}
                  style={styles.chipIcon}
                />
                <Text style={styles.hiddenChipText}>+ Ketçap (15 kcal)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hiddenChip}
                onPress={() =>
                  handleAddHiddenIngredient(
                    'İlave Tuz (1g)',
                    1,
                    0,
                    0,
                    0,
                    0,
                    0.4,
                  )
                }
              >
                <Icon
                  name="grain"
                  size={14}
                  color={colors.primary}
                  style={styles.chipIcon}
                />
                <Text style={styles.hiddenChipText}>+ İlave Tuz (Sodyum)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

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
              onPress={() => {
                useAnalysisStore.getState().reset();
                navigation.goBack();
              }}
            >
              <Text style={styles.retakeText}>{tr.review.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              testID="saveLogButton"
            >
              <Icon name="save" size={18} color={colors.onPrimary} />
              <Text style={styles.saveText}>
                {isEditMode ? 'Öğünü Güncelle' : tr.review.saveMeal}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Item Modal with Smart Autocomplete Search */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setSearchResults([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{tr.review.addItem}</Text>

            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Yiyecek adı arayın (Örn: Köfte)"
                placeholderTextColor={colors.onSurfaceVariant}
                value={newItemName}
                onChangeText={handleSearchTextChange}
              />

              {/* Autocomplete dropdown results */}
              {searchResults.length > 0 && (
                <View style={styles.autocompleteDropdown}>
                  <ScrollView
                    style={styles.dropdownScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {searchResults.map((food, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectAutofill(food)}
                      >
                        <Text style={styles.dropdownItemText}>{food.name}</Text>
                        <Text style={styles.dropdownItemSub}>
                          {food.caloriesPer100g} kcal/100g
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

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
                onPress={() => {
                  setShowAddModal(false);
                  setSearchResults([]);
                }}
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
                  setSearchResults([]);
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.modalSaveText}>{tr.review.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Portion Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={portionModalVisible}
        onRequestClose={() => setPortionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Miktar Düzenle</Text>
            <Text style={styles.modalSubtitle}>
              {editingItemName} için porsiyon miktarını (gram) yazın:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={portionValue}
              onChangeText={setPortionValue}
              placeholder="Gram"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="number-pad"
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPortionModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={() => {
                  const val = parseInt(portionValue || '', 10);
                  if (!isNaN(val) && val > 0 && val <= 5000 && editingItemId) {
                    updateItemPortion(editingItemId, val);
                    setPortionModalVisible(false);
                  } else {
                    Alert.alert(
                      'Hata',
                      'Lütfen 1 ile 5000 gram arasında geçerli bir değer girin.',
                    );
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>Güncelle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  headerRightSpacer: {
    width: 40,
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
  carouselContainer: {
    flexDirection: 'row',
  },
  carouselImageWrapper: {
    width: 350,
    height: 200,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  carouselPageIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  carouselPageText: {
    fontSize: 11,
    color: colors.onSurface,
    fontWeight: '600',
  },
  placeholderImage: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    height: '100%',
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
    zIndex: 20,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  insightCard: {
    marginHorizontal: spacing['margin-mobile'],
    marginBottom: spacing.md,
    backgroundColor: withAlpha(colors.primaryContainer, 0.25),
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.3),
    gap: 6,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  insightContent: {
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 20,
    fontStyle: 'italic',
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
  portionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha(colors.primary, 0.1),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 0.5,
    borderColor: withAlpha(colors.primary, 0.3),
  },
  portionValueInteractive: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  portionEditIcon: {
    marginLeft: 2,
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
    marginLeft: -10,
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
  searchInputContainer: {
    position: 'relative',
    width: '100%',
    zIndex: 100,
  },
  autocompleteDropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    maxHeight: 180,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownScroll: {
    padding: spacing.xs,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.onSurface,
    fontWeight: '500',
  },
  dropdownItemSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
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
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
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
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 10,
    color: '#00e676',
    fontWeight: '600',
    fontFamily: fontFamily.body,
  },
  aiEstimatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(144, 202, 249, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  aiEstimatedText: {
    fontSize: 10,
    color: '#90caf9',
    fontWeight: '600',
    fontFamily: fontFamily.body,
  },
  hiddenIngredientsSection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  hiddenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
    fontFamily: fontFamily.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hiddenScroll: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  hiddenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  hiddenChipText: {
    fontSize: 12,
    color: colors.onSurface,
    fontWeight: '500',
    fontFamily: fontFamily.bodyMedium,
  },
  itemHeaderInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  chipIcon: {
    marginRight: 4,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemGradeBadge: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemGradeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  gradeBadgeA: {
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderColor: 'rgba(0, 230, 118, 0.35)',
  },
  gradeTextA: {
    color: '#00E676',
  },
  gradeBadgeB: {
    backgroundColor: 'rgba(20, 184, 166, 0.12)',
    borderColor: 'rgba(20, 184, 166, 0.35)',
  },
  gradeTextB: {
    color: '#14B8A6',
  },
  gradeBadgeC: {
    backgroundColor: 'rgba(255, 167, 38, 0.12)',
    borderColor: 'rgba(255, 167, 38, 0.35)',
  },
  gradeTextC: {
    color: '#FFA726',
  },
  gradeBadgeD: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  gradeTextD: {
    color: '#EF4444',
  },
  scannerDotContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  scannerDot: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: withAlpha(colors.primary, 0.25),
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  scannerDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.onPrimary,
    transform: [{ scale: 1.15 }],
  },
  scannerDotInner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.4),
    opacity: 0.7,
  },
  scannerDotText: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: '800',
  },
  scannerTooltip: {
    position: 'absolute',
    bottom: 34,
    backgroundColor: withAlpha(colors.surface, 0.95),
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: 10,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  tooltipName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  tooltipCal: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  tooltipMacros: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
  scannerDotPos0: {
    top: '40%',
    left: '30%',
  },
  scannerDotPos1: {
    top: '25%',
    left: '60%',
  },
  scannerDotPos2: {
    top: '65%',
    left: '50%',
  },
  scannerDotPos3: {
    top: '55%',
    left: '15%',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.surfaceContainer,
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
  },
  modalConfirmText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
