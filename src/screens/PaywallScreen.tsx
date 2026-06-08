import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { colors, withAlpha } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/radii';
import { fontFamily } from '../theme/typography';
import { useUserStore } from '../stores/userStore';

type PlanTier = 'free' | 'pro' | 'pro_plus';
type Period = 'monthly' | 'yearly';

interface PlanDef {
  tier: PlanTier;
  displayName: string;
  tagline: string;
  monthlyCents: number;
  yearlyCents: number;
  dailyAiQuota: number; // -1 = unlimited
  features: { icon: string; title: string; sub: string }[];
  isPopular?: boolean;
}

const PLANS: PlanDef[] = [
  {
    tier: 'free',
    displayName: 'Ücretsiz',
    tagline: 'Başlamak için ideal',
    monthlyCents: 0,
    yearlyCents: 0,
    dailyAiQuota: 3,
    features: [
      { icon: 'photo-camera', title: '3 AI tarama / gün', sub: 'Klinik besin analizi, porsiyon tespiti' },
      { icon: 'insights', title: 'Temel makro takibi', sub: 'Kalori, protein, karb, yağ' },
      { icon: 'water-drop', title: 'Su tüketimi', sub: 'Dalga animasyonlu günlük hedef' },
      { icon: 'history', title: '7 günlük geçmiş', sub: 'Geçmiş öğünlere erişim' },
    ],
  },
  {
    tier: 'pro',
    displayName: 'Pro',
    tagline: 'Ciddi sağlık takibi için',
    monthlyCents: 499,   // $4.99
    yearlyCents: 5999,   // $59.99
    dailyAiQuota: 100,
    features: [
      { icon: 'all-inclusive', title: 'Sınırsız AI tarama', sub: 'Multi-AI ensemble ile doğruluk' },
      { icon: 'health-and-safety', title: 'Klinik hedef alarmları', sub: 'Tansiyon, diyabet, bağırsak için özel' },
      { icon: 'grade', title: 'A+ → D puanlama', sub: 'Her yemeğe klinik sağlık notu' },
      { icon: 'cloud-sync', title: 'Bulut senkronizasyon', sub: 'Tüm cihazlarda verilerin' },
      { icon: 'picture-as-pdf', title: 'PDF diyetisyen raporu', sub: '7/30 günlük resmi çıktı' },
      { icon: 'history', title: 'Sınırsız geçmiş', sub: 'Tüm öğünlerini ara' },
    ],
    isPopular: true,
  },
  {
    tier: 'pro_plus',
    displayName: 'Pro+',
    tagline: 'Profesyoneller için',
    monthlyCents: 999,    // $9.99
    yearlyCents: 11999,   // $119.99
    dailyAiQuota: -1,
    features: [
      { icon: 'workspace-premium', title: 'Pro\'nun tüm özellikleri', sub: 'Sınırsız AI, klinik alarm, sync' },
      { icon: 'medical-services', title: 'Diyetisyen modu', sub: 'Hedef bazlı profesyonel planlama' },
      { icon: 'bolt', title: 'Öncelikli AI işleme', sub: 'Ortalama 2 sn analiz' },
      { icon: 'notifications-active', title: 'Push bildirimler', sub: 'Su hatırlatıcı, öğün hatırlatıcı' },
      { icon: 'show-chart', title: 'Gelişmiş 90 günlük trendler', sub: 'Uzun dönem analiz' },
      { icon: 'support-agent', title: 'Öncelikli destek', sub: '7/24 yanıt garantisi' },
    ],
  },
];

const formatPrice = (cents: number): string => {
  if (cents === 0) return '₺0';
  return `₺${(cents / 100).toFixed(2)}`;
};

const formatPerMonth = (yearlyCents: number): string => {
  return `₺${(yearlyCents / 12 / 100).toFixed(2)}/ay`;
};

const yearlyDiscount = (plan: PlanDef): number => {
  if (plan.monthlyCents === 0) return 0;
  const monthlyTotal = plan.monthlyCents * 12;
  const saved = monthlyTotal - plan.yearlyCents;
  return Math.round((saved / monthlyTotal) * 100);
};

