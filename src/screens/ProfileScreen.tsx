import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useUserStore } from '../stores/userStore';
import { useLogStore } from '../stores/logStore';
import { useNavigation } from '@react-navigation/native';
import { tr } from '../i18n';

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const profile = useUserStore(s => s.profile);
  const setGoals = useUserStore(s => s.setGoals);
  // const setUnitSystem = useUserStore(s => s.setUnitSystem);
  const entries = useLogStore(s => s.entries);
  const deleteEntry = useLogStore(s => s.deleteEntry);

  const [localGoals, setLocalGoals] = useState({
    cal: profile.goals.dailyCalorieGoal?.toString() ?? '',
    protein: profile.goals.dailyProteinGoal?.toString() ?? '',
    carbs: profile.goals.dailyCarbGoal?.toString() ?? '',
    fat: profile.goals.dailyFatGoal?.toString() ?? '',
  });

  const saveGoals = () => {
    const cal = parseInt(localGoals.cal, 10);
    const protein = parseInt(localGoals.protein, 10);
    const carbs = parseInt(localGoals.carbs, 10);
    const fat = parseInt(localGoals.fat, 10);
    setGoals({
      dailyCalorieGoal: isNaN(cal) ? null : cal,
      dailyProteinGoal: isNaN(protein) ? null : protein,
      dailyCarbGoal: isNaN(carbs) ? null : carbs,
      dailyFatGoal: isNaN(fat) ? null : fat,
    });
  };

  const handleExport = () => {
    const data = JSON.stringify(entries, null, 2);
    Alert.alert('Export Data', data.substring(0, 500) + '...');
  };

  const handleDeleteAll = () => {
    Alert.alert(tr.profile.deleteTitle, tr.profile.deleteConfirm, [
      { text: tr.profile.cancel, style: 'cancel' },
      {
        text: tr.profile.delete,
        style: 'destructive',
        onPress: () => {
          Object.keys(entries).forEach(dateKey => {
            entries[dateKey].forEach(e => deleteEntry(dateKey, e.id));
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.appName}</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{tr.profile.title}</Text>
          <Text style={styles.pageSubtitle}>{tr.profile.subtitle}</Text>
        </View>

        {/* Daily Targets */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{tr.profile.dailyTargets}</Text>
          <View style={styles.glassPanel}>
            <GoalInput
              label={tr.profile.calorieTarget}
              value={localGoals.cal}
              unit="kcal"
              onChange={v => setLocalGoals(p => ({ ...p, cal: v }))}
              onBlur={saveGoals}
            />
            <ListDivider />
            <GoalInput
              label={tr.profile.protein}
              value={localGoals.protein}
              unit="g"
              onChange={v => setLocalGoals(p => ({ ...p, protein: v }))}
              onBlur={saveGoals}
            />
            <ListDivider />
            <GoalInput
              label={tr.profile.carbs}
              value={localGoals.carbs}
              unit="g"
              onChange={v => setLocalGoals(p => ({ ...p, carbs: v }))}
              onBlur={saveGoals}
            />
            <ListDivider />
            <GoalInput
              label={tr.profile.fat}
              value={localGoals.fat}
              unit="g"
              onChange={v => setLocalGoals(p => ({ ...p, fat: v }))}
              onBlur={saveGoals}
            />
          </View>
        </View>

        {/* Micronutrient Tracking */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>
            {tr.profile.micronutrientTracking}
          </Text>
          <View style={styles.glassPanel}>
            <ToggleRow
              label={tr.profile.sodium}
              value={profile.goals.showSodium}
              onChange={v => setGoals({ showSodium: v })}
            />
            <ListDivider />
            <ToggleRow
              label={tr.profile.fiber}
              value={profile.goals.showFiber}
              onChange={v => setGoals({ showFiber: v })}
            />
            <ListDivider />
            <ToggleRow
              label={tr.profile.sugar}
              value={profile.goals.showSugar}
              onChange={v => setGoals({ showSugar: v })}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{tr.profile.preferences}</Text>
          <View style={styles.glassPanel}>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>{tr.profile.unitPreference}</Text>
              <Text style={styles.listValue}>
                {profile.unitSystem === 'metric'
                  ? tr.profile.metric
                  : tr.profile.imperial}
              </Text>
            </View>
          </View>
        </View>

        {/* Data Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.exportButton, { marginBottom: 16 }]}
            onPress={handleExport}
          >
            <Icon name="download" size={20} color={colors.primary} />
            <Text style={styles.exportText}>{tr.profile.exportData}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.destructiveButton}
            onPress={handleDeleteAll}
          >
            <Icon name="delete-forever" size={20} color={colors.error} />
            <Text style={styles.destructiveText}>
              {tr.profile.deleteHistory}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalInput({
  label,
  value,
  unit,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (v: string) => void;
  onBlur: () => void;
}) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.listInput}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          placeholderTextColor={colors.onSurfaceVariant}
          placeholder="---"
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: colors.outlineVariant,
          true: colors.primaryContainer,
        }}
        thumbColor={value ? colors.primary : '#fff'}
      />
    </View>
  );
}

function ListDivider() {
  return <View style={styles.divider} />;
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
    backgroundColor: withAlpha(colors.background, 0.8),
    borderBottomWidth: 1,
    borderBottomColor: withAlpha(colors.outlineVariant, 0.3),
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: fontFamily.headline,
  },
  scrollContent: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: 24,
    paddingBottom: 40,
    maxWidth: 672,
    alignSelf: 'center',
  },
  pageHeader: {
    marginBottom: 30,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    paddingLeft: 16,
  },
  glassPanel: {
    backgroundColor: withAlpha(colors.surfaceContainerHigh, 0.4),
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: withAlpha(colors.outline, 0.2),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: withAlpha(colors.surfaceContainer, 0.6),
  },
  listLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurface,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlign: 'right',
    color: colors.onSurface,
    width: 100,
    fontSize: 16,
    lineHeight: 24,
  },
  unitText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    marginLeft: 8,
  },
  listValue: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.primary,
  },
  divider: {
    height: 0.5,
    backgroundColor: withAlpha(colors.outline, 0.3),
    marginLeft: 16,
  },
  actionSection: {
    marginTop: 8,
  },
  exportButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 0.5,
    borderColor: withAlpha(colors.outlineVariant, 0.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  destructiveButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radii.xl,
    backgroundColor: withAlpha(colors.errorContainer, 0.2),
    borderWidth: 0.5,
    borderColor: withAlpha(colors.error, 0.3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  destructiveText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.error,
  },
});
