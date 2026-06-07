import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useUserStore } from '../stores/userStore';
import type { HealthGoal } from '../types';


interface GoalOption {
  id: HealthGoal;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'hypertension',
    icon: 'favorite',
    title: 'Tansiyon & Kalp Sağlığı',
    description: 'Sodyum kısıtlamasıyla tansiyon dengesini koruyun.',
    color: '#EF4444',
  },
  {
    id: 'diabetes',
    icon: 'opacity',
    title: 'Kan Şekeri Kontrolü',
    description: 'Şeker ve karbonhidratı kısıtlayarak glisemik yükü azaltın.',
    color: '#FB923C',
  },
  {
    id: 'gut_health',
    icon: 'spa',
    title: 'Sindirim & Bağırsak Sağlığı',
    description: 'Yüksek lifli prebiyotik oranlarıyla şişkinliği önleyin.',
    color: '#22C55E',
  },
  {
    id: 'weight_management',
    icon: 'fitness-center',
    title: 'Kilo Yönetimi & Kas Sağlığı',
    description: 'Kalori dengesini koruyarak kas kütlenizi artırın.',
    color: '#14B8A6',
  },
];

export function OnboardingScreen(): React.JSX.Element {
  const completeOnboarding = useUserStore(s => s.completeOnboarding);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGoal, setSelectedGoal] = useState<HealthGoal>(null);
  
  // Stats
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);

  // Paywall Option
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>('monthly');

  const handleNextFromGoal = () => {
    if (!selectedGoal) {
      Alert.alert('Hedef Seçin', 'Lütfen devam etmeden önce bir sağlık odağı seçin.');
      return;
    }
    setStep(2);
  };

  const handleNextFromStats = () => {
    if (!age || !height || !weight || !gender) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm fizyolojik verileri doldurun.');
      return;
    }
    setStep(3);
  };

  const calculateSuccessDate = (): string => {
    const date = new Date();
    // 8 weeks in days = 56 days
    date.setDate(date.getDate() + 56);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDynamicAdvice = (): string => {
    switch (selectedGoal) {
      case 'hypertension':
        return 'Sodyum kısıtlaması (<1500mg/gün) ve tansiyon alarmları ile kalp sağlığınızı kontrol altında tutacağız.';
      case 'diabetes':
        return 'Glisemik indeks analizi ve sıkı şeker takibi (<35g/gün) ile insülin dalgalanmalarını durduracağız.';
      case 'gut_health':
        return 'Lif zengini gıdaları (+35g/gün) tespit edip prebiyotik oranlarınızı en üst düzeye çıkaracağız.';
      case 'weight_management':
        return 'Porsiyon kontrolü, kalori açığı analizi ve yüksek protein dengesiyle kilo kontrolünüzü sağlayacağız.';
      default:
        return '';
    }
  };

  const handleStartSubscription = () => {
    // Pro Subscription logic
    const dynamicGoals = getDynamicGoals();
    completeOnboarding(
      {
        healthGoal: selectedGoal,
        age: parseInt(age, 10),
        height: parseInt(height, 10),
        weight: parseInt(weight, 10),
        gender: gender || 'other',
        isPremium: true,
      },
      dynamicGoals,
    );
    Alert.alert('Hoş Geldiniz!', 'HealthLens Premium Pro üyeliğiniz başlatıldı ve sağlık planınız kuruldu.', [{ text: 'Tamam' }]);
  };

  const handleSkipToFree = () => {
    // Free Scan Limit logic
    const dynamicGoals = getDynamicGoals();
    completeOnboarding(
      {
        healthGoal: selectedGoal,
        age: parseInt(age, 10),
        height: parseInt(height, 10),
        weight: parseInt(weight, 10),
        gender: gender || 'other',
        isPremium: false,
        freeScansUsed: 0,
      },
      dynamicGoals,
    );
    Alert.alert('Hoş Geldiniz!', 'Ücretsiz sürüm 5 tarama hakkınızla aktif edildi.', [{ text: 'Tamam' }]);
  };

  const getDynamicGoals = () => {
    const showMicro = selectedGoal !== 'weight_management';
    return {
      dailyCalorieGoal: selectedGoal === 'diabetes' ? 1800 : 2000,
      dailyProteinGoal: selectedGoal === 'weight_management' ? 110 : 80,
      dailyCarbGoal: selectedGoal === 'diabetes' ? 180 : 250,
      dailyFatGoal: 65,
      showMicronutrients: showMicro,
      showSodium: selectedGoal === 'hypertension',
      showFiber: selectedGoal === 'gut_health',
      showSugar: selectedGoal === 'diabetes',
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Upper Navigation Indicator */}
      <View style={styles.topBar}>
        <View style={styles.indicatorContainer}>
          {[1, 2, 3, 4].map(idx => (
            <View
              key={idx}
              style={[
                styles.indicator,
                step === idx && styles.indicatorActive,
                step > idx && styles.indicatorComplete,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Sağlık Odağınız Nedir?</Text>
            <Text style={styles.subtitle}>
              Sizin için oluşturulacak klinik diyet puanlamasını ve alarm kısıtlarını bu seçime göre kalibre edeceğiz.
            </Text>

            <View style={styles.optionsList}>
              {GOAL_OPTIONS.map(opt => {
                const isSelected = selectedGoal === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.goalCard,
                      isSelected && { borderColor: opt.color, backgroundColor: withAlpha(opt.color, 0.08) },
                    ]}
                    onPress={() => setSelectedGoal(opt.id)}
                  >
                    <View style={[styles.iconWrapper, { backgroundColor: withAlpha(opt.color, 0.15) }]}>
                      <Icon name={opt.icon} size={28} color={opt.color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{opt.title}</Text>
                      <Text style={styles.goalDesc}>{opt.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNextFromGoal}>
              <Text style={styles.nextButtonText}>Devam Et</Text>
              <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Kendinizden Bahsedin</Text>
            <Text style={styles.subtitle}>
              Günlük kalori ve makro limitlerinizi tam hesaplayabilmek için fizyolojik verilerinizi alıyoruz.
            </Text>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Yaş</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 28"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />

              <Text style={styles.inputLabel}>Boy (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 178"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />

              <Text style={styles.inputLabel}>Kilo (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: 74"
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />

              <Text style={styles.inputLabel}>Cinsiyet</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map(g => {
                  const label = g === 'male' ? 'Erkek' : g === 'female' ? 'Kadın' : 'Diğer';
                  const isSel = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderButton, isSel && styles.genderButtonActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[styles.genderText, isSel && styles.genderTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Icon name="arrow-back" size={20} color={colors.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextButton, styles.flexButton]} onPress={handleNextFromStats}>
                <Text style={styles.nextButtonText}>Profili Analiz Et</Text>
                <Icon name="psychology" size={22} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Klinik Başarı Projeksiyonu</Text>
            <Text style={styles.subtitle}>
              HealthLens veri motoru, verdiğiniz bilgilere göre iyileşme ve hedefe ulaşma takviminizi modelledi:
            </Text>

            <View style={styles.glassProjectionCard}>
              <Text style={styles.projTitle}>Öngörülen Başarı Takvimi</Text>
              <Text style={styles.projDate}>{calculateSuccessDate()}</Text>
              <Text style={styles.projHighlight}>8 Hafta İçinde Dengelenme Hedefi</Text>
              
              <View style={styles.adviceBubble}>
                <Icon name="lightbulb" size={20} color={colors.primary} style={styles.adviceIcon} />
                <Text style={styles.adviceText}>{getDynamicAdvice()}</Text>
              </View>
            </View>

            <View style={styles.bulletsList}>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={18} color={colors.success} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>Klinik derecelendirme puanlamaları kuruldu.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Icon name="check-circle" size={18} color={colors.success} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>Tuz, şeker ve lif alarm limitleri kilitlendi.</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Icon name="arrow-back" size={20} color={colors.onSurface} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nextButton, styles.flexButton]} onPress={() => setStep(4)}>
                <Text style={styles.nextButtonText}>Planı Etkinleştir</Text>
                <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>HealthLens Pro</Text>
            <Text style={styles.subtitle}>
              Yapay zeka asistanı, klinik analiz notları ve limitsiz PDF diyetisyen raporları ile sağlığınızı koruyun.
            </Text>

            {/* Premium Package Options */}
            <View style={styles.pricingContainer}>
              <TouchableOpacity
                style={[styles.priceCard, selectedPackage === 'monthly' && styles.priceCardActive]}
                onPress={() => setSelectedPackage('monthly')}
              >
                <View style={styles.priceRow}>
                  <Text style={styles.pricePeriod}>Klinik Pro — Aylık Plan</Text>
                  <Text style={styles.priceValue}>$9.99 / ay</Text>
                </View>
                <Text style={styles.priceInfo}>Aylık otomatik yenilenir. İstediğiniz an iptal edebilirsiniz.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.priceCard, selectedPackage === 'yearly' && styles.priceCardActive]}
                onPress={() => setSelectedPackage('yearly')}
              >
                <View style={styles.badgeLabel}>
                  <Text style={styles.badgeText}>3 GÜN ÜCRETSİZ</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.pricePeriod}>Yıllık Plan (3 Gün Trial)</Text>
                  <Text style={styles.priceValue}>$79.99 / yıl</Text>
                </View>
                <Text style={styles.priceInfo}>Deneme sonu ₺2400/yıl. İptal edilmezse yenilenir.</Text>
              </TouchableOpacity>
            </View>

            {/* Pro Features Grid */}
            <View style={styles.featuresPanel}>
              <View style={styles.featureRow}>
                <Icon name="center-focus-weak" size={22} color={colors.primary} style={styles.featureIcon} />
                <View>
                  <Text style={styles.featureHeader}>Yapay Zeka Görsel Analiz (Scan)</Text>
                  <Text style={styles.featureSub}>Yemeğinizin fotoğrafından anında besin ve porsiyon teşhisi.</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Icon name="verified" size={22} color={colors.success} style={styles.featureIcon} />
                <View>
                  <Text style={styles.featureHeader}>Klinik Derecelendirme (A+ to D)</Text>
                  <Text style={styles.featureSub}>Sağlık hedefinize özel tuz, şeker ve lif alarm katsayıları.</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.subscribeButton} onPress={handleStartSubscription}>
              <Text style={styles.subscribeButtonText}>Premium Pro Üyeliği Başlat</Text>
              <Icon name="payment" size={20} color={colors.onPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipLink} onPress={handleSkipToFree}>
              <Text style={styles.skipLinkText}>Kısıtlı Sürümü Dene (5 Ücretsiz AI Tarama)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  indicator: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radii.full,
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  indicatorComplete: {
    backgroundColor: colors.primaryContainer,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  stepContainer: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  optionsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.sans,
    color: colors.onSurface,
    marginBottom: 4,
  },
  goalDesc: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
    lineHeight: 14,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  nextButtonText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
    fontSize: 15,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderColor: colors.outline,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: radii.md,
    color: colors.onSurface,
    padding: spacing.md,
    fontSize: 15,
    fontFamily: fontFamily.sans,
    marginBottom: spacing.lg,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderColor: colors.outline,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.08),
  },
  genderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.onSurfaceVariant,
  },
  genderTextActive: {
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: 'auto',
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: radii.full,
    borderColor: colors.outline,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexButton: {
    flex: 1,
  },
  glassProjectionCard: {
    backgroundColor: withAlpha(colors.surface, 0.6),
    borderColor: colors.outline,
    borderWidth: 1.5,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  projTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  projDate: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 4,
  },
  projHighlight: {
    fontSize: 12,
    color: colors.onSurface,
    marginBottom: spacing.lg,
  },
  adviceBubble: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  adviceIcon: {
    alignSelf: 'center',
  },
  adviceText: {
    flex: 1,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 15,
  },
  bulletsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bulletIcon: {
    alignSelf: 'center',
  },
  bulletText: {
    fontSize: 13,
    color: colors.onSurface,
  },
  pricingContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  priceCardActive: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.05),
  },
  badgeLabel: {
    position: 'absolute',
    top: -10,
    right: 15,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.onPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  priceInfo: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  featuresPanel: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderColor: colors.outline,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginTop: 2,
  },
  featureHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  featureSub: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
    lineHeight: 13,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: spacing.md,
  },
  subscribeButtonText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  skipLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipLinkText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
