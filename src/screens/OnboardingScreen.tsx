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
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useUserStore } from '../stores/userStore';
import type { HealthGoal } from '../types';

export type OnboardingStep = 1 | 2 | 3 | 4;

interface Props {
  onComplete?: () => void;
}

interface FormState {
  age: string;
  height: string;
  weight: string;
  gender: 'male' | 'female' | 'other' | null;
}

const HEALTH_ADVICE: Partial<Record<Exclude<HealthGoal, null>, string>> = {
  hypertension:
    'Sodyum kısıtlaması (<1500mg/gün) ve tansiyon alarmları ile kalp sağlığınızı kontrol altında tutacağız.',
  diabetes:
    'Glisemik indeks analizi ve sıkı şeker takibi (<35g/gün) ile insülin dalgalanmalarını durduracağız.',
  gut_health:
    'Lif zengini gıdaları (+35g/gün) tespit edip prebiyotik oranlarınızı en üst düzeye çıkaracağız.',
  weight_management:
    'Porsiyon kontrolü, kalori açığı analizi ve yüksek protein dengesiyle kilo kontrolünüzü sağlayacağız.',
};

function DynamicGoals(
  goal: HealthGoal,
): Parameters<ReturnType<typeof useUserStore.getState>['completeOnboarding']>[1] {
  const safe = goal ?? 'weight_management';
  return {
    dailyCalorieGoal: safe === 'diabetes' ? 1800 : 2000,
    dailyProteinGoal: safe === 'weight_management' ? 110 : 80,
    dailyCarbGoal: safe === 'diabetes' ? 180 : 250,
    dailyFatGoal: 65,
    showMicronutrients: safe !== 'weight_management',
    showSodium: safe === 'hypertension',
    showFiber: safe === 'gut_health',
    showSugar: safe === 'diabetes',
  };
}

