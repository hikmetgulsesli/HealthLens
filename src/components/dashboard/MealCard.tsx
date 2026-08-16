import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { LogEntry, HealthGoal, AnalysisResult } from '../../types';
import { useLogStore } from '../../stores/logStore';
import { useAnalysisStore } from '../../stores/analysisStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { tr } from '../../i18n';
import { getMealHealthGrade } from '../../utils/healthGrader';
import { getGradeStyle } from '../../utils/healthGradeStyle';
import { getTodayKey } from '../../utils/date';

interface Props {
  entry: LogEntry;
  healthGoal: HealthGoal | null;
  onPressOverride?: (entry: LogEntry) => void;
  onLongPressOverride?: (entry: LogEntry) => void;
}

function entryToAnalysis(entry: LogEntry): AnalysisResult {
  return {
    id: entry.id,
    dateKey: entry.dateKey,
    createdAt: entry.createdAt,
    imageUri: entry.imageUri || '',
    mealCategory: entry.mealCategory,
    items: entry.items,
  };
}

export function MealCard({
  entry,
  healthGoal,
  onPressOverride,
  onLongPressOverride,
}: Props): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setAnalysis = useAnalysisStore(s => s.setAnalysis);
  const deleteEntry = useLogStore(s => s.deleteEntry);

  const handlePress = () => {
    if (onPressOverride) {
      onPressOverride(entry);
      return;
    }
    setAnalysis(entryToAnalysis(entry));
    navigation.navigate('Review');
  };

  const handleLongPress = () => {
    if (onLongPressOverride) {
      onLongPressOverride(entry);
      return;
    }
    Alert.alert('Öğün İşlemleri', 'Bu öğün için ne yapmak istersiniz?', [
      {
        text: 'Düzenle',
        onPress: () => {
          setAnalysis(entryToAnalysis(entry));
          navigation.navigate('Review');
        },
      },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteEntry(getTodayKey(), entry.id),
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const mealGrade = getMealHealthGrade(entry.items, healthGoal);
  const gradeClass = mealGrade.grade.startsWith('A')
    ? ('A' as const)
    : (mealGrade.grade as 'B' | 'C' | 'D');
  const { badgeStyle, textStyle } = getGradeStyle(gradeClass);

  return (
    <TouchableOpacity
      style={styles.mealCard}
      onPress={handlePress}
      onLongPress={handleLongPress}
      testID={`dashboardMealCard-${entry.id}`}
      accessibilityLabel={`Öğün ${tr.meals[entry.mealCategory]}, ${entry.totalCalories} kalori, sağlık notu ${mealGrade.grade}`}
      accessibilityRole="button"
    >
      <View style={styles.mealRow}>
        <View style={styles.mealIconBox}>
          {entry.imageUri && !entry.imageUri.startsWith('barcode://') ? (
            <Image
              source={{ uri: entry.imageUri }}
              style={styles.mealImage}
              resizeMode="cover"
              testID={`dashboardMealCardImage-${entry.id}`}
            />
          ) : (
            <Icon
              name={
                entry.mealCategory === 'breakfast'
                  ? 'breakfast-dining'
                  : 'lunch-dining'
              }
              size={20}
              color={
                entry.mealCategory === 'breakfast'
                  ? colors.primary
                  : colors.secondary
              }
            />
          )}
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName} testID={`dashboardMealCardName-${entry.id}`}>
            {entry.items.map(i => i.name).join(', ')}
          </Text>
          <Text style={styles.mealTime}>
            {tr.meals[entry.mealCategory]} •{' '}
            {new Date(entry.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.mealCalSection}>
          <View style={[styles.gradeBadge, badgeStyle]}>
            <Text style={[styles.gradeBadgeText, textStyle]}>
              {mealGrade.grade}
            </Text>
          </View>
          <Text style={styles.mealCal}>{entry.totalCalories} kcal</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  mealImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mealInfo: {
    flex: 1,
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
  mealCalSection: {
    alignItems: 'flex-end',
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  gradeBadgeText: {
    ...typography.labelMd,
    fontWeight: '700',
  },
  mealCal: {
    ...typography.labelMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
});
