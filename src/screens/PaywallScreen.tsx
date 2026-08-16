import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useUserStore } from '../stores/userStore';
import type { PlanTier } from '../types';
import { PLANS, type Period } from '../config/plans';
import { PlanCard } from '../components/paywall/PlanCard';

export function PaywallScreen(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('yearly');
  const [selectedTier, setSelectedTier] = useState<PlanTier>('pro');
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];
  const scansUsedToday =
    profile.freeScansDateKey === todayKey ? profile.freeScansUsed : 0;
  const hasExhaustedFree = !profile.isPremium && scansUsedToday >= 3;
  const isInTrial =
    !!profile.trialEndsAt && new Date(profile.trialEndsAt) > new Date();

  const selectedPlan = PLANS.find(p => p.tier === selectedTier)!;

  const handleSubscribe = () => {
    const priceLabel =
      selectedPeriod === 'yearly'
        ? `${formatPrice(selectedPlan.yearlyCents)}/yıl`
        : `${formatPrice(selectedPlan.monthlyCents)}/ay`;

    Alert.alert(
      'Satın Alma Onayı',
      `${selectedPlan.displayName} (${priceLabel}) aboneliği başlatılacak. Bu demo build olduğu için gerçek ödeme alınmayacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam Et',
          onPress: () => {
            setProfile({
              isPremium: true,
              plan: selectedTier,
              trialEndsAt: null,
            });
            Alert.alert('Hoş Geldiniz!', `${selectedPlan.displayName} üyeliğiniz başarıyla aktif edildi.`, [
              {
                text: 'Harika',
                onPress: () => navigation.canGoBack() && navigation.goBack(),
              },
            ]);
          },
        },
      ],
    );
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const trialEndsAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      setProfile({
        isPremium: true,
        plan: 'pro_plus',
        trialEndsAt,
      });
      Alert.alert(
        '7 Gün Ücretsiz Deneme Başladı!',
        `${new Date(trialEndsAt).toLocaleDateString('tr-TR')} tarihine kadar Pro+ özelliklerine ücretsiz erişim kazandınız. Otomatik ücretlendirme yapılmaz.`,
        [
          {
            text: 'Başla',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ],
      );
    } catch {
      Alert.alert('Hata', 'Deneme başlatılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && !hasExhaustedFree && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>HealthLens Pro</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Bilgi', 'Daha önce alınmış bir Premium üyelik bulunamadı.')
          }
        >
          <Text style={styles.restoreText}>Geri Yükle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <View style={styles.glowingOrb} />
          <View style={styles.lockBadge}>
            <Icon name="workspace-premium" size={36} color={colors.primary} />
          </View>
          {hasExhaustedFree ? (
            <Text style={styles.heroTitle}>Ücretsiz Tarama Hakkınız Doldu</Text>
          ) : isInTrial ? (
            <Text style={styles.heroTitle}>Deneme Süreniz Aktif</Text>
          ) : (
            <Text style={styles.heroTitle}>Sağlığınızı Sınırsız Takip Edin</Text>
          )}
        </View>

        {/* Period toggle */}
        <View style={styles.periodToggle}>
          {(['monthly', 'yearly'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodOption,
                selectedPeriod === p && styles.periodOptionActive,
              ]}
              onPress={() => setSelectedPeriod(p)}
            >
              <Text
                style={[
                  styles.periodOptionText,
                  selectedPeriod === p && styles.periodOptionTextActive,
                ]}
              >
                {p === 'monthly' ? 'Aylık' : 'Yıllık'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map(plan => (
            <PlanCard
              key={plan.tier}
              plan={plan}
              isSelected={plan.tier === selectedTier}
              onSelect={() => setSelectedTier(plan.tier)}
              formatPrice={formatPrice}
              formatPerMonth={formatPerMonth}
            />
          ))}
        </View>

        {/* Features */}
        <View style={styles.featuresPanel}>
          <Text style={styles.featuresPanelHeader}>
            {selectedPlan.displayName.toUpperCase()} İLE NELER GELİYOR?
          </Text>
          {selectedPlan.features.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Icon name={f.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        {!isInTrial && !hasExhaustedFree && selectedTier === 'pro_plus' && (
          <TouchableOpacity
            style={styles.trialButton}
            onPress={handleStartTrial}
            disabled={isStartingTrial}
            activeOpacity={0.8}
            testID="paywallStartTrialButton"
          >
            <Icon name="schedule" size={20} color={colors.primary} />
            <Text style={styles.trialButtonText}>7 GÜN ÜCRETSİZ DENE</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (selectedTier === 'free' || isStartingTrial) &&
              styles.subscribeButtonDisabled,
          ]}
          onPress={
            selectedTier === 'free'
              ? () => navigation.canGoBack() && navigation.goBack()
              : handleSubscribe
          }
          activeOpacity={0.8}
        >
          <Text style={styles.subscribeButtonText}>
            {selectedTier === 'free'
              ? 'Ücretsiz Devam Et'
              : selectedPeriod === 'yearly'
                ? `Yıllık ${formatPrice(selectedPlan.yearlyCents)}`
                : `Aylık ${formatPrice(selectedPlan.monthlyCents)}`}
          </Text>
          {selectedTier !== 'free' && (
            <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatPrice(cents: number): string {
  if (cents === 0) return '₺0';
  return `₺${(cents / 100).toFixed(2)}`;
}

function formatPerMonth(yearlyCents: number): string {
  return `₺${(yearlyCents / 12 / 100).toFixed(2)}/ay`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontWeight: '700',
  },
  restoreText: {
    ...typography.labelMd,
    color: colors.primary,
  },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  glowingOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary}22`,
  },
  lockBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginTop: -40,
  },
  heroTitle: {
    ...typography.headlineLg,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: '700',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodOptionActive: {
    backgroundColor: colors.primary,
  },
  periodOptionText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  periodOptionTextActive: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  plansContainer: {},
  featuresPanel: {
    padding: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    gap: spacing.sm,
  },
  featuresPanelHeader: {
    ...typography.labelCaps,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}1A`,
  },
  featureInfo: { flex: 1 },
  featureTitle: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  featureSub: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  ctaContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  trialButtonText: {
    ...typography.labelMd,
    color: colors.primary,
    fontWeight: '700',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  subscribeButtonDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  subscribeButtonText: {
    ...typography.labelMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
