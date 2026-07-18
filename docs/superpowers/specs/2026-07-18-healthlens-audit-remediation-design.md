# HealthLens — Audit Remediation Design Specification

**Tarih:** 2026-07-18
**Durum:** Onaylandı
**Yazar:** Antigravity (AI Ürün ve Mimarî Tasarım Ortağı)
**Proje:** HealthLens Mobile (iOS Primary)
**İlgili Belgeler:** `PRD.md` · `AGENTS.md` · `2026-05-23-healthlens-master-design.md`

---

## 1. Amaç ve Kapsam

Bu belge, 2026-07-18 tarihinde yapılan kapsamlı sağlık taramasında (97 bulgu, 12 mimari kaygı, 13 quick win) tespit edilen sorunların nasıl giderileceğini tanımlar.

**Ana hedefler:**

1. App Store'a gönderilebilir bir React Native uygulamasının teknik temizliğini garanti etmek.
2. Yapay zekâ çağrılarını server-side proxy modeline taşımak; kullanıcının API anahtarı girmesini tamamen kaldırmak; mock veriyi kaldırmak.
3. PRD §7 (offline davranış), §10 (15s timeout, 5s dedup), §11 (schema migration), §14 (a11y), §16 (E2E) gereksinimlerini kod tabanında kanıtlanabilir biçimde karşılamak.

**Kapsam dışı** (bu turda veya ayrı brainstorming döngüsünde ele alınacak):

- Gerçek StoreKit satın alma entegrasyonu (proksi ödeme zaten dış).
- SQLite / WatermelonDB'ye geçiş (MMKV kalır).
- Backend / proxy servisinin kendi kodu (kontrat bu belgede yazılır, implementasyonu ayrı oturum).
- Tam yeniden yazım gerektiren navigasyon değişiklikleri.

---

## 2. AI Mimarisi — Server-Side Proxy Sözleşmesi

### 2.1. Karar gerekçesi

Kullanıcı kararı (2026-07-18):

- Ücretsiz/ücretli katman ayrımı için AI inference **backend tarafında** yapılacak.
- Kullanıcı, UI'da API anahtarı **girmeyecek**.
- Mock veri **olmayacak**; üretim KimI veya MiniMax (veya her ikisi) üzerinden gidecek.
- Mobil uygulama, bir "AI proxy" servisine konuşur. Proxy, sağlayıcı seçimini, anahtar yönetimini ve kota takibini yapar.

### 2.2. `AiClient` Sözleşmesi (`src/services/ai/AiClient.ts`)

```ts
export interface AiRequestOptions {
  signal?: AbortSignal;
  language?: 'tr' | 'en';
  hint?: string;
}

export type AiErrorKind =
  | 'timeout'       // 15s aşıldı
  | 'rate_limit'    // 429
  | 'auth'          // 401/403
  | 'network'       // bağlantı yok
  | 'invalid_payload' // 4xx (rate_limit/auth hariç)
  | 'provider_error'   // 5xx
  | 'parse_error';     // JSON ayrıştırılamadı

export interface AiError {
  kind: AiErrorKind;
  message: string;
  retryAfterSec?: number;
}

export interface AiClient {
  analyzeFoodImage(
    buffer: ArrayBuffer,
    mime: 'image/jpeg' | 'image/png' | 'image/heic',
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult>;
  analyzeTextMeal(
    text: string,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult>;
}
```

### 2.3. Kontrat kuralları

1. **15s timeout.** İstek `AbortSignal.timeout(15_000)` ile sarılır. Abort durumunda reddedilen promise, `AiError{kind:'timeout'}` fırlatır.
2. **5s pencere ile in-flight dedup.** Aynı görsel SHA-256 checksum'una sahip aktif bir istek varsa, yeni çağrı aynı promise'ı döner (`Map<string, Promise<AnalysisResult>>`).
3. **Sıkıştırma.** Mobile taraf, göndermeden önce maksimum uzun kenar 1024px olacak şekilde sıkıştırır. 20MB üstü kaynak reddedilir → kullanıcıya toast.
4. **Hata yeniden deneme politikası.** `timeout`, `network`, `provider_error` → 3 deneme, exponential backoff (1s, 4s, 16s). `rate_limit` → `retryAfterSec` değerini kullanır. `auth`, `invalid_payload`, `parse_error` → kullanıcıya gösterilir, kuyruğa **alınmaz**.
5. **Kimlik bilgisi.** `Authorization: Bearer <token>` başlığı; token `react-native-keychain` ile saklanır, kullanıcıya gösterilmez.

### 2.4. Implementasyon hedefi: `HttpAiClient`

`src/services/ai/HttpAiClient.ts` — `fetch` tabanlı, base URL `AI_PROXY_URL` env'inde. Tüm yukarıdaki kuralları uygular. **Tek** mobil-taraf implementation'ı bu olur; `KimiAdapter`, `GeminiAdapter`, `MockAdapter`, `FORCE_MOCK` env'i tamamen kaldırılır.

