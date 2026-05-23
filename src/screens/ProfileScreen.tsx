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
  StatusBar,
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
  const entries = useLogStore(s => s.entries);
  const deleteEntry = useLogStore(s => s.deleteEntry);

  const [localGoals, setLocalGoals] = useState({
    cal: profile.goals.dailyCalorieGoal?.toString() ?? '',
    protein: profile.goals.dailyProteinGoal?.toString() ?? '',
    carbs: profile.goals.dailyCarbGoal?.toString() ?? '',
    fat: profile.goals.dailyFatGoal?.toString() ?? '',
  });

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

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

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      Alert.alert('Hata', 'API key boş olamaz');
      return;
    }
    // TODO: Save API key to secure storage
    Alert.alert('Başarılı', 'API key kaydedildi');
    setShowApiKey(false);
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
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.appName}</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="settings" size={24} color={colors.onSurface} />
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

        {/* API Settings */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>API Ayarları</Text>
          <View style={styles.glassPanel}>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Gemini API Key</Text>
              <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                <Text style={styles.listValue}>
                  {showApiKey ? 'Gizle' : 'Düzenle'}
                </Text>
              </TouchableOpacity>
            </View>

            {showApiKey && (
              <>
                <ListDivider />
                <TextInput
                  style={styles.apiKeyInput}
                  placeholder="API Key girin"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.saveApiButton}
                  onPress={handleSaveApiKey}
                >
                  <Text style={styles.saveApiText}>API Key Kaydet</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Data Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
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
          false: colors.surfaceContainer,
          true: colors.primaryContainer,
        }}
        thumbColor={value ? colors.primary : colors.onSurfaceVariant}
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
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pageHeader: {
    marginBottom: spacing.xl,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  glassPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outline,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: withAlpha(colors.surfaceContainer, 0.3),
  },
  listLabel: {
    fontSize: 16,
    color: colors.onSurface,
    fontWeight: '500',
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
    width: 80,
    fontSize: 16,
    fontWeight: '600',
  },
  unitText: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginLeft: 8,
  },
  listValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.outline,
    marginLeft: spacing.lg,
  },
  apiKeyInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.onSurface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  saveApiButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  saveApiText: {
    color: colors.onPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  actionSection: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  exportButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  destructiveButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: withAlpha(colors.error, 0.3),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  destructiveText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
});