export function PaywallScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const profile = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('yearly');
  const [selectedTier, setSelectedTier] = useState<PlanTier>('pro');
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const hasExhaustedFree = !profile.isPremium && profile.freeScansUsed >= 5;
  const isInTrial = !!profile.trialEndsAt && new Date(profile.trialEndsAt) > new Date();

  const selectedPlan = PLANS.find(p => p.tier === selectedTier)!;

  const handleSubscribe = () => {
    const priceLabel = selectedPeriod === 'yearly'
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
            Alert.alert(
              'Hoş Geldiniz!',
              `${selectedPlan.displayName} üyeliğiniz başarıyla aktif edildi. ${selectedPeriod === 'yearly' ? 'Yıllık' : 'Aylık'} fatura dönemi başladı.`,
              [{ text: 'Harika', onPress: () => navigation.canGoBack() && navigation.goBack() }],
            );
          },
        },
      ],
    );
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      // 7 gün Pro+ trial — backend'e trial başlatma isteği atılır (prod'da)
      // Burada local state'i güncelliyoruz; backend bağlandığında API call yapılacak
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      setProfile({
        isPremium: true,
        plan: 'pro_plus',
        trialEndsAt,
      });
      Alert.alert(
        '7 Gün Ücretsiz Deneme Başladı!',
        `Pro+ özelliklerine 7 gün boyunca ücretsiz erişim kazandınız. ${new Date(trialEndsAt).toLocaleDateString('tr-TR')} tarihinden sonra otomatik ücretlendirme yapılmaz. İstediğiniz zaman iptal edebilirsiniz.`,
        [{ text: 'Başla', onPress: () => navigation.canGoBack() && navigation.goBack() }],
      );
    } catch {
      Alert.alert('Hata', 'Deneme başlatılamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleRestore = () => {
    Alert.alert('Bilgi', 'Satın alımlarınız kontrol ediliyor. Daha önce alınmış bir Premium üyelik bulunamadı.');
  };

  const handleManualFallback = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header bar */}
      <View style={styles.header}>
        {navigation.canGoBack() && !hasExhaustedFree && (
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color={colors.onSurface} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>HealthLens Pro</Text>
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreText}>Geri Yükle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <View style={styles.heroContainer}>
          <View style={styles.glowingOrb} />
          <View style={styles.lockBadge}>
            <Icon name="workspace-premium" size={36} color={colors.primary} />
          </View>

          {hasExhaustedFree ? (
            <>
              <Text style={styles.heroTitle}>Ücretsiz Tarama Hakkınız Doldu</Text>
              <Text style={styles.heroDesc}>
                Tabağınızın fotoğrafından sodyum, şeker ve lif oranlarını anında tespit eden yapay zeka analizi için 5 adet ücretsiz deneme hakkınızı tamamladınız.
              </Text>
            </>
          ) : isInTrial ? (
            <>
              <Text style={styles.heroTitle}>Deneme Süreniz Aktif</Text>
              <Text style={styles.heroDesc}>
                {new Date(profile.trialEndsAt!).toLocaleDateString('tr-TR')} tarihine kadar Pro+ özelliklerini ücretsiz kullanıyorsunuz.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.heroTitle}>Sağlığınızı Sınırsız Takip Edin</Text>
              <Text style={styles.heroDesc}>
                Klinik puanlama, gıda sağlık dereceleri ve limitsiz yapay zeka tabağı analizlerine anında erişin.
              </Text>
            </>
          )}
        </View>

        {/* Period toggle: Monthly / Yearly */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodOption, selectedPeriod === 'monthly' && styles.periodOptionActive]}
            onPress={() => setSelectedPeriod('monthly')}
          >
            <Text style={[styles.periodOptionText, selectedPeriod === 'monthly' && styles.periodOptionTextActive]}>
              Aylık
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodOption, selectedPeriod === 'yearly' && styles.periodOptionActive]}
            onPress={() => setSelectedPeriod('yearly')}
          >
            <Text style={[styles.periodOptionText, selectedPeriod === 'yearly' && styles.periodOptionTextActive]}>
              Yıllık
            </Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>%50 İNDİRİM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3 plan cards */}
        <View style={styles.plansContainer}>
          {PLANS.map(plan => {
            const isSelected = plan.tier === selectedTier;
            const priceLabel =
              plan.tier === 'free'
                ? 'Ücretsiz'
                : selectedPeriod === 'yearly'
                ? formatPerMonth(plan.yearlyCents)
                : formatPrice(plan.monthlyCents);
            const fullLabel =
              plan.tier === 'free'
                ? ''
                : selectedPeriod === 'yearly'
                ? `${formatPrice(plan.yearlyCents)} / yıl`
                : `${formatPrice(plan.monthlyCents)} / ay`;
            const discount = yearlyDiscount(plan);

            return (
              <TouchableOpacity
                key={plan.tier}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  plan.isPopular && !isSelected && styles.planCardPopular,
                ]}
                onPress={() => setSelectedTier(plan.tier)}
                activeOpacity={0.85}
              >
                {plan.isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>EN POPÜLER</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                      {plan.displayName}
                    </Text>
                    <Text style={styles.planTagline}>{plan.tagline}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Icon name="check" size={16} color={colors.onPrimary} />
                    </View>
                  )}
                </View>

                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                    {priceLabel}
                  </Text>
                  {fullLabel !== '' && (
                    <Text style={styles.planPriceFull}>{fullLabel}</Text>
                  )}
                  {plan.tier !== 'free' && selectedPeriod === 'yearly' && discount > 0 && (
                    <Text style={styles.planDiscount}>
                      Yıllık %{discount} indirim
                    </Text>
                  )}
                </View>

                {plan.tier === 'free' ? (
                  <Text style={styles.planQuota}>
                    {plan.dailyAiQuota} AI tarama / gün
                  </Text>
                ) : (
                  <Text style={styles.planQuota}>
                    {plan.dailyAiQuota === -1 ? 'Sınırsız' : `${plan.dailyAiQuota}`} AI tarama / gün
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feature comparison for selected plan */}
        <View style={styles.featuresPanel}>
          <Text style={styles.featuresPanelHeader}>
            {selectedPlan.displayName.toUpperCase()} İLE NELER GELİYOR?
          </Text>

          {selectedPlan.features.map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Icon name={f.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Trial CTA (Pro+ only) */}
        {!isInTrial && !hasExhaustedFree && selectedTier === 'pro_plus' && (
          <TouchableOpacity
            style={styles.trialButton}
            onPress={handleStartTrial}
            disabled={isStartingTrial}
            activeOpacity={0.8}
          >
            <Icon name="schedule" size={20} color={colors.primary} />
            <Text style={styles.trialButtonText}>
              7 GÜN ÜCRETSİZ DENE — {formatPrice(0)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Subscribe button */}
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            (selectedTier === 'free' || isStartingTrial) && styles.subscribeButtonDisabled,
          ]}
          onPress={selectedTier === 'free' ? handleManualFallback : handleSubscribe}
          activeOpacity={0.8}
        >
          <Text style={styles.subscribeButtonText}>
            {selectedTier === 'free'
              ? 'Ücretsiz Devam Et'
              : selectedPeriod === 'yearly'
              ? `Yıllık ${formatPrice(selectedPlan.yearlyCents)} / yıl`
              : `Aylık ${formatPrice(selectedPlan.monthlyCents)} / ay`}
          </Text>
          {selectedTier !== 'free' && (
            <Icon name="arrow-forward" size={20} color={colors.onPrimary} />
          )}
        </TouchableOpacity>

        {/* Fine print */}
        <Text style={styles.footerLegal}>
          Abonelik bedeli iTunes hesabınızdan tahsil edilecektir. Yenileme tarihi gelmeden 24 saat önce iptal edilmediği sürece abonelikler otomatik olarak yenilenir.
        </Text>

        <View style={styles.legalLinksRow}>
          <TouchableOpacity onPress={() => Alert.alert('Kullanım Koşulları', 'HealthLens Standart Apple Kullanım Şartları (EULA) kurallarına tabidir.')}>
            <Text style={styles.legalLink}>Kullanım Koşulları (EULA)</Text>
          </TouchableOpacity>
          <Text style={styles.legalBullet}>•</Text>
          <TouchableOpacity onPress={() => Alert.alert('Gizlilik Politikası', 'Sağlık verileriniz yerel cihazınızda saklanmakta olup üçüncü şahıslarla paylaşılmaz.')}>
            <Text style={styles.legalLink}>Gizlilik Politikası</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderColor: colors.outline,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
    color: colors.onSurface,
  },
  restoreButton: {
    paddingVertical: spacing.xs,
  },
  restoreText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    marginBottom: spacing.lg,
    position: 'relative',
  },
  glowingOrb: {
    position: 'absolute',
    top: 20,
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: withAlpha(colors.primary, 0.12),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  lockBadge: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.md,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  periodOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  periodOptionActive: {
    backgroundColor: colors.primary,
  },
  periodOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
  },
  periodOptionTextActive: {
    color: colors.onPrimary,
  },
  discountBadge: {
    backgroundColor: withAlpha(colors.success, 0.2),
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  discountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.success,
    letterSpacing: 0.3,
  },
  plansContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  planCardPopular: {
    borderColor: withAlpha(colors.primary, 0.4),
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.06),
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.onSurface,
    fontFamily: fontFamily.sans,
  },
  planNameSelected: {
    color: colors.primary,
  },
  planTagline: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
    fontFamily: fontFamily.sans,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceContainer: {
    marginBottom: spacing.sm,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.onSurface,
    fontFamily: fontFamily.sans,
  },
  planPriceSelected: {
    color: colors.primary,
  },
  planPriceFull: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  planDiscount: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  planQuota: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
  },
  featuresPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featuresPanelHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: withAlpha(colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.onSurface,
    marginBottom: 2,
  },
  featureSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 15,
  },
  trialButton: {
    backgroundColor: withAlpha(colors.primary, 0.15),
    borderColor: colors.primary,
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trialButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
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
  subscribeButtonDisabled: {
    backgroundColor: colors.surfaceContainerHigh,
    shadowOpacity: 0,
  },
  subscribeButtonText: {
    color: colors.onPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  footerLegal: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  legalLink: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalBullet: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
  },
});