### 2.5. Backend (kapsam dışı)

Proxy kendi reposunda (veya karar verildiğinde bu monorepoda `backend/` altında) olacak. Bu belge kontratı belirler; implementasyonu ayrı bir brainstorming oturumunda tasarlanır.

---

## 3. Alt-proje Yol Haritası

### 3.1. Alt-proje 1 — Mimari İskelet

**Süre (efor tahmini, 1 senior RN dev):** 1-2 iş günü.

**Çıktılar:**

- Mega-screen component decomposition:
  - `src/screens/ReviewScreen.tsx` → `src/components/review/{FoodItemRow, SimpleSlider, MacroBadge, AddItemModal, PortionEditModal}.tsx`. Hedef: ekran <300 LOC.
  - `src/screens/ProfileScreen.tsx` → `src/components/profile/{ProfileHeader, DailyGoals, MicronutrientToggles, AccountSection, DataActions}.tsx` + `useReportExporter()` hook.
  - `src/screens/DashboardScreen.tsx` → `src/components/dashboard/{CalorieRing, MacroBars, HydrationCard, TodayMealList}.tsx`.
  - `src/screens/OnboardingScreen.tsx` → `src/components/onboarding/{GoalStep, StatsStep, ProjectionStep, PaywallStep}.tsx`.
  - `src/screens/CameraScreen.tsx` → `src/components/camera/{CameraTopBar, Reticle, BottomControls, VoiceModal}.tsx`.
  - `src/screens/PaywallScreen.tsx` → `src/screens/PaywallScreen.tsx` (≤250 LOC) + `src/config/plans.ts`.
- `mmkvStorage` adapter'ı `src/lib/persist.ts` altında tekilleştir; 4 kopyayı kaldır.
- Tüm 4 Zustand store'a `version: 1, migrate:` + MMKV read hata yakalama (PRD §11).
- 3 `any` temizliği:
  - `CameraScreen.tsx`'te `useRef<Camera>(null)` (kütüphane tipi).
  - `OnboardingScreen.tsx`'te `GoalOption.image: ImageSourcePropType`.
  - `PaywallScreen.tsx`'te `PlanDef.features[].icon: MaterialIconName` literal union.
- `getGradeStyle(grade)` `src/utils/healthGradeStyle.ts`'e taşınır; 3 ekrandaki IIFE kaldırılır.
- `AppState.addEventListener('change', …)` foreground sync için `App.tsx`'e; `processQueue()` ve `syncKeychainLimit()` tetikleyicisi.
- Android `com/hikmetgulsesli/` Kotlin dosyaları commit'lenir; eski `com/healthlens/` kalıntıları temizlenir; `npm run android` ile build sanity testi.
- Türkçe string tutarsızlıkları: "5 adet ücretsiz deneme" → "3 adet"; "X / 5 Hak" → "X / 3 Hak".
- Navigation selector düzeltmesi: `AppNavigator` yalnızca `profile.isFirstLaunch` slice'ına abone.
- **Yeni:** `ProfileScreen`'deki "API Anahtarı" bölümü tamamen kaldırılır (PRD §13).

**Çıkış kriterleri:** `npm run lint` 0 hata, `tsc --noEmit` 0 hata, hiçbir ekran >300 LOC, jest testleri yeşil.

### 3.2. Alt-proje 2 — AI Sözleşmesi + Offline Queue

**Süre:** 2-3 iş günü.

**Çıktılar:**

- `src/services/ai/AiClient.ts` (interface), `src/services/ai/HttpAiClient.ts` (implementasyon), `src/services/ai/errors.ts` (AiError).
- `package.json`'a `react-native-quick-crypto` eklenir (SHA-256 checksum için).
- Mevcut `src/services/aiService.ts`'teki `Kimi`, `Gemini`, mock veri kaldırılır.
- `aiService.ts` yalnızca proxy'ye delege eder; `AiClient` instance'ını env'den alır.
- `src/services/imageUtils.ts`: max 1024px sıkıştırma, 20MB sınırı kontrolü.
- `offlineQueueStore`:
  - `nextRetryAt: ISO string` alanı, exponential backoff.
  - `processQueue()` `AiError{kind}`'a göre karar: queue'ya ekle vs. kullanıcıya göster.
  - `AppState` foreground listener.
  - Hydration-safe: status MMKV'ye yazıldıktan sonra in-flight işaretlenir.
- Testler: `__tests__/aiService.test.ts`, `__tests__/offlineQueueStore.test.ts`.

**Çıkış kriterleri:** 15s timeout testi geçer, dedup testi geçer, backoff testi geçer, gerçek sağlayıcı çağrısı yapılmaz (sahte HttpAiClient ile).

### 3.3. Alt-proje 3 — PRD UX/GAP Kapatma

**Süre:** 2 iş günü.

**Çıktılar:**

