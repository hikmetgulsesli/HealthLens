import type { PlanTier } from '../types';
import type { MaterialIconName } from '../types/icons';

export type Period = 'monthly' | 'yearly';

export interface PlanFeature {
  icon: MaterialIconName;
  title: string;
  sub: string;
}

export interface PlanDef {
  tier: PlanTier;
  displayName: string;
  tagline: string;
  monthlyCents: number;
  yearlyCents: number;
  dailyAiQuota: number; // -1 = unlimited
  features: PlanFeature[];
  isPopular?: boolean;
}

export const PLANS: PlanDef[] = [
  {
    tier: 'free',
    displayName: 'Ücretsiz',
    tagline: 'Başlamak için ideal',
    monthlyCents: 0,
    yearlyCents: 0,
    dailyAiQuota: 3,
    features: [
      {
        icon: 'photo-camera',
        title: '3 AI tarama / gün',
        sub: 'Klinik besin analizi, porsiyon tespiti',
      },
      {
        icon: 'insights',
        title: 'Temel makro takibi',
        sub: 'Kalori, protein, karb, yağ',
      },
      {
        icon: 'water-drop',
        title: 'Su tüketimi',
        sub: 'Dalga animasyonlu günlük hedef',
      },
      {
        icon: 'history',
        title: '7 günlük geçmiş',
        sub: 'Geçmiş öğünlere erişim',
      },
    ],
  },
  {
    tier: 'pro',
    displayName: 'Pro',
    tagline: 'Ciddi sağlık takibi için',
    monthlyCents: 499,
    yearlyCents: 4990,
    dailyAiQuota: 100,
    features: [
      {
        icon: 'auto-awesome',
        title: 'Sınırsız AI tarama',
        sub: 'Multi-AI ensemble ile doğruluk',
      },
      {
        icon: 'favorite',
        title: 'Klinik hedef alarmları',
        sub: 'Tansiyon, diyabet, bağırsak için özel',
      },
      {
        icon: 'star',
        title: 'A+ → D puanlama',
        sub: 'Her yemeğe klinik sağlık notu',
      },
      {
        icon: 'cloud-queue',
        title: 'Bulut senkronizasyon',
        sub: 'Tüm cihazlarda verilerin',
      },
      {
        icon: 'analytics',
        title: 'PDF diyetisyen raporu',
        sub: '7/30 günlük resmi çıktı',
      },
      { icon: 'history', title: 'Sınırsız geçmiş', sub: 'Tüm öğünlerini ara' },
    ],
    isPopular: true,
  },
  {
    tier: 'pro_plus',
    displayName: 'Pro+',
    tagline: 'Profesyoneller için',
    monthlyCents: 999,
    yearlyCents: 9990,
    dailyAiQuota: -1,
    features: [
      {
        icon: 'workspace-premium',
        title: "Pro'nun tüm özellikleri",
        sub: 'Sınırsız AI, klinik alarm, sync',
      },
      {
        icon: 'restaurant',
        title: 'Diyetisyen modu',
        sub: 'Hedef bazlı profesyonel planlama',
      },
      {
        icon: 'bolt',
        title: 'Öncelikli AI işleme',
        sub: 'Ortalama 2 sn analiz',
      },
      {
        icon: 'flash-on',
        title: 'Push bildirimler',
        sub: 'Su hatırlatıcı, öğün hatırlatıcı',
      },
      {
        icon: 'auto-awesome',
        title: 'Gelişmiş 90 günlük trendler',
        sub: 'Uzun dönem analiz',
      },
      {
        icon: 'lock',
        title: 'Öncelikli destek',
        sub: '7/24 yanıt garantisi',
      },
    ],
  },
];
