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
import {colors, spacing, radii} from '../theme/colors';
import {useUserStore} from '../stores/userStore';
import {useLogStore} from '../stores/logStore';

export function ProfileScreen(): React.JSX.Element {
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

  const GoalInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <View style={styles.inputRow}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        onBlur={saveGoals}
        placeholderTextColor={colors.onSurfaceVariant}
        placeholder="---"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Profil</Text>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Günlük Hedefler</Text>
          <View style={styles.groupCard}>
            <GoalInput label="Kalori (kcal)" value={localGoals.cal} onChange={v => setLocalGoals(p => ({...p, cal: v}))} />
            <View style={styles.divider} />
            <GoalInput label="Protein (g)" value={localGoals.protein} onChange={v => setLocalGoals(p => ({...p, protein: v}))} />
            <View style={styles.divider} />
            <GoalInput label="Karbonhidrat (g)" value={localGoals.carbs} onChange={v => setLocalGoals(p => ({...p, carbs: v}))} />
            <View style={styles.divider} />
            <GoalInput label="Yağ (g)" value={localGoals.fat} onChange={v => setLocalGoals(p => ({...p, fat: v}))} />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Mikro Besinler</Text>
          <View style={styles.groupCard}>
            <ToggleRow
              label="Sodyum göster"
              value={profile.goals.showMicronutrients}
              onChange={v => setGoals({showMicronutrients: v})}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="Lif göster"
              value={profile.goals.showMicronutrients}
              onChange={v => setGoals({showMicronutrients: v})}
            />
            <View style={styles.divider} />
            <ToggleRow
              label="Şeker göster"
              value={profile.goals.showMicronutrients}
              onChange={v => setGoals({showMicronutrients: v})}
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Birim Sistemi</Text>
          <View style={styles.groupCard}>
            <ToggleRow
              label="Metrik (g, kcal)"
              value={profile.unitSystem === 'metric'}
              onChange={v => setUnitSystem(v ? 'metric' : 'imperial')}
            />
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Veri Yönetimi</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity style={styles.actionRow} onPress={handleExport}>
              <Text style={styles.actionText}>Verileri Dışa Aktar (JSON)</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleExport}>
              <Text style={styles.actionText}>Verileri Dışa Aktar (CSV)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.destructiveButton} onPress={handleDeleteAll}>
          <Text style={styles.destructiveText}>Tüm Geçmişi Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ToggleRow({label, value, onChange}: {label: string; value: boolean; onChange: (v: boolean) => void}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: colors.surfaceContainerHigh, true: colors.primaryContainer}}
        thumbColor={value ? colors.primary : colors.onSurfaceVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {padding: 16, gap: 20, paddingBottom: 40},
  header: {color: colors.onSurface, fontSize: 28, fontWeight: '700', marginBottom: 4},
  group: {gap: 6},
  groupTitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 12,
  },
  groupCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {color: colors.onSurface, fontSize: 15},
  input: {
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 90,
    textAlign: 'right',
    fontSize: 15,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.outlineVariant,
    marginLeft: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toggleLabel: {color: colors.onSurface, fontSize: 15},
  actionRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: {color: colors.primary, fontSize: 15},
  destructiveButton: {
    backgroundColor: colors.errorContainer,
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  destructiveText: {color: colors.onErrorContainer, fontSize: 16, fontWeight: '700'},
});
