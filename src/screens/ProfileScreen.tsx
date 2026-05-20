import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {colors} from '../theme/colors';
import {spacing} from '../theme/spacing';
import {radii} from '../theme/radii';
import {typography, fontFamily} from '../theme/typography';
import {useUserStore} from '../stores/userStore';
import {useLogStore} from '../stores/logStore';
import {useNavigation} from '@react-navigation/native';

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const profile = useUserStore(s => s.profile);
  const setGoals = useUserStore(s => s.setGoals);
  const setUnitSystem = useUserStore(s => s.setUnitSystem);
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
    Alert.alert('Veri Dışa Aktar', data.substring(0, 500) + '...');
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Tüm Geçmişi Sil',
      'Bu işlem geri alınamaz. Emin misiniz?',
      [
        {text: 'İptal', style: 'cancel'},
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            Object.keys(entries).forEach(dateKey => {
              entries[dateKey].forEach(e => deleteEntry(dateKey, e.id));
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* TopAppBar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HealthLens</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Günlük Hedefler</Text>
          </View>
          <GoalInput
            label="Kalori (kcal)"
            value={localGoals.cal}
            onChange={v => setLocalGoals(p => ({...p, cal: v}))}
            onBlur={saveGoals}
          />
          <ListDivider />
          <GoalInput
            label="Protein (g)"
            value={localGoals.protein}
            onChange={v => setLocalGoals(p => ({...p, protein: v}))}
            onBlur={saveGoals}
          />
          <ListDivider />
          <GoalInput
            label="Karbonhidrat (g)"
            value={localGoals.carbs}
            onChange={v => setLocalGoals(p => ({...p, carbs: v}))}
            onBlur={saveGoals}
          />
          <ListDivider />
          <GoalInput
            label="Yağ (g)"
            value={localGoals.fat}
            onChange={v => setLocalGoals(p => ({...p, fat: v}))}
            onBlur={saveGoals}
          />
        </View>

        {/* Micronutrients Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mikro Besinler</Text>
          </View>
          <ToggleRow
            label="Sodyum göster"
            value={profile.goals.showMicronutrients}
            onChange={v => setGoals({showMicronutrients: v})}
          />
          <ListDivider />
          <ToggleRow
            label="Lif göster"
            value={profile.goals.showMicronutrients}
            onChange={v => setGoals({showMicronutrients: v})}
          />
          <ListDivider />
          <ToggleRow
            label="Şeker göster"
            value={profile.goals.showMicronutrients}
            onChange={v => setGoals({showMicronutrients: v})}
          />
        </View>

        {/* Unit System Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Birim Sistemi</Text>
          </View>
          <ToggleRow
            label="Metrik (g, kcal)"
            value={profile.unitSystem === 'metric'}
            onChange={v => setUnitSystem(v ? 'metric' : 'imperial')}
          />
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
          </View>
          <TouchableOpacity style={styles.actionRow} onPress={handleExport}>
            <Text style={styles.actionText}>Verileri Dışa Aktar (JSON)</Text>
          </TouchableOpacity>
          <ListDivider />
          <TouchableOpacity style={styles.actionRow} onPress={handleExport}>
            <Text style={styles.actionText}>Verileri Dışa Aktar (CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* Destructive Action */}
        <TouchableOpacity style={styles.destructiveButton} onPress={handleDeleteAll}>
          <Text style={styles.destructiveText}>Tüm Geçmişi Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function GoalInput({label, value, onChange, onBlur}: {label: string; value: string; onChange: (v: string) => void; onBlur: () => void}) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listLabel}>{label}</Text>
      <TextInput
        style={styles.listInput}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholderTextColor={colors.onSurfaceVariant}
        placeholder="---"
      />
    </View>
  );
}

function ToggleRow({label, value, onChange}: {label: string; value: boolean; onChange: (v: boolean) => void}) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.surfaceContainerHigh, true: colors.primaryContainer}}
        thumbColor={value ? colors.primary : colors.onSurfaceVariant}
      />
    </View>
  );
}

function ListDivider() {
  return (
    <View style={styles.divider} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['margin-mobile'],
    height: 64,
    backgroundColor: 'rgba(11,19,38,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(62,73,74,0.3)',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  iconText: {
    color: colors.primary,
    fontSize: 20,
  },
  headerTitle: {
    ...typography['headlineLgMobile'],
    color: colors.primary,
    fontFamily: fontFamily.headline,
    letterSpacing: -0.24,
  },
  scrollContent: {
    paddingHorizontal: spacing['margin-mobile'],
    paddingTop: 80,
    paddingBottom: 40,
    gap: spacing.lg,
    maxWidth: 672,
    alignSelf: 'center',
  },
  section: {
    backgroundColor: 'rgba(34,42,61,0.4)',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(136,147,148,0.2)',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(23,31,51,0.6)',
  },
  sectionTitle: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(23,31,51,0.6)',
    position: 'relative',
  },
  listLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  listInput: {
    backgroundColor: 'transparent',
    color: colors.onSurface,
    textAlign: 'right',
    width: 100,
    ...typography.bodyMd,
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(136,147,148,0.3)',
    marginLeft: 16,
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(23,31,51,0.6)',
  },
  actionText: {
    ...typography.bodyMd,
    color: colors.primary,
  },
  destructiveButton: {
    backgroundColor: 'rgba(147,0,10,0.2)',
    borderRadius: radii.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,180,171,0.3)',
  },
  destructiveText: {
    ...typography.bodyMd,
    color: colors.error,
    fontWeight: '700',
  },
});