- `accessibilityLabel` (Türkçe) + `accessibilityRole` tüm interaktif elemanlarda.
- 44×44pt minimum touch target; küçük butonlar `hitSlop` veya boyut büyütmesi.
- `eslint-plugin-react-native-a11y` eklenir, CI'da kural seti.
- `testID` tüm birincil etkileşim elemanlarında (`cameraCaptureButton`, `saveLogButton` standardıyla).
- İzin reddi instructional empty state + iOS Settings deep link (`Linking.openURL('app-settings:')`).
- `useColorScheme()` + `colors.light.ts`/`colors.dark.ts` + `theme/index.ts` provider.
- `<EmptyState>` `src/components/common/EmptyState.tsx`.
- Türkçe string audit: tüm inline Türkçe string'ler `src/i18n/` dosyalarına çekilir.
- AGENTS.md §11 güncel durumu yansıtır (gallery, barcode, manual, edit, persistence, fonts).
- `.env.example` eklenir.

**Çıkış kriterleri:** Maestro `accessibility-audit.yaml` yeşil, PRD §14 checklist %100.

### 3.4. Alt-proje 4 — Test & Telemetri

**Süre:** 2 iş günü.

**Çıktılar:**

- Jest component testleri: ReviewScreen akışı (capture → edit → save), DashboardScreen bugünkü veri, PaywallScreen 3-tier, CameraScreen permission flow. `react-native-testing-library` eklenir.
- Store testleri: logStore CRUD + dateKey edge case; analysisStore ephemeral; offlineQueueStore backoff/dedup.
- Maestro E2E akışları (`e2e/`):
  - `capture-to-save.yaml`
  - `quota-exhaustion.yaml`
  - `offline-retry.yaml`
  - `goal-recalc.yaml`
- Sentry (`@sentry/react-native`); `beforeSend` ile PII redaksiyonu.
- Husky + lint-staged + GitHub Actions workflow (lint, tsc, jest, maestro).

**Çıkış kriterleri:** Jest screens coverage ≥ %40, Maestro CI yeşil, Sentry crash test edildi.

---

## 4. Çapraz Kurallar (tüm alt-projeler için zorunlu)

| Kural | Uygulama |
|---|---|
| Sıfır yeni `any` | `@typescript-eslint/no-explicit-any`: error; CI reddi |
| Ekran ≤300 LOC | Otomatik lint kuralı (`eslint-plugin-boundaries`) |
| Türkçe UI | Code review checklist'i |
| testID zorunlu | Tüm `Pressable`/`TouchableOpacity` için ESLint kuralı |
| MMKV schema version | Her store `version: 1, migrate` ile başlar |
| A11y default | `accessibilityLabel` + `accessibilityRole` zorunlu |

---

## 5. Riskler

| Risk | Azaltma |
|---|---|
| Mega-screen refactor sırasında regression | Her ekran refactor'ı öncesi 1 regression testi |
| AI proxy kontratının yanlış tasarlanması | Backend spike öncesi kontrat imzalanmaz |
| Sentry PII sızıntısı | `beforeSend` redactor + ilk çalıştırmada onay |
| Maestro CI süresi | Yalnızca 4 critical-path akış, paralel |
| iOS 15 zorlamaları | RN 0.85 + CI build farm erken uyarı |

---

## 6. Kabul Ölçütleri (program düzeyinde)

- 4 alt-proje tamamlanınca: lint 0, tsc 0, jest tüm yeşil, Maestro CI yeşil, AGENTS.md §11 mevcut implementasyonu yansıtır, PRD §14-§16 checklist %100.
- Kullanıcı UI'da API anahtarı görmez; mock veri üretimde yoktur.

---

## 7. Bilinçli Kararlar

1. **Backend kararı sonraya bırakıldı** — proxy konumu (ayrı repo, monorepo `backend/`, serverless) şu an belirsiz. Kontrat önce.
2. **MMKV'de kalındı** — SQLite'ye geçiş bu tur dışı.
3. **StoreKit entegrasyonu kapsam dışı** — paywall demo `ProfileScreen` akışında kalır; gerçek faturalandırma ayrı tur.
4. **Yeni bağımlılıklar (Quick winler):** `react-native-quick-crypto`, `eslint-plugin-react-native-a11y`, `react-native-testing-library`, `@sentry/react-native`, `react-native-image-resizer`, `husky`, `lint-staged`, `eslint-plugin-boundaries`.

---

## 8. Sıradaki Adımlar

1. Bu spec onaylanır ve commit'lenir.
2. Alt-proje 1 implementasyonu başlar: quick-win'ler + mega-screen decomposition. Yazılırken yeni bileşenler için yeni dosyalar.
3. PR review'ları sırasında bu spec referans gösterilir.
4. Alt-proje 1 bittiğinde alt-proje 2: backend spike → `AiClient` kontrat finalizasyonu → HttpAiClient implementasyonu.