export function OnboardingScreen({ onComplete: _onComplete }: Props): React.JSX.Element {
  const completeOnboarding = useUserStore(s => s.completeOnboarding);
  const startTrial = useUserStore(s => s.startTrial);

  const [step, setStep] = useState<OnboardingStep>(1);
  const [selectedGoal, setSelectedGoal] = useState<HealthGoal>(null);
  const [form, setForm] = useState<FormState>({
    age: '',
    height: '',
    weight: '',
    gender: null,
  });
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>(
    'yearly',
  );

  const validateGoal = () => {
    if (!selectedGoal) {
      Alert.alert('Hedef Seçin', 'Lütfen bir sağlık odağı seçin.');
      return false;
    }
    return true;
  };

  const validateStats = () => {
    if (!form.age || !form.height || !form.weight || !form.gender) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm fizyolojik verileri doldurun.');
      return false;
    }
    return true;
  };

  const finishOnboarding = (overrides: Record<string, unknown> = {}) => {
    const dynamicGoals = DynamicGoals(selectedGoal);
    completeOnboarding(
      {
        healthGoal: selectedGoal,
        age: parseInt(form.age, 10),
        height: parseInt(form.height, 10),
        weight: parseInt(form.weight, 10),
        gender: form.gender || 'other',
        freeScansDateKey: new Date().toISOString().split('T')[0],
        freeScansUsed: 0,
        ...overrides,
      },
      dynamicGoals,
    );
  };

  const handleStartSubscription = () => {
    finishOnboarding({ isPremium: true, plan: 'pro' });
    Alert.alert(
      'Hoş Geldiniz!',
      'HealthLens Pro üyeliğiniz başlatıldı ve sağlık planınız kuruldu.',
      [{ text: 'Tamam' }],
    );
  };

  const handleStartTrial = () => {
    finishOnboarding({ isPremium: true });
    startTrial(7);
    Alert.alert(
      '7 Gün Ücretsiz Deneme Başladı! 🎉',
      'Pro+ özelliklerine 7 gün boyunca ücretsiz erişim kazandınız. İstediğiniz zaman iptal edebilirsiniz.',
      [{ text: 'Başla' }],
    );
  };

  const handleSkipToFree = () => {
    finishOnboarding({ isPremium: false, plan: 'free' });
    Alert.alert(
      'Hoş Geldiniz!',
      'Ücretsiz sürüm günlük 3 tarama hakkınızla aktif edildi.',
      [{ text: 'Tamam' }],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.topBar}>
        <View style={styles.indicatorContainer}>
          {([1, 2, 3, 4] as const).map(idx => (
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
              Sizin için oluşturulacak klinik diyet puanlamasını bu seçime göre kalibre edeceğiz.
            </Text>
            <View style={styles.optionsList}>
              {[
                { id: 'hypertension' as HealthGoal, title: 'Tansiyon & Kalp', desc: 'Sodyum kısıtlaması' },
                { id: 'diabetes' as HealthGoal, title: 'Kan Şekeri', desc: 'Şeker ve karbonhidrat takibi' },
                { id: 'gut_health' as HealthGoal, title: 'Bağırsak Sağlığı', desc: 'Lif zengini gıdalar' },
                { id: 'weight_management' as HealthGoal, title: 'Kilo Yönetimi', desc: 'Kalori dengesi' },
              ].map(opt => {
                const isSelected = selectedGoal === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    onPress={() => setSelectedGoal(opt.id)}
                  >
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{opt.title}</Text>
                      <Text style={styles.goalDesc}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => validateGoal() && setStep(2)}
            >
              <Text style={styles.nextButtonText}>Devam Et</Text>
              <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Kendinizden Bahsedin</Text>
            <Text style={styles.subtitle}>
              Günlük kalori ve makro limitlerinizi hesaplayabilmek için fizyolojik verilerinizi alıyoruz.
            </Text>
            <View style={styles.formContainer}>
              {([
                { label: 'Yaş', key: 'age' as const, placeholder: 'Örn: 28' },
                { label: 'Boy (cm)', key: 'height' as const, placeholder: 'Örn: 178' },
                { label: 'Kilo (kg)', key: 'weight' as const, placeholder: 'Örn: 74' },
              ] as const).map(field => (
                <View key={field.key}>
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.onSurfaceVariant}
                    keyboardType="numeric"
                    value={form[field.key]}
                    onChangeText={v => setForm(f => ({ ...f, [field.key]: v }))}
                  />
                </View>
              ))}
              <Text style={styles.inputLabel}>Cinsiyet</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      form.gender === g && styles.genderButtonActive,
                    ]}
                    onPress={() => setForm(f => ({ ...f, gender: g }))}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        form.gender === g && styles.genderButtonTextActive,
                      ]}
                    >
                      {g === 'male' ? 'Erkek' : g === 'female' ? 'Kadın' : 'Diğer'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Icon name="arrow-back" size={20} color={colors.onSurface} />
                <Text style={styles.backButtonText}>Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => validateStats() && setStep(3)}
              >
                <Text style={styles.nextButtonText}>Devam Et</Text>
                <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Kişiselleştirilmiş Planınız</Text>
            <Text style={styles.subtitle}>
              {selectedGoal ? HEALTH_ADVICE[selectedGoal as Exclude<HealthGoal, null>] : ''}
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Icon name="arrow-back" size={20} color={colors.onSurface} />
                <Text style={styles.backButtonText}>Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={() => setStep(4)}>
                <Text style={styles.nextButtonText}>Devam Et</Text>
                <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Tüm Pro+ Özelliklerinin Tadını Çıkarın</Text>
            <Text style={styles.subtitle}>
              Yapay zeka asistanı, klinik analiz notları ve limitsiz PDF diyetisyen raporları.
            </Text>

            <View style={styles.trialHeroCard}>
              <Text style={styles.trialTitle}>7 GÜN ÜCRETSİZ DENE</Text>
              <Text style={styles.trialSubtitle}>
                Tüm Pro+ özelliklerini dene. Otomatik ücretlendirme yok.
              </Text>
              <TouchableOpacity style={styles.trialCtaButton} onPress={handleStartTrial}>
                <Text style={styles.trialCtaText}>Şimdi Dene — ₺0</Text>
                <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.pricingHeader}>veya abonelikle başla</Text>
            {(['monthly', 'yearly'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priceCard,
                  selectedPackage === p && styles.priceCardActive,
                ]}
                onPress={() => setSelectedPackage(p)}
              >
                <Text style={styles.pricePeriod}>
                  Pro {p === 'monthly' ? 'Aylık' : 'Yıllık'}
                </Text>
                <Text style={styles.priceValue}>
                  {p === 'monthly' ? '₺49.99 / ay' : '₺599.99 / yıl'}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.subscribeButton} onPress={handleStartSubscription}>
              <Text style={styles.subscribeButtonText}>
                {selectedPackage === 'yearly' ? '₺599.99 / yıl Öde' : '₺49.99 / ay Öde'}
              </Text>
              <Icon name="payment" size={20} color={colors.onPrimary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipLink} onPress={handleSkipToFree}>
              <Text style={styles.skipLinkText}>
                Kısıtlı Sürümle Devam Et (3 Ücretsiz AI Tarama)
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingVertical: spacing.md },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicator: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceContainer,
  },
  indicatorActive: { backgroundColor: colors.primary },
  indicatorComplete: { backgroundColor: colors.primary },
  scrollContent: { padding: spacing.lg },
  stepContainer: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  title: {
    ...typography.headlineXl,
    color: colors.onSurface,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
  },
  optionsList: { gap: spacing.sm },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: { borderColor: colors.primary },
  goalInfo: { flex: 1 },
  goalTitle: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: '600',
  },
  goalDesc: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  formContainer: { gap: spacing.md },
  inputLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  input: {
    ...typography.bodyLg,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
  },
  genderButtonActive: { backgroundColor: colors.primary },
  genderButtonText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  genderButtonTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
  },
  backButtonText: {
    ...typography.labelMd,
    color: colors.onSurface,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  nextButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  trialHeroCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    gap: spacing.sm,
  },
  trialTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  trialSubtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  trialCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
  trialCtaText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  pricingHeader: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
  },
  priceCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.sm,
  },
  priceCardActive: { borderColor: colors.primary },
  pricePeriod: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: '600',
  },
  priceValue: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  subscribeButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  skipLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipLinkText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
});
