export const tr = {
  appName: 'HealthLens',

  // Camera
  camera: {
    title: 'HealthLens',
    alignFood: 'Yemeği çerçeveye hizalayın',
    gallery: 'Galeri',
    flashOn: 'Flaş Açık',
    flashOff: 'Flaş Kapalı',
    captureError: 'Fotoğraf çekilemedi.',
    errorTitle: 'Hata',
    galleryError: 'Galeriden fotoğraf seçilemedi.',
    processing: 'Analiz ediliyor...',
  },

  // Dashboard
  dashboard: {
    today: 'Bugün',
    dailyEnergy: 'Günlük Enerji',
    target: 'Hedef',
    kcalConsumed: 'ALINAN KCAL',
    kcalRemaining: 'KALAN KCAL',
    macronutrients: 'Makro Besinler',
    protein: 'Protein',
    carbs: 'Karbonhidrat',
    fat: 'Yağ',
    todaysMeals: 'Bugünün Öğünleri',
    emptyMeals: 'İlk öğünü kaydetmek için fotoğraf çekin',
    totalLogged: 'Toplam Kaydedilen',
  },

  // History / Library
  history: {
    title: 'Geçmiş',
    dailySummary: 'Günlük Özet',
    optimal: 'Optimal',
    compareGoals: 'Hedeflerle Karşılaştır',
    todaysLog: 'Bugünün Kaydı',
    noEntries: 'Bu tarih için kayıt yok',
    sevenDayTrend: '7 Günlük Trend',
    calories: 'Kalori',
  },

  // Review
  review: {
    title: 'HealthLens',
    match: 'Eşleşme',
    mealCategory: 'Öğün Kategorisi',
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    snack: 'Ara Öğün',
    detectedItems: 'Tespit Edilenler',
    items: 'Öğe',
    portion: 'Porsiyon',
    energy: 'ENERJİ',
    pro: 'PRO',
    carb: 'KARB',
    fat: 'YAĞ',
    totalNutrition: 'TOPLAM BESİN',
    retake: 'Tekrar Çek',
    saveMeal: 'Öğünü Kaydet',
    noAnalysis: 'Analiz bulunamadı',
    addItem: 'Öğe Ekle',
    errorNoItems: 'En az bir yiyecek öğesi ekleyin.',
    cancel: 'İptal',
    save: 'Kaydet',
  },

  // Profile / Settings
  profile: {
    title: 'Profil',
    subtitle: 'Beslenme hedeflerinizi ve uygulama tercihlerinizi yönetin.',
    dailyTargets: 'Günlük Hedefler',
    calorieTarget: 'Kalori Hedefi',
    protein: 'Protein',
    carbs: 'Karbonhidrat',
    fat: 'Yağ',
    micronutrientTracking: 'Mikro Besin Takibi',
    sodium: 'Sodyum',
    fiber: 'Lif',
    sugar: 'Şeker',
    preferences: 'Tercihler',
    unitPreference: 'Birim Tercihi',
    metric: 'Metrik (g, ml)',
    imperial: 'Emperyal (oz, lb)',
    dataActions: 'Veri İşlemleri',
    exportData: 'Verileri Dışa Aktar',
    deleteHistory: 'Geçmişi Sil',
    deleteConfirm: 'Bu işlem geri alınamaz. Emin misiniz?',
    deleteTitle: 'Geçmişi Sil',
    cancel: 'İptal',
    delete: 'Sil',
  },

  // Tab labels
  tabs: {
    camera: 'Kamera',
    dashboard: 'Ana Sayfa',
    library: 'Geçmiş',
    settings: 'Ayarlar',
  },

  // Meal categories
  meals: {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    snack: 'Ara Öğün',
  },
} as const;

export type Translations = typeof tr;
