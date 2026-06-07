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

export function PaywallScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const profile = useUserStore(s => s.profile);
  const setProfile = useUserStore(s => s.setProfile);

  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>('monthly');

  const hasExhaustedFree = !profile.isPremium && profile.freeScansUsed >= 5;

  const handleSubscribe = () => {
    setProfile({ isPremium: true });
    Alert.alert('Hoş Geldiniz!', 'HealthLens Premium Pro üyeliğiniz başarıyla aktif edildi. Limitsiz AI kamerasının keyfini çıkarın!', [
      {
        text: 'Harika',
        onPress: () => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  const handleManualFallback = () => {
    // If they want to input food manually, we close the paywall and let them enter from dashboard/history
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleRestore = () => {
    Alert.alert('Bilgi', 'Satın alımlarınız kontrol ediliyor. Daha önce alınmış bir Premium üyelik bulunamadı.');
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Kilit / Limit İndikatörü */}
        <View style={styles.lockContainer}>
          <View style={styles.glowingOrb} />
          <View style={styles.lockBadge}>
            <Icon name="lock" size={40} color={colors.primary} />
          </View>
          
          {hasExhaustedFree ? (
            <>
              <Text style={styles.limitTitle}>Ücretsiz Tarama Hakkınız Doldu</Text>
              <Text style={styles.limitDesc}>
                Tabağınızın fotoğrafından sodyum, şeker ve lif oranlarını anında tespit eden yapay zeka analizi için **5 adet ücretsiz** deneme hakkınızı tamamladınız.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.limitTitle}>Sağlığınızı Sınırsız Takip Edin</Text>
              <Text style={styles.limitDesc}>
                Daha zengin klinik puanlama, gıda sağlık dereceleri ve limitsiz yapay zeka tabağı analizlerine anında erişin.
              </Text>
            </>
          )}
        </View>

        {/* Paket Seçenekleri */}
        <View style={styles.packagesContainer}>
          <TouchableOpacity
            style={[styles.packageCard, selectedPackage === 'monthly' && styles.packageCardActive]}
            onPress={() => setSelectedPackage('monthly')}
          >
            <View style={styles.priceRow}>
              <Text style={styles.packagePeriod}>Klinik Pro — Aylık Plan</Text>
              <Text style={styles.packagePrice}>$9.99 / ay</Text>
            </View>
            <Text style={styles.packageInfo}>Aylık otomatik yenilenir. Dilediğiniz an App Store'dan iptal edin.</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.packageCard, selectedPackage === 'yearly' && styles.packageCardActive]}
            onPress={() => setSelectedPackage('yearly')}
          >
            <View style={styles.yearlyBadge}>
              <Text style={styles.yearlyBadgeText}>3 GÜN ÜCRETSİZ TRIAL</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.packagePeriod}>Yıllık Plan (3 Gün Deneme)</Text>
              <Text style={styles.packagePrice}>$79.99 / yıl</Text>
            </View>
            <Text style={styles.packageInfo}>Deneme sonu ₺2400/yıl. İptal edilmezse otomatik yenilenir.</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Özellikler Listesi */}
        <View style={styles.featuresPanel}>
          <Text style={styles.featuresPanelHeader}>PRO ÜYELİK AVANTAJLARI</Text>
          
          <View style={styles.featureItem}>
            <Icon name="center-focus-strong" size={20} color={colors.primary} style={styles.featureIcon} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Limitsiz AI Görsel Analiz (Scan)</Text>
              <Text style={styles.featureSub}>Tabak fotoğraflarından tüm sinsi kalori ve mikro makroların tespiti.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Icon name="health-and-safety" size={20} color={colors.success} style={styles.featureIcon} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Dinamik Puanlama ve Uyarı Limitleri</Text>
              <Text style={styles.featureSub}>Tansiyon, diyabet ve bağırsak sağlığına özel gıda sağlık notları (A+ to D).</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Icon name="keyboard-voice" size={20} color={colors.tertiary} style={styles.featureIcon} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Türkçe Sesli NLP Kayıt Çubuğu</Text>
              <Text style={styles.featureSub}>Konuşarak saniyeler içinde zengin tabak analizleri kaydetme.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Icon name="picture-as-pdf" size={20} color={colors.primaryLight} style={styles.featureIcon} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Klinik PDF Diyet Raporu</Text>
              <Text style={styles.featureSub}>Diyetisyeninizle paylaşabileceğiniz 7 günlük resmi besin trend ihracatı.</Text>
            </View>
          </View>
        </View>

        {/* Subscribe Action Button */}
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>Premium Pro Üyeliği Etkinleştir</Text>
          <Icon name="verified-user" size={20} color={colors.onPrimary} />
        </TouchableOpacity>

        {/* Manuel Kayda Devam Et Linki */}
        <TouchableOpacity style={styles.manualLink} onPress={handleManualFallback}>
          <Text style={styles.manualLinkText}>
            {hasExhaustedFree ? 'Manuel Arama ve Elle Kayda Geç →' : 'Kısıtlı Sürümle Devam Et'}
          </Text>
        </TouchableOpacity>

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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  lockContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    marginBottom: spacing.xl,
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
  limitTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: fontFamily.sans,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  limitDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontFamily: fontFamily.sans,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.md,
  },
  packagesContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.outline,
    borderWidth: 1.5,
    borderRadius: radii.lg,
    padding: spacing.lg,
    position: 'relative',
  },
  packageCardActive: {
    borderColor: colors.primary,
    backgroundColor: withAlpha(colors.primary, 0.05),
  },
  yearlyBadge: {
    position: 'absolute',
    top: -10,
    right: 15,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  yearlyBadgeText: {
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
  packagePeriod: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  packagePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary,
  },
  packageInfo: {
    fontSize: 10,
    color: colors.onSurfaceVariant,
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
  featureIcon: {
    marginTop: 2,
    alignSelf: 'center',
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
    fontSize: 10.5,
    color: colors.onSurfaceVariant,
    lineHeight: 14,
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
  manualLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  manualLinkText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  footerLegal: {
    fontSize: 9,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: spacing.lg,
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
