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
  Modal,
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
import RNFS from 'react-native-fs';
import { Share } from 'react-native';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { GoalCard } from '../components/profile/GoalCard';

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const profile = useUserStore(s => s.profile);
  const todayKey = new Date().toISOString().split('T')[0];
  const scansUsedToday =
    profile.freeScansDateKey === todayKey ? profile.freeScansUsed : 0;
  const remainingScans = Math.max(0, 3 - scansUsedToday);
  const getDotColor = () => {
    if (remainingScans >= 4) return '#10B981'; // Emerald Green
    if (remainingScans === 3) return '#14B8A6'; // Modern Teal
    if (remainingScans === 2) return '#F59E0B'; // Amber Yellow (Warning)
    return '#EF4444'; // Red (Critical)
  };

  const setGoals = useUserStore(s => s.setGoals);
  const loginUser = useUserStore(s => s.loginUser);
  const logoutUser = useUserStore(s => s.logoutUser);
  const resetOnboarding = useUserStore(s => s.resetOnboarding);
  const entries = useLogStore(s => s.entries);
  const deleteEntry = useLogStore(s => s.deleteEntry);

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginMethodState, setLoginMethodState] = useState<'google' | 'apple'>(
    'google',
  );

  const handleMockLogin = (method: 'google' | 'apple') => {
    setLoginMethodState(method);
    setLoginEmail(
      method === 'google' ? 'hikmet@gmail.com' : 'hikmet@apple.com',
    );
    setLoginModalVisible(true);
  };

  const handleLoginConfirm = () => {
    if (!loginEmail || !loginEmail.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return;
    }
    loginUser(loginEmail, loginMethodState);
    setLoginModalVisible(false);
    Alert.alert(
      'Giriş Başarılı',
      'Giriş yapıldı ve Premium Pro deneme hesabınız aktif edildi!',
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istiyor musunuz? Yerel verileriniz ve geçmişiniz korunacaktır.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => {
            logoutUser();
            Alert.alert('Çıkış Yapıldı', 'Güvenli çıkış yapıldı.');
          },
        },
      ],
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Sihirbazı Sıfırla',
      'Sağlık programınızı sıfırlamak istiyor musunuz? Kayıtlı yemek geçmişiniz silinmez, ancak sodyum, şeker ve lif alarm limitleriniz baştan kilitlenir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla & Yeniden Başlat',
          style: 'destructive',
          onPress: () => {
            resetOnboarding();
            Alert.alert(
              'Başarılı',
              'Sağlık sihirbazı sıfırlandı. Sihirbaz anında başlatılacaktır.',
            );
          },
        },
      ],
    );
  };

  const [localGoals, setLocalGoals] = useState({
    cal: profile.goals.dailyCalorieGoal?.toString() ?? '',
    protein: profile.goals.dailyProteinGoal?.toString() ?? '',
    carbs: profile.goals.dailyCarbGoal?.toString() ?? '',
    fat: profile.goals.dailyFatGoal?.toString() ?? '',
  });

  const saveGoals = (updatedGoals?: {
    cal?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
  }) => {
    const goalsToSave = updatedGoals ?? localGoals;
    const cal = parseInt(goalsToSave.cal ?? '', 10);
    const protein = parseInt(goalsToSave.protein ?? '', 10);
    const carbs = parseInt(goalsToSave.carbs ?? '', 10);
    const fat = parseInt(goalsToSave.fat ?? '', 10);

    setGoals({
      dailyCalorieGoal: isNaN(cal) ? null : cal,
      dailyProteinGoal: isNaN(protein) ? null : protein,
      dailyCarbGoal: isNaN(carbs) ? null : carbs,
      dailyFatGoal: isNaN(fat) ? null : fat,
    });
  };

  const adjustGoal = (
    key: 'cal' | 'protein' | 'carbs' | 'fat',
    amount: number,
  ) => {
    const currentValue = parseInt(localGoals[key], 10);
    let defaultValue = 0;
    if (key === 'cal') defaultValue = 2000;
    else if (key === 'protein') defaultValue = 130;
    else if (key === 'carbs') defaultValue = 220;
    else if (key === 'fat') defaultValue = 65;

    const baseValue = isNaN(currentValue) ? defaultValue : currentValue;
    const newValue = Math.max(0, baseValue + amount);
    const newValueStr = newValue === 0 ? '' : newValue.toString();

    const newLocalGoals = { ...localGoals, [key]: newValueStr };
    setLocalGoals(newLocalGoals);
    saveGoals(newLocalGoals);
  };

  const handleExport = async () => {
    try {
      let reportRows = '';
      let totalCal = 0;
      let totalPro = 0;
      let totalCarb = 0;
      let totalFat = 0;
      let loggedDays = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const dayEntries = entries[key] ?? [];

        if (dayEntries.length > 0) {
          loggedDays++;
          const dayCal = dayEntries.reduce(
            (sum, e) => sum + e.totalCalories,
            0,
          );
          const dayPro = dayEntries.reduce((sum, e) => sum + e.totalProtein, 0);
          const dayCarb = dayEntries.reduce((sum, e) => sum + e.totalCarbs, 0);
          const dayFat = dayEntries.reduce((sum, e) => sum + e.totalFat, 0);

          totalCal += dayCal;
          totalPro += dayPro;
          totalCarb += dayCarb;
          totalFat += dayFat;

          reportRows += `
            <tr>
              <td>${d.toLocaleDateString('tr-TR')}</td>
              <td>${dayEntries.length} Öğün</td>
              <td><strong>${dayCal} kcal</strong></td>
              <td>${dayPro}g</td>
              <td>${dayCarb}g</td>
              <td>${dayFat}g</td>
            </tr>
          `;
        } else {
          reportRows += `
            <tr>
              <td>${d.toLocaleDateString('tr-TR')}</td>
              <td colspan="5" style="color: #64748b; font-style: italic;">Kayıt yok</td>
            </tr>
          `;
        }
      }

      const avgCal = loggedDays > 0 ? Math.round(totalCal / loggedDays) : 0;
      const avgPro = loggedDays > 0 ? Math.round(totalPro / loggedDays) : 0;
      const avgCarb = loggedDays > 0 ? Math.round(totalCarb / loggedDays) : 0;
      const avgFat = loggedDays > 0 ? Math.round(totalFat / loggedDays) : 0;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>HealthLens Klinik Beslenme Raporu</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #fafafa; color: #1e293b; padding: 40px; margin: 0; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            header { border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            h1 { color: #0f172a; margin: 0 0 4px 0; font-size: 24px; }
            p.subtitle { color: #0d9488; font-weight: 600; margin: 0; font-size: 14px; text-transform: uppercase; }
            .date { color: #64748b; font-size: 14px; }
            .grid { display: flex; gap: 20px; margin-bottom: 40px; }
            .card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
            .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 6px; }
            .card-value { font-size: 20px; font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f1f5f9; color: #475569; font-size: 13px; text-transform: uppercase; }
            tr:hover { background-color: #f8fafc; }
            .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <div>
                <h1>HealthLens Sağlık ve Beslenme Raporu</h1>
                <p class="subtitle">Klinik Durum Analizi</p>
              </div>
              <div class="date">${new Date().toLocaleDateString('tr-TR')}</div>
            </header>
            
            <div style="margin-bottom: 30px;">
              <h3 style="color: #0f172a; margin-bottom: 15px;">Son 7 Günlük Ortalama Tüketim</h3>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Kalori</div>
                  <div class="card-value">${avgCal} kcal</div>
                </div>
                <div class="card">
                  <div class="card-label">Protein</div>
                  <div class="card-value">${avgPro} g</div>
                </div>
                <div class="card">
                  <div class="card-label">Karbonhidrat</div>
                  <div class="card-value">${avgCarb} g</div>
                </div>
                <div class="card">
                  <div class="card-label">Yağ</div>
                  <div class="card-value">${avgFat} g</div>
                </div>
              </div>
            </div>

            <h3 style="color: #0f172a; margin-bottom: 15px;">Günlük Öğün Kayıt Detayları</h3>
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Kayıt</th>
                  <th>Enerji</th>
                  <th>Protein</th>
                  <th>Karb</th>
                  <th>Yağ</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows}
              </tbody>
            </table>

            <div class="footer">
              Bu rapor HealthLens AI besin tanıma servisi tarafından üretilmiştir. Tıbbi tavsiye yerine geçmez, bilgilendirme amaçlıdır.
            </div>
          </div>
        </body>
        </html>
      `;

      const path = `${RNFS.DocumentDirectoryPath}/HealthLens_Raporu.html`;
      await RNFS.writeFile(path, htmlContent, 'utf8');

      await Share.share({
        url: `file://${path}`,
        title: 'HealthLens Beslenme Raporu',
      });
    } catch (err) {
      console.error('Export report failed:', err);
      Alert.alert('Hata', 'Beslenme raporu dışa aktarılamadı.');
    }
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
          Alert.alert('Başarılı', 'Tüm geçmiş veriler silindi.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Decorative Orbs */}
      <View style={styles.neonOrb1} />
      <View style={styles.neonOrb2} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.appName}</Text>
        <View style={styles.iconButton}>
          <Icon name="settings" size={24} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Elegant Profile Header Card */}
        <ProfileHeader profile={profile} />

        {/* Ücretsiz Kullanım Limiti (Eğer Premium Değilse) */}
        {!profile.isPremium && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>Ücretsiz Kullanım Limiti</Text>
            <View style={styles.glassPanel}>
              <View style={styles.limitStatusRow}>
                <View style={styles.limitInfoLeft}>
                  <View
                    style={[
                      styles.listIconContainer,
                      { borderColor: getDotColor() },
                    ]}
                  >
                    <Icon name="bolt" size={20} color={getDotColor()} />
                  </View>
                  <View style={styles.limitTextWrapper}>
                    <Text style={styles.limitTitle}>
                      Yapay Zeka Tarama Hakkı
                    </Text>
                    <Text style={styles.limitSub}>
                      {remainingScans === 0
                        ? 'Kamera ile yemek analiz hakkınız dolmuştur.'
                        : `Yemekleri kamera ile otomatik analiz etmek için ${remainingScans} hakkınız kaldı.`}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.limitBadge,
                    {
                      backgroundColor: withAlpha(getDotColor(), 0.15),
                      borderColor: getDotColor(),
                    },
                  ]}
                >
                  <Text
                    style={[styles.limitBadgeText, { color: getDotColor() }]}
                  >
                    {remainingScans} / 3 Hak
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />

              {/* LED Progress Dots */}
              <View style={styles.limitDotsContainer}>
                <Text style={styles.limitDotsLabel}>Limit Durumu:</Text>
                <View style={styles.dotsWrapper}>
                  {[1, 2, 3, 4, 5].map(index => {
                    const isActive = index <= remainingScans;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          isActive
                            ? { backgroundColor: getDotColor() }
                            : styles.dotInactive,
                        ]}
                      />
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bulut Senkronizasyonu Bento Card */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>Bulut Senkronizasyonu</Text>
          <View style={styles.glassPanel}>
            {profile.email ? (
              <>
                <View style={styles.authStatusRow}>
                  <View style={styles.authStatusLeft}>
                    <View style={styles.listIconContainer}>
                      <Icon
                        name={
                          profile.loginMethod === 'google'
                            ? 'g-mobiledata'
                            : 'apple'
                        }
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.authEmail}>{profile.email}</Text>
                      <Text style={styles.authMethod}>
                        {profile.loginMethod === 'google'
                          ? 'Google hesabı ile bağlı'
                          : 'Apple hesabı ile bağlı'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncBadgeText}>AKTİF</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.logoutButton}
                  activeOpacity={0.7}
                  onPress={handleLogout}
                >
                  <Icon name="logout" size={18} color={colors.error} />
                  <Text style={styles.logoutText}>Oturumu Kapat</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.authOfflineRow}>
                  <View style={styles.listIconContainer}>
                    <Icon
                      name="cloud-off"
                      size={20}
                      color={colors.onSurfaceVariant}
                    />
                  </View>
                  <View style={styles.authOfflineInfo}>
                    <Text style={styles.authOfflineTitle}>
                      Bulut Yedekleme Çevrimdışı
                    </Text>
                    <Text style={styles.authOfflineSub}>
                      Verilerinizi güvenle senkronize etmek ve Premium Pro
                      özelliklerini açmak için giriş yapın.
                    </Text>
                  </View>
                </View>
                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.googleButton]}
                    activeOpacity={0.8}
                    onPress={() => handleMockLogin('google')}
                  >
                    <Icon name="g-mobiledata" size={28} color="#0F172A" />
                    <Text style={styles.googleButtonText}>
                      Google ile Giriş
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.socialButton, styles.appleButton]}
                    activeOpacity={0.8}
                    onPress={() => handleMockLogin('apple')}
                  >
                    <Icon name="apple" size={20} color="#FFFFFF" />
                    <Text style={styles.appleButtonText}>Apple ile Giriş</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Daily Targets Section (Bento Grid) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{tr.profile.dailyTargets}</Text>

          <View style={styles.bentoGrid}>
            <GoalCard
              label={tr.profile.calorieTarget}
              icon="local-fire-department"
              accentColor="#EF4444"
              accentInputColor="#EF4444"
              value={localGoals.cal}
              placeholder="---"
              unit="kcal / gün"
              onChange={v => setLocalGoals(p => ({ ...p, cal: v }))}
              onBlur={() => saveGoals()}
              onIncrement={() => adjustGoal('cal', 50)}
              onDecrement={() => adjustGoal('cal', -50)}
              testID="profileGoalCalorie"
            />
            <GoalCard
              label={tr.profile.protein}
              icon="fitness-center"
              accentColor={colors.primary}
              accentInputColor={colors.primary}
              value={localGoals.protein}
              placeholder="---"
              unit="gram / gün"
              onChange={v => setLocalGoals(p => ({ ...p, protein: v }))}
              onBlur={() => saveGoals()}
              onIncrement={() => adjustGoal('protein', 5)}
              onDecrement={() => adjustGoal('protein', -5)}
              testID="profileGoalProtein"
            />
            <GoalCard
              label={tr.profile.carbs}
              icon="grain"
              accentColor="#F59E0B"
              accentInputColor="#F59E0B"
              value={localGoals.carbs}
              placeholder="---"
              unit="gram / gün"
              onChange={v => setLocalGoals(p => ({ ...p, carbs: v }))}
              onBlur={() => saveGoals()}
              onIncrement={() => adjustGoal('carbs', 10)}
              onDecrement={() => adjustGoal('carbs', -10)}
              testID="profileGoalCarbs"
            />
            <GoalCard
              label={tr.profile.fat}
              icon="opacity"
              accentColor="#3B82F6"
              accentInputColor="#3B82F6"
              value={localGoals.fat}
              placeholder="---"
              unit="gram / gün"
              onChange={v => setLocalGoals(p => ({ ...p, fat: v }))}
              onBlur={() => saveGoals()}
              onIncrement={() => adjustGoal('fat', 5)}
              onDecrement={() => adjustGoal('fat', -5)}
              testID="profileGoalFat"
            />
          </View>
        </View>

        {/* Micronutrient Tracking Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>
            {tr.profile.micronutrientTracking}
          </Text>
          <View style={styles.glassPanel}>
            <ToggleRow
              label={tr.profile.sodium}
              icon="opacity"
              iconColor="#94A3B8"
              value={profile.goals.showSodium}
              onChange={v => setGoals({ showSodium: v })}
            />
            <View style={styles.divider} />
            <ToggleRow
              label={tr.profile.fiber}
              icon="spa"
              iconColor="#22C55E"
              value={profile.goals.showFiber}
              onChange={v => setGoals({ showFiber: v })}
            />
            <View style={styles.divider} />
            <ToggleRow
              label={tr.profile.sugar}
              icon="bubble-chart"
              iconColor="#EF4444"
              value={profile.goals.showSugar}
              onChange={v => setGoals({ showSugar: v })}
            />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>{tr.profile.preferences}</Text>
          <View style={styles.glassPanel}>
            <View style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View style={styles.listIconContainer}>
                  <Icon
                    name="settings-accessibility"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.listLabel}>
                  {tr.profile.unitPreference}
                </Text>
              </View>
              <Text style={styles.listValue}>
                {profile.unitSystem === 'metric'
                  ? tr.profile.metric
                  : tr.profile.imperial}
              </Text>
            </View>
          </View>
        </View>

        {/* Export, Reset & Sihirbazı Sıfırla Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.wizardResetButton}
            activeOpacity={0.8}
            onPress={handleResetOnboarding}
          >
            <Icon name="refresh" size={20} color={colors.primary} />
            <Text style={styles.wizardResetText}>
              Sağlık Sihirbazını Baştan Başlat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            activeOpacity={0.8}
            onPress={handleExport}
            testID="profileExportButton"
          >
            <View style={styles.gradientOverlay} />
            <Icon name="download" size={20} color={colors.onPrimary} />
            <Text style={styles.exportText}>{tr.profile.exportData}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.destructiveButton}
            activeOpacity={0.8}
            onPress={handleDeleteAll}
            testID="profileDeleteHistoryButton"
          >
            <Icon name="delete-forever" size={20} color={colors.error} />
            <Text style={styles.destructiveText}>
              {tr.profile.deleteHistory}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={loginModalVisible}
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {loginMethodState === 'google' ? 'Google' : 'Apple'} ile Giriş
            </Text>
            <Text style={styles.modalSubtitle}>
              Mock giriş simülasyonu için e-posta adresinizi yazın:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="E-posta adresiniz"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setLoginModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleLoginConfirm}
              >
                <Text style={styles.modalConfirmText}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  icon,
  iconColor,
  value,
  onChange,
}: {
  label: string;
  icon: string;
  iconColor: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemLeft}>
        <View style={styles.listIconContainer}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.listLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: colors.surfaceContainer,
          true: withAlpha(colors.primary, 0.4),
        }}
        thumbColor={value ? colors.primary : colors.onSurfaceVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  neonOrb1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    opacity: 0.12,
    zIndex: -1,
  },
  neonOrb2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: radii.full,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
    zIndex: -1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['margin-mobile'],
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.outline,
    backgroundColor: withAlpha(colors.background, 0.9),
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: withAlpha(colors.surface, 0.4),
    borderWidth: 1,
    borderColor: colors.outline,
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
    paddingBottom: spacing.xl * 2,
  },
  profileCard: {
    backgroundColor: withAlpha(colors.surface, 0.65),
    borderRadius: radii['2xl'],
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarGlowContainer: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.primary, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.4),
  },
  avatarInner: {
    width: 50,
    height: 50,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    fontFamily: fontFamily.headline,
  },
  profileId: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha(colors.primaryContainer, 0.35),
    borderWidth: 1,
    borderColor: withAlpha(colors.primary, 0.5),
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    paddingLeft: spacing.xs,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  bentoCard: {
    width: '47.5%',
    backgroundColor: withAlpha(colors.surface, 0.6),
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    borderTopWidth: 4,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  bentoAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
    width: '100%',
  },
  adjustBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.surfaceBright, 0.4),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  bentoInput: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    width: 50,
  },
  bentoUnit: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
    textAlign: 'center',
  },
  glassPanel: {
    backgroundColor: withAlpha(colors.surface, 0.6),
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
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.surfaceBright, 0.3),
    borderWidth: 1,
    borderColor: colors.outline,
  },
  listLabel: {
    fontSize: 15,
    color: colors.onSurface,
    fontWeight: '600',
  },
  listValue: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.outline,
    marginLeft: spacing.lg + 36,
  },
  actionSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  exportButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary,
  },
  exportText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onPrimary,
    zIndex: 1,
  },
  destructiveButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.error,
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
  bentoCardRed: {
    borderTopColor: '#EF4444',
  },
  bentoInputRed: {
    color: '#EF4444',
  },
  bentoCardPrimary: {
    borderTopColor: colors.primary,
  },
  bentoInputPrimary: {
    color: colors.primary,
  },
  bentoCardOrange: {
    borderTopColor: '#F59E0B',
  },
  bentoInputOrange: {
    color: '#F59E0B',
  },
  bentoCardBlue: {
    borderTopColor: '#3B82F6',
  },
  bentoInputBlue: {
    color: '#3B82F6',
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: withAlpha(colors.success, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(colors.success, 0.3),
    borderRadius: radii.md,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  freeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  authStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  authStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  authEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  authMethod: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  syncBadge: {
    backgroundColor: withAlpha(colors.success, 0.15),
    borderColor: colors.success,
    borderWidth: 0.5,
    borderRadius: radii.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  syncBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: withAlpha(colors.error, 0.05),
    gap: spacing.xs,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: fontFamily.bodyMedium,
  },
  authOfflineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  authOfflineInfo: {
    flex: 1,
    gap: 2,
  },
  authOfflineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  authOfflineSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    gap: spacing.xs,
    elevation: 2,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  googleButtonText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 13,
  },
  appleButton: {
    backgroundColor: '#0F172A',
    borderColor: colors.outline,
    borderWidth: 1,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  wizardResetButton: {
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wizardResetText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  limitStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  limitInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.xs,
  },
  limitTextWrapper: {
    flex: 1,
  },
  limitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  limitSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 14,
  },
  limitBadge: {
    borderWidth: 0.5,
    borderRadius: radii.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  limitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  limitDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: withAlpha(colors.surface, 0.3),
  },
  limitDotsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  dotsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onSurface,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.onSurface,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
  modalCancelText: {
    color: colors.onSurface,
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
});
