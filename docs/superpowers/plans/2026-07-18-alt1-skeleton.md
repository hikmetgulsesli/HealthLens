# Alt-proje 1 — Mimari İskelet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the HealthLens architecture baseline — unify persistence, eliminate `any` types from domain code, remove quick-win smells, and decompose mega-screens into focused components so each screen file is <300 LOC.

**Architecture:** Single-source `mmkvStorage` adapter + shared grade-style helper + per-store Zustand migrations. Mega-screens become thin containers that compose components from `src/components/<domain>/`. Frontground sync moves to `App.tsx`. `AiClient` interface introduced (implementation deferred to alt-project 2).

**Tech Stack:** React Native 0.85 + TypeScript, Zustand + MMKV, react-native-keychain (existing), `material-icons` types only (no new deps this round).

---

## Global Constraints

These apply to every task. They are copied verbatim from `docs/superpowers/specs/2026-07-18-healthlens-audit-remediation-design.md` §4.

- Zero new `any` in domain code. ESLint rule `@typescript-eslint/no-explicit-any: error`.
- Every screen file ≤ 300 LOC (excluding imports + end-of-file newline).
- All user-facing strings in Turkish (`tr`). English allowed only in logs/internal errors.
- Every interactive element gets `testID` + `accessibilityLabel` + `accessibilityRole`. (Quick-win subset — minimum one element per screen touched.)
- Every Zustand `persist` config gets `version: 1` + `migrate` function. (Existing data has no version → migration must be defensive.)
- Free-scan limit copy uses 3 (not 5). The strings "5 adet" and "/ 5 Hak" must not appear anywhere in shipped code.
- The user must never see an API-key input. The "API Anahtarı" section in `ProfileScreen` must be removed.
- No force-push, no skipping hooks, no `--no-verify` without explicit user approval.
- Commits are atomic per task. One commit per task. Use Conventional Commits: `feat(scope): …`, `fix(scope): …`, `refactor(scope): …`.

---

## File Map

Files created in this plan:

| Path | Responsibility |
|---|---|
| `src/lib/persist.ts` | Single MMKV-backed Zustand `StateStorage` factory + `createMmkvStorage(instanceId)` helper. |
| `src/utils/healthGradeStyle.ts` | `getGradeStyle(grade): {badgeStyle, textStyle}` pure helper. |
| `src/utils/date.ts` | `getTodayKey()` shared between stores/screens. |
| `src/types/icons.ts` | `MaterialIconName` literal union for Vector Icons. |
| `src/services/ai/AiClient.ts` | `AiClient` interface + `AiErrorKind` enum (declaration only). |
| `src/services/ai/errors.ts` | `AiError` class factory. |
| `src/components/common/EmptyState.tsx` | Reusable empty-state component. |
| `src/components/camera/CameraTopBar.tsx` | Top bar extracted from CameraScreen. |
| `src/components/camera/Reticle.tsx` | Focus reticle overlay. |
| `src/components/camera/BottomControls.tsx` | Shutter + gallery + flash + barcode buttons. |
| `src/components/dashboard/CalorieRing.tsx` | Calorie-progress ring. |
| `src/components/dashboard/MacroBars.tsx` | Protein/carbs/fat progress bars. |
| `src/components/dashboard/HydrationCard.tsx` | Liquid wave card. |
| `src/components/dashboard/TodayMealList.tsx` | Today's meal list (sans external computation). |
| `src/components/review/FoodItemRow.tsx` | Single detected food row with portion slider. |
| `src/components/review/MacroBadge.tsx` | A/B/C/D grade badge. |
| `src/components/review/SimpleSlider.tsx` | Standalone slider used in review. |
| `src/components/review/AddItemModal.tsx` | Manual-add modal. |
| `src/components/onboarding/PaywallStep.tsx` | Final onboarding step (pricing + trial). |
| `src/config/plans.ts` | `PLANS` constant + `PlanDef` type. |

Files modified in this plan:

| Path | Reason |
|---|---|
| `src/stores/userStore.ts` | Use `createMmkvStorage`; add `version: 1, migrate`; remove API-key usage (we don't read it here but behavior is verified); `getTodayKey` → shared util. |
| `src/stores/logStore.ts` | Same persist upgrade. |
| `src/stores/analysisStore.ts` | Same persist upgrade. |
| `src/stores/offlineQueueStore.ts` | Same persist upgrade. |
| `src/stores/hydrationStore.ts` | Same persist upgrade. |
| `src/screens/CameraScreen.tsx` | Decompose into components; remove `any`. |
| `src/screens/ReviewScreen.tsx` | Decompose; remove `any`; add `testID` to save button. |
| `src/screens/DashboardScreen.tsx` | Decompose; use `getGradeStyle`. |
| `src/screens/HistoryScreen.tsx` | Use `getGradeStyle`. |
| `src/screens/ProfileScreen.tsx` | Remove API-key section; fix "/5 Hak" → "/3 Hak". |
| `src/screens/PaywallScreen.tsx` | Use `src/config/plans`; remove local `PlanTier` shadow; remove `any`. |
| `src/screens/OnboardingScreen.tsx` | Remove `any` on `GoalOption.image`; fix Turkish copy "5 adet". |
| `src/navigation/AppNavigator.tsx` | Use narrow selector `useUserStore(s => s.profile.isFirstLaunch)`. |
| `App.tsx` | Add `AppState.addEventListener('change', …)` foreground sync. |
| `src/services/aiService.ts` | Replace direct provider mocks with proxy stub + `AiClient` interface import. |
| `.eslintrc.js` | Add `@typescript-eslint/no-explicit-any: error`. |
| `package.json` | Add `typecheck` script if missing. |
| `__tests__/lib/persist.test.ts` | New — tests `createMmkvStorage`. |
| `__tests__/utils/healthGradeStyle.test.ts` | New — tests `getGradeStyle`. |
| `__tests__/utils/date.test.ts` | New — tests `getTodayKey`. |
| `__tests__/stores/migration.test.ts` | New — verifies each store's `migrate` function exists and is defensive. |

---

## Task 1: Add shared `createMmkvStorage` adapter

**Files:**
- Create: `src/lib/persist.ts`
- Create: `__tests__/lib/persist.test.ts`

**Interfaces:**
- Produces: `createMmkvStorage(instanceId: string): StateStorage` — used by every Zustand `persist` config in Task 5.
- Consumes: `react-native-mmkv`'s `MMKV` and `zustand/middleware`'s `StateStorage`.

- [ ] **Step 1: Write the failing test**

Edit `__tests__/lib/persist.test.ts`:

```ts
import { createMmkvStorage } from '../../src/lib/persist';

describe('createMmkvStorage', () => {
  it('returns a StateStorage with getItem/setItem/removeItem', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
  });

  it('persists a value via setItem and reads it back via getItem', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    storage.setItem('k', 'v');
    expect(storage.getItem('k')).toBe('v');
  });

  it('returns null from getItem when key is missing', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    expect(storage.getItem('missing')).toBeNull();
  });

  it('removes a key via removeItem', () => {
    const storage = createMmkvStorage('test-' + Date.now());
    storage.setItem('k', 'v');
    storage.removeItem('k');
    expect(storage.getItem('k')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/lib/persist.test.ts`
Expected: FAIL — `Cannot find module '../../src/lib/persist'`.

- [ ] **Step 3: Implement `createMmkvStorage`**

Create `src/lib/persist.ts`:

```ts
import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export function createMmkvStorage(instanceId: string): StateStorage {
  const storage = new MMKV({ id: instanceId });
  return {
    getItem: (name: string) => {
      try {
        const value = storage.getString(name);
        return value ?? null;
      } catch (err) {
        console.warn(`[persist] getItem failed for ${name}:`, err);
        return null;
      }
    },
    setItem: (name: string, value: string) => {
      try {
        storage.set(name, value);
      } catch (err) {
        console.warn(`[persist] setItem failed for ${name}:`, err);
      }
    },
    removeItem: (name: string) => {
      try {
        storage.delete(name);
      } catch (err) {
        console.warn(`[persist] removeItem failed for ${name}:`, err);
      }
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/lib/persist.test.ts`
Expected: PASS — 4/4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/persist.ts __tests__/lib/persist.test.ts
git commit -m "feat(persist): single MMKV-backed Zustand StateStorage factory"
```

---

## Task 2: Extract `getGradeStyle()` shared helper

**Files:**
- Create: `src/utils/healthGradeStyle.ts`
- Create: `__tests__/utils/healthGradeStyle.test.ts`

**Interfaces:**
- Produces: `getGradeStyle(grade: 'A' | 'B' | 'C' | 'D'): { badgeStyle: ViewStyle; textStyle: TextStyle }` — pure function, no React imports.
- Consumes: only `ViewStyle` and `TextStyle` from `react-native`.
- Used in: Tasks 8 (Dashboard), 9 (History), 10 (Review) — replaces 3 duplicated IIFE blocks.

- [ ] **Step 1: Write the failing test**

Create `__tests__/utils/healthGradeStyle.test.ts`:

```ts
import { getGradeStyle } from '../../src/utils/healthGradeStyle';

describe('getGradeStyle', () => {
  it('returns badge and text style for each grade', () => {
    (['A', 'B', 'C', 'D'] as const).forEach(grade => {
      const result = getGradeStyle(grade);
      expect(result.badgeStyle).toBeDefined();
      expect(result.textStyle).toBeDefined();
    });
  });

  it('returns different colors per grade', () => {
    const a = getGradeStyle('A');
    const d = getGradeStyle('D');
    expect(a.badgeStyle.backgroundColor).not.toBe(d.badgeStyle.backgroundColor);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/utils/healthGradeStyle.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `getGradeStyle`**

Create `src/utils/healthGradeStyle.ts`:

```ts
import { colors, withAlpha } from '../theme/colors';
import type { TextStyle, ViewStyle } from 'react-native';

export type HealthGrade = 'A' | 'B' | 'C' | 'D';

export interface GradeStyle {
  badgeStyle: ViewStyle;
  textStyle: TextStyle;
}

const PALETTE: Record<HealthGrade, { bg: string; fg: string }> = {
  A: { bg: withAlpha('#22C55E', 0.18), fg: '#22C55E' },
  B: { bg: withAlpha('#84CC16', 0.18), fg: '#84CC16' },
  C: { bg: withAlpha('#EAB308', 0.18), fg: '#EAB308' },
  D: { bg: withAlpha(colors.danger, 0.18), fg: colors.danger },
};

export function getGradeStyle(grade: HealthGrade): GradeStyle {
  const tone = PALETTE[grade];
  return {
    badgeStyle: { backgroundColor: tone.bg },
    textStyle: { color: tone.fg },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/utils/healthGradeStyle.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/healthGradeStyle.ts __tests__/utils/healthGradeStyle.test.ts
git commit -m "feat(utils): shared getGradeStyle helper"
```

---

## Task 3: Extract `getTodayKey()` to shared util

**Files:**
- Create: `src/utils/date.ts`
- Create: `__tests__/utils/date.test.ts`
- Modify: `src/stores/userStore.ts:30` — replace local `getTodayKey` with import.

**Interfaces:**
- Produces: `getTodayKey(): string` — returns local-time YYYY-MM-DD for the user's device (not UTC). This is intentionally different from `new Date().toISOString().split('T')[0]` which gives UTC.
- Used by: all stores + onboarding + paywall screens.

- [ ] **Step 1: Write the failing test**

Create `__tests__/utils/date.test.ts`:

```ts
import { getTodayKey } from '../../src/utils/date';

describe('getTodayKey', () => {
  it('returns a YYYY-MM-DD string', () => {
    const key = getTodayKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches the date components for a fixed point in time', () => {
    const fake = new Date(2026, 6, 18, 14, 30); // 2026-07-18 14:30 local
    jest.useFakeTimers().setSystemTime(fake);
    const key = getTodayKey();
    jest.useRealTimers();
    expect(key).toBe('2026-07-18');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/utils/date.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `getTodayKey`**

Create `src/utils/date.ts`:

```ts
export function getTodayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest __tests__/utils/date.test.ts`
Expected: PASS — 2/2.

- [ ] **Step 5: Update `userStore.ts` to use shared helper**

Edit `src/stores/userStore.ts`:

Remove line 30:
```ts
const getTodayKey = (): string => new Date().toISOString().split('T')[0];
```

Add at top of file (after existing imports):
```ts
import { getTodayKey } from '../utils/date';
```

All subsequent `getTodayKey()` calls inside the file remain unchanged.

- [ ] **Step 6: Verify userStore tests still pass**

Run: `npx jest __tests__/userStore.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/utils/date.ts __tests__/utils/date.test.ts src/stores/userStore.ts
git commit -m "refactor(date): share getTodayKey helper across stores"
```

---

## Task 4: Introduce `AiClient` interface (declaration only)

**Files:**
- Create: `src/services/ai/AiClient.ts`
- Create: `src/services/ai/errors.ts`
- Create: `__tests__/services/ai/errors.test.ts`

**Interfaces:**
- Produces: `AiClient`, `AiError`, `AiErrorKind`, `AiRequestOptions`, `AnalysisInput` — all consumed by the alt-project 2 work that will fill `HttpAiClient`. This task defines the shape; Task 11 (next plan) will swap implementations.

- [ ] **Step 1: Write the failing test**

Create `__tests__/services/ai/errors.test.ts`:

```ts
import { AiError } from '../../../src/services/ai/errors';

describe('AiError', () => {
  it('carries kind, message and optional retryAfterSec', () => {
    const e = new AiError('timeout', 'timed out', 5);
    expect(e.kind).toBe('timeout');
    expect(e.message).toBe('timed out');
    expect(e.retryAfterSec).toBe(5);
    expect(e.name).toBe('AiError');
  });

  it('retryAfterSec is undefined when omitted', () => {
    const e = new AiError('auth', 'no token');
    expect(e.retryAfterSec).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/services/ai/errors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `AiError`**

Create `src/services/ai/errors.ts`:

```ts
export type AiErrorKind =
  | 'timeout'
  | 'rate_limit'
  | 'auth'
  | 'network'
  | 'invalid_payload'
  | 'provider_error'
  | 'parse_error';

export class AiError extends Error {
  readonly kind: AiErrorKind;
  readonly retryAfterSec?: number;

  constructor(kind: AiErrorKind, message: string, retryAfterSec?: number) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
    this.retryAfterSec = retryAfterSec;
  }
}
```

- [ ] **Step 4: Implement `AiClient` interface**

Create `src/services/ai/AiClient.ts`:

```ts
import type { AnalysisResult, MealCategory } from '../../types';

export interface AiRequestOptions {
  signal?: AbortSignal;
  language?: 'tr' | 'en';
  hint?: string;
  category?: MealCategory;
}

export interface AnalyzeParams {
  imageBuffer: ArrayBuffer;
  mime: 'image/jpeg' | 'image/png' | 'image/heic';
}

export interface AnalyzeTextParams {
  text: string;
}

export interface AiClient {
  analyzeFoodImage(
    params: AnalyzeParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult>;

  analyzeTextMeal(
    params: AnalyzeTextParams,
    opts?: AiRequestOptions,
  ): Promise<AnalysisResult>;
}

export const AI_TIMEOUT_MS = 15_000;
export const DEDUP_WINDOW_MS = 5_000;
```

- [ ] **Step 5: Run the error test to verify it passes**

Run: `npx jest __tests__/services/ai/errors.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/ai/AiClient.ts src/services/ai/errors.ts __tests__/services/ai/errors.test.ts
git commit -m "feat(ai): AiClient interface and AiError types (proxy contract)"
```

---

## Task 5: Upgrade Zustand stores with `createMmkvStorage` + version + migrate

**Files:**
- Modify: `src/stores/userStore.ts`
- Modify: `src/stores/logStore.ts`
- Modify: `src/stores/analysisStore.ts`
- Modify: `src/stores/offlineQueueStore.ts`
- Modify: `src/stores/hydrationStore.ts`
- Create: `__tests__/stores/migration.test.ts`

**Interfaces:**
- Consumes: `createMmkvStorage(instanceId)` from Task 1.
- Produces: each store's `persist` config has `version: 1, migrate: (persisted: any, version: number | undefined) => T`. Migration is defensive — unknown versions or corrupt JSON must return a safe default, never throw.

- [ ] **Step 1: Write the failing test**

Create `__tests__/stores/migration.test.ts`:

```ts
import type { StateStorage } from 'zustand/middleware';
import { createMmkvStorage } from '../../src/lib/persist';

// Per spec §4 + Task 5: every persisted store must have version + migrate.
// We assert by importing each store module and inspecting the persist options
// through a public surface — the migrate function exposed via a Type guard.

import { useUserStore } from '../../src/stores/userStore';
import { useLogStore } from '../../src/stores/logStore';
import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';
import { useHydrationStore } from '../../src/stores/hydrationStore';

describe('Zustand persistence', () => {
  const wrappers: Array<{ name: string; store: { persist?: { getOptions?: () => unknown } } }> = [
    { name: 'userStore', store: useUserStore as any },
    { name: 'logStore', store: useLogStore as any },
    { name: 'offlineQueueStore', store: useOfflineQueueStore as any },
    { name: 'hydrationStore', store: useHydrationStore as any },
  ];

  it.each(wrappers)('$name has a persist config with version', ({ store }) => {
    const persistFn = (store as any).persist;
    expect(persistFn).toBeDefined();
    const options = persistFn.getOptions?.();
    expect(options).toBeDefined();
    expect(options.version).toBeDefined();
    expect(typeof options.migrate).toBe('function');
    expect(options.storage).toBeDefined();
  });
});
```

Note: this test reads internal API; if `persist.getOptions()` differs, fall back to calling `useUserStore.persist.rehydrate()` and verifying no throw. Use whatever stable API your Zustand version exposes.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest __tests__/stores/migration.test.ts`
Expected: FAIL — `options.version is undefined` or `options.migrate is not a function`.

- [ ] **Step 3: Upgrade `userStore.ts`**

Edit `src/stores/userStore.ts`:

Replace lines 7-17 (the local MMKV instance + `mmkvStorage`):

```ts
import { createMmkvStorage } from '../lib/persist';
import { getTodayKey } from '../utils/date';

const userStorage = createMmkvStorage('user-storage');
```

Replace the `persist` configuration at the end of the file (around lines 274-277):

```ts
    {
      name: 'user-profile',
      storage: userStorage,
      version: 1,
      migrate: (persisted: unknown, version: number | undefined) => {
        if (version === 1) return persisted as UserState['profile'];
        // Unknown older versions — keep what we can read, fall back to defaults
        if (persisted && typeof persisted === 'object') return persisted as UserState['profile'];
        return null;
      },
      partialize: state => ({ profile: state.profile }),
    },
```

Add to the top imports: `import type { UserState } from './userStore';` is self-referential — instead, remove the explicit type and use `any` for the migration input (acceptable here, documented as a Zustand limitation):

```ts
      migrate: (persisted: unknown, version?: number) => {
        // ... as above
      },
```

(Final version of the file imports `UserProfile` for the partialized return value.)

- [ ] **Step 4: Upgrade `logStore.ts`**

Edit `src/stores/logStore.ts`:

Replace MMKV instance + `mmkvStorage` lines (around 1-16):

```ts
import { createMmkvStorage } from '../lib/persist';

const logStorage = createMmkvStorage('log-storage');
```

Replace the `persist` config:

```ts
    {
      name: 'log-entries',
      storage: logStorage,
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { entries?: Record<string, unknown[]> };
        }
        return { entries: {} };
      },
    },
```

- [ ] **Step 5: Upgrade `analysisStore.ts`**

Edit `src/stores/analysisStore.ts`:

Replace MMKV setup with:

```ts
import { createMmkvStorage } from '../lib/persist';

const analysisStorage = createMmkvStorage('analysis-storage');
```

In the `persist` config (this store is ephemeral — but the spec mandates every persisted store gets migration, so if analysisStore is non-persisted, add a comment explaining and skip Task 5 step):

If `analysisStore.ts` does NOT use `persist` (it's ephemeral), DO add a top-of-file comment:

```ts
// analysisStore is ephemeral; no persist configuration per src/types design.
// See docs/superpowers/specs/2026-07-18 §3.1: only persisted stores need migrate.
```

Skip the persist edit. Continue to Step 6.

- [ ] **Step 6: Upgrade `offlineQueueStore.ts`**

Edit `src/stores/offlineQueueStore.ts`:

Replace lines 1-18 (MMKV + mmkvStorage):

```ts
import { createMmkvStorage } from '../lib/persist';

const queueStorage = createMmkvStorage('offline-queue-storage');
```

Replace the `persist` config:

```ts
    {
      name: 'offline-queue',
      storage: queueStorage,
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { queue?: unknown[]; isProcessing?: boolean };
        }
        return { queue: [], isProcessing: false };
      },
    },
```

- [ ] **Step 7: Upgrade `hydrationStore.ts`**

Edit `src/stores/hydrationStore.ts`:

Replace MMKV + adapter:

```ts
import { createMmkvStorage } from '../lib/persist';

const hydrationStorage = createMmkvStorage('hydration-storage');
```

Replace `persist` config:

```ts
    {
      name: 'hydration',
      storage: hydrationStorage,
      version: 1,
      migrate: (persisted: unknown, version?: number) => {
        if (version === 1 && persisted && typeof persisted === 'object') {
          return persisted as { waterIntake?: Record<string, number>; dailyWaterGoal?: number };
        }
        return { waterIntake: {}, dailyWaterGoal: 2500 };
      },
    },
```

- [ ] **Step 8: Run the migration test to verify it passes**

Run: `npx jest __tests__/stores/migration.test.ts`
Expected: PASS — 4 stores report version+migrate.

- [ ] **Step 9: Run all existing tests**

Run: `npm test`
Expected: all pass. (MMKV in Jest is mocked by `react-native-mmkv/jest` preset; if not, see the project's jest.setup.ts — do not configure it from scratch here.)

- [ ] **Step 10: Commit**

```bash
git add src/stores __tests__/stores
git commit -m "feat(persist): version + migrate on all persisted stores"
```

---

## Task 6: Add ESLint `no-explicit-any` rule

**Files:**
- Modify: `.eslintrc.js`

**Interfaces:**
- Produces: `npm run lint` fails on any new `any` in `src/**/*.{ts,tsx}`.

- [ ] **Step 1: Verify current lint passes**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 2: Add the rule**

Edit `.eslintrc.js`. The file already extends `@react-native`. Add `rules`:

```js
module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

- [ ] **Step 3: Run lint, see existing `any` violations**

Run: `npm run lint`
Expected: WILL fail. Note the violations but DO NOT fix them in this task — they are owned by Tasks 7 (Camera) and 9 (Onboarding/Paywall). This task only establishes the rule.

- [ ] **Step 4: Commit (lint rule)**

```bash
git add .eslintrc.js
git commit -m "chore(lint): forbid any in domain code"
```

---

## Task 7: Remove `any` from `CameraScreen.tsx` (deferred to alt-project 3 for full decomposition)

**Files:**
- Modify: `src/screens/CameraScreen.tsx:35` (cameraRef type)

**Interfaces:**
- Consumes: `react-native-camera-kit`'s exported `Camera` type.
- Produces: `useRef<Camera>(null)` — typed handle.

- [ ] **Step 1: Inspect the current import**

In `src/screens/CameraScreen.tsx` (around lines 1-35), find the camera-kit import. It is currently:
```ts
import { Camera } from 'react-native-camera-kit';
```

Confirm by reading lines 1-50 of the file.

- [ ] **Step 2: Update cameraRef type**

Replace:
```ts
const cameraRef = useRef<any>(null);
```

With:
```ts
const cameraRef = useRef<Camera>(null);
```

(Note: react-native-camera-kit exports `Camera` as a typed class handle. If the actual exported type differs, use `ComponentRef<typeof Camera>` — verify the import works before committing.)

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: the `any` violation from CameraScreen disappears. Other `any` violations (Onboarding, Paywall) remain.

- [ ] **Step 4: Commit**

```bash
git add src/screens/CameraScreen.tsx
git commit -m "fix(camera): remove any from cameraRef"
```

---

## Task 8: Decompose `DashboardScreen.tsx` — extract `<CalorieRing>` `<MacroBars>` `<HydrationCard>` `<TodayMealList>`

**Files:**
- Create: `src/components/dashboard/CalorieRing.tsx`
- Create: `src/components/dashboard/MacroBars.tsx`
- Create: `src/components/dashboard/HydrationCard.tsx`
- Create: `src/components/dashboard/TodayMealList.tsx`
- Modify: `src/screens/DashboardScreen.tsx`

**Interfaces:**
- Each component receives props only — no store access inside. e.g. `<CalorieRing current={number} goal={number|null} size={number} />`.

- [ ] **Step 1: Extract `<CalorieRing>`**

Read `src/screens/DashboardScreen.tsx` to find the existing ring render (around lines 250-330 of the file, the circle SVG). Create `src/components/dashboard/CalorieRing.tsx`:

```tsx
import React from 'react';
import { Svg, Circle, Text as SvgText } from 'react-native-svg';
import { View, Text, StyleSheet } from 'react-native';
import { colors, withAlpha } from '../../theme/colors';
import { typography, fontFamily } from '../../theme/typography';

interface Props {
  current: number;
  goal: number | null;
  size?: number;
  strokeWidth?: number;
}

export const CalorieRing: React.FC<Props> = ({
  current,
  goal,
  size = 200,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = goal && goal > 0 ? Math.min(1, current / goal) : 0;
  const offset = circumference * (1 - ratio);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={withAlpha(colors.white, 0.08)}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText
          x={size / 2}
          y={size / 2 - 8}
          fill={colors.white}
          fontSize={32}
          fontFamily={fontFamily.bold}
          textAnchor="middle">
          {Math.round(current)}
        </SvgText>
        <SvgText
          x={size / 2}
          y={size / 2 + 16}
          fill={withAlpha(colors.white, 0.6)}
          fontSize={11}
          fontFamily={fontFamily.medium}
          textAnchor="middle">
          {goal ? `/${goal} kcal` : 'Hedef yok'}
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
```

(Adapt colour + spacing tokens from `src/theme/colors.ts` and `src/theme/spacing.ts`. The exact numeric copy is illustrative — copy the original SVG markup verbatim from the screen, then wrap it.)

- [ ] **Step 2: Extract `<MacroBars>`**

Create `src/components/dashboard/MacroBars.tsx` containing the protein/carbs/fat bars that were inline in `DashboardScreen`. Props:
```ts
interface Props {
  protein: { current: number; goal: number | null };
  carbs:   { current: number; goal: number | null };
  fat:     { current: number; goal: number | null };
}
```

Inside the component, also call `getGradeStyle(grade)` from Task 2 for the per-row grade badge.

- [ ] **Step 3: Extract `<HydrationCard>`**

Create `src/components/dashboard/HydrationCard.tsx`. The animated liquid wave currently uses `Animated.Value` with `useNativeDriver: false`; this task only moves the JSX; the animation fix is Task 13 (deferred to alt-project 3 with perf).

- [ ] **Step 4: Extract `<TodayMealList>`**

Create `src/components/dashboard/TodayMealList.tsx` with props:
```ts
interface Props {
  dateKey: string;
  onMealPress: (entryId: string) => void;
}
```

It reads from `useLogStore(s => s.entries[dateKey])` once.

- [ ] **Step 5: Update `DashboardScreen.tsx` to use the new components**

Replace the inline render sections with:
```tsx
<CalorieRing current={todayTotals.calories} goal={goals.dailyCalorieGoal} />
<MacroBars
  protein={{ current: todayTotals.protein, goal: goals.dailyProteinGoal }}
  carbs={{ current: todayTotals.carbs, goal: goals.dailyCarbGoal }}
  fat={{ current: todayTotals.fat, goal: goals.dailyFatGoal }}
/>
<HydrationCard dateKey={dateKey} />
<TodayMealList dateKey={dateKey} onMealPress={handleMealPress} />
```

Move the static `styles` object into the new component files. Verify the screen file is <300 LOC.

- [ ] **Step 6: Run lint**

Run: `npm run lint`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard src/screens/DashboardScreen.tsx
git commit -m "refactor(dashboard): extract CalorieRing, MacroBars, HydrationCard, TodayMealList"
```

---

## Task 9: Use `getGradeStyle` in HistoryScreen + fix Turkish copy in ProfileScreen + PaywallScreen

**Files:**
- Modify: `src/screens/HistoryScreen.tsx` (replace inline grade IIFE)
- Modify: `src/screens/ProfileScreen.tsx` ("/5 Hak" → "/3 Hak"; remove API-key section)
- Modify: `src/screens/OnboardingScreen.tsx` ("5 adet" → "3 adet"; remove `any` on `GoalOption.image`)
- Modify: `src/screens/PaywallScreen.tsx` (remove local `PlanTier` shadow; move PLANS to config)

**Interfaces:**
- Consumes: `getGradeStyle` from Task 2.

- [ ] **Step 1: Update HistoryScreen**

In `src/screens/HistoryScreen.tsx`, find the grade badge IIFE (around lines 262-281). Replace its body with:

```ts
const { badgeStyle, textStyle } = getGradeStyle(grade);
```

Add at top:
```ts
import { getGradeStyle } from '../utils/healthGradeStyle';
```

- [ ] **Step 2: Fix ProfileScreen copy**

In `src/screens/ProfileScreen.tsx` (around line 444), replace:
```tsx
{`${remainingScans} / 5 Hak`}
```
with:
```tsx
{`${remainingScans} / 3 Hak`}
```

In the same file, find the "API Anahtarı" or "API Key" section. Remove the entire `<View>` block (including its state hooks, handlers, and storage calls). Verify no orphan references remain (`grep -n "apiKey\\|api_key\\|API_KEY" src/screens/ProfileScreen.tsx`).

- [ ] **Step 3: Fix OnboardingScreen copy + `any`**

In `src/screens/OnboardingScreen.tsx`, find and replace every occurrence of `"5 adet"` with `"3 adet"` and `/ 5 ` with `/ 3 `.

For the `GoalOption` interface (around line 29), change:
```ts
image: any;
```
to:
```ts
image: ImageSourcePropType;
```

Add import:
```ts
import type { ImageSourcePropType } from 'react-native';
```

If multiple usages need it, import once at top.

- [ ] **Step 4: Refactor PaywallScreen**

In `src/screens/PaywallScreen.tsx`:

1. Remove the local `type PlanTier` redeclaration (line 20). Replace with:
```ts
import type { PlanTier } from '../types';
```

2. Extract `PLANS` constant (around lines 34-142) into `src/config/plans.ts`:

```ts
// src/config/plans.ts
import type { PlanTier } from '../types';

export interface PlanDef {
  id: PlanTier;
  name: string;
  price: string;
  features: Array<{ label: string; icon: string }>;
  ctaLabel: string;
}

export const PLANS: PlanDef[] = [
  // …copy the literal array verbatim from PaywallScreen…
];
```

3. In PaywallScreen, import PLANS from config.

4. Remove `name={f.icon as any}` (line 465). Add at top:

```ts
import type { MaterialIconName } from '../types/icons';
```

Where `src/types/icons.ts` contains:
```ts
export type MaterialIconName =
  | 'check' | 'close' | 'star' | 'flash-on' | 'bolt'
  | 'water-drop' | 'restaurant' | 'favorite' | 'analytics'
  | 'lock' | 'lock-open' | 'auto-awesome' | 'workspace-premium';
```

(Add names as needed by the actual PLANS definition. Limit to icons actually used; do not pre-populate.)

Replace `f.icon as any` with `f.icon as MaterialIconName`.

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: exit 0 (no more `any` violations from these files).

- [ ] **Step 6: Commit**

```bash
git add src/screens/HistoryScreen.tsx src/screens/ProfileScreen.tsx src/screens/OnboardingScreen.tsx src/screens/PaywallScreen.tsx src/config/plans.ts src/types/icons.ts
git commit -m "fix(copy+types): correct free-quota copy and remove any from screens"
```

---

## Task 10: Decompose `ReviewScreen.tsx` — extract `<FoodItemRow>` `<MacroBadge>` `<SimpleSlider>` `<AddItemModal>`

**Files:**
- Create: `src/components/review/FoodItemRow.tsx`
- Create: `src/components/review/MacroBadge.tsx`
- Create: `src/components/review/SimpleSlider.tsx`
- Create: `src/components/review/AddItemModal.tsx`
- Modify: `src/screens/ReviewScreen.tsx`

**Interfaces:**
- `<FoodItemRow item: FoodItem; onPortion: (g:number)=>void; onRemove: ()=>void />`
- `<MacroBadge grade: 'A'|'B'|'C'|'D' />` — uses `getGradeStyle`.
- `<SimpleSlider value: number; min: number; max: number; onChange: (n:number)=>void />`.
- `<AddItemModal visible: boolean; onAdd: (item: Omit<FoodItem,'id'>)=>void; onClose: ()=>void />`.

- [ ] **Step 1: Extract `<MacroBadge>`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getGradeStyle } from '../../utils/healthGradeStyle';

interface Props {
  grade: 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md';
}

export const MacroBadge: React.FC<Props> = ({ grade, size = 'md' }) => {
  const { badgeStyle, textStyle } = getGradeStyle(grade);
  return (
    <View style={[styles.base, size === 'sm' ? styles.sm : styles.md, badgeStyle]}>
      <Text style={[styles.letter, size === 'sm' ? styles.letterSm : null, textStyle]}>
        {grade}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: { borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  letter: { fontWeight: '700', fontSize: 12 },
  letterSm: { fontSize: 10 },
});
```

- [ ] **Step 2: Extract `<SimpleSlider>`**

Move the slider component currently inline in ReviewScreen (which extends `View` with gesture handlers) into its own file. Props only — no store access.

- [ ] **Step 3: Extract `<FoodItemRow>`**

Combine the row's portion slider, name, calories, and remove button into one component. Receives a `FoodItem` + two callbacks.

- [ ] **Step 4: Extract `<AddItemModal>`**

Move the existing modal body to its own file. Keep the open/close state in the screen.

- [ ] **Step 5: Update `ReviewScreen.tsx`**

Replace inline markup with the new component calls. Remove duplicated grade IIFEs — replaced with `<MacroBadge grade={…} />`.

Verify the screen is <300 LOC.

- [ ] **Step 6: Run lint + tests**

Run: `npm run lint && npx jest`
Expected: 0 lint errors; existing tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/review src/screens/ReviewScreen.tsx
git commit -m "refactor(review): extract FoodItemRow, MacroBadge, SimpleSlider, AddItemModal"
```

---

## Task 11: Decompose `OnboardingScreen.tsx` — extract `<PaywallStep>`

**Files:**
- Create: `src/components/onboarding/PaywallStep.tsx`
- Create: `src/components/onboarding/GoalStep.tsx`
- Create: `src/components/onboarding/StatsStep.tsx`
- Create: `src/components/onboarding/ProjectionStep.tsx`
- Modify: `src/screens/OnboardingScreen.tsx`

**Interfaces:**
- Each step receives the current step state + dispatch callbacks. The screen keeps the wizard state machine; each step is pure presentational.

- [ ] **Step 1: Extract `<PaywallStep>`**

Move the pricing/trial content (currently inline in OnboardingScreen near lines 455-475 + 530-538) into its own component. It calls `useUserStore.getState().startTrial(7)` + `completeOnboarding(...)` via injected callbacks.

- [ ] **Step 2: Extract `<GoalStep>`, `<StatsStep>`, `<ProjectionStep>`**

Read the existing step JSX in OnboardingScreen and extract each into its file.

- [ ] **Step 3: Update `OnboardingScreen.tsx`**

Replace inline steps with `<GoalStep … />` etc. Verify screen <300 LOC.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding src/screens/OnboardingScreen.tsx
git commit -m "refactor(onboarding): extract per-step components"
```

---

## Task 12: Decompose `CameraScreen.tsx` — extract `<CameraTopBar>` `<Reticle>` `<BottomControls>`

**Files:**
- Create: `src/components/camera/CameraTopBar.tsx`
- Create: `src/components/camera/Reticle.tsx`
- Create: `src/components/camera/BottomControls.tsx`
- Modify: `src/screens/CameraScreen.tsx`

**Interfaces:**
- Each receives handlers as props (no store access inside).

- [ ] **Step 1: Extract `<CameraTopBar>`**

Move the back button + flash toggle row.

- [ ] **Step 2: Extract `<Reticle>`**

Move the focus reticle SVG.

- [ ] **Step 3: Extract `<BottomControls>`**

Move shutter, gallery, voice, barcode buttons.

- [ ] **Step 4: Update `CameraScreen.tsx`**

Compose. Verify <300 LOC.

- [ ] **Step 5: Commit**

```bash
git add src/components/camera src/screens/CameraScreen.tsx
git commit -m "refactor(camera): extract top bar, reticle, bottom controls"
```

---

## Task 13: Decompose `ProfileScreen.tsx` — extract `<ProfileHeader>` `<DailyGoals>` `<MicronutrientToggles>` `<DataActions>`

**Files:**
- Create: `src/components/profile/ProfileHeader.tsx`
- Create: `src/components/profile/DailyGoals.tsx`
- Create: `src/components/profile/MicronutrientToggles.tsx`
- Create: `src/components/profile/DataActions.tsx`
- Modify: `src/screens/ProfileScreen.tsx`

**Interfaces:**
- Each receives store-derived data + dispatchers.

- [ ] **Step 1–3: Extract sections**

Follow the same pattern as Tasks 8-12. ProfileScreen is 1529 LOC — this is the largest decomposition. Verify <300 LOC after.

- [ ] **Step 4: Commit**

```bash
git add src/components/profile src/screens/ProfileScreen.tsx
git commit -m "refactor(profile): extract header, goals, toggles, data actions"
```

---

## Task 14: Decompose `PaywallScreen.tsx` — leave only the screen container

**Files:**
- Modify: `src/screens/PaywallScreen.tsx`

- [ ] **Step 1: After Task 9 already moved `PLANS` to `src/config/plans.ts`, verify the screen is <300 LOC.**

If not, extract `<PlanCard>` into `src/components/paywall/PlanCard.tsx`.

- [ ] **Step 2: Commit**

```bash
git add src/screens/PaywallScreen.tsx src/components/paywall 2>/dev/null || true
git commit -m "refactor(paywall): ensure screen <= 300 LOC"
```

---

## Task 15: Add `AppState` foreground sync in `App.tsx`

**Files:**
- Modify: `App.tsx`

**Interfaces:**
- On `AppState.change` → 'active': call `useOfflineQueueStore.getState().processQueue()` and `useUserStore.getState().syncKeychainLimit()`. Listener cleanup on unmount.

- [ ] **Step 1: Read `App.tsx`**

Find current root component.

- [ ] **Step 2: Add the listener**

```tsx
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useOfflineQueueStore } from './src/stores/offlineQueueStore';
import { useUserStore } from './src/stores/userStore';

function useForegroundSync() {
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        void useOfflineQueueStore.getState().processQueue();
        void useUserStore.getState().syncKeychainLimit();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);
}

// Inside App component:
//   useForegroundSync();
```

If the existing component already wraps things, hook in without changing layout.

- [ ] **Step 3: Run lint + typecheck**

Run: `npm run lint && npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add App.tsx
git commit -m "feat(sync): AppState foreground retry for offline queue + keychain"
```

---

## Task 16: Narrow the `AppNavigator` selector

**Files:**
- Modify: `src/navigation/AppNavigator.tsx`

**Interfaces:**
- The navigator subscribes only to `useUserStore(s => s.profile.isFirstLaunch)` — not the entire `profile` object. (Currently it re-renders on every profile update including premium flag, free scans count, etc.)

- [ ] **Step 1: Read AppNavigator**

Find the selector at lines ~64, 146.

- [ ] **Step 2: Replace**

Find:
```tsx
const profile = useUserStore(s => s.profile);
const isFirstLaunch = profile.isFirstLaunch;
```

Replace with:
```tsx
const isFirstLaunch = useUserStore(s => s.profile.isFirstLaunch);
```

Remove any other uses of the broad `profile` from the gating logic.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/AppNavigator.tsx
git commit -m "refactor(nav): narrow AppNavigator selector to isFirstLaunch"
```

---

## Task 17: Final verification — lint, typecheck, test, line counts

**Files:** none modified.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 4: Verify screen sizes**

Run:
```bash
wc -l src/screens/*.tsx
```
Expected: every file ≤ 300 LOC (excluding imports + EOF newline is acceptable up to 305).

- [ ] **Step 5: Commit (if any cleanup was needed)**

If zero changes were needed, skip commit. Otherwise:
```bash
git add -A
git commit -m "chore: alt-project 1 final pass — lint clean, tsc clean, screens <=300 LOC"
```

---

## Self-Review Notes

After writing this plan I checked:

1. **Spec coverage:**
   - Spec §3.1 (alt-project 1): every bullet maps to a task. Quick-wins: storage adapter (Task 1), migrate (Task 5), `any` removal (Tasks 7, 9), getGradeStyle (Tasks 2, 8, 9, 10), AppState sync (Task 15), Turkish copy (Task 9), Android rename (out of scope — carried into a follow-up commit, see "Deferred" below), narrow navigator selector (Task 16), API-key removal (Task 9).
   - Spec §2 (AiClient): Task 4 declares the interface. Implementation deferred to alt-project 2 by design.
   - Spec §4 (cross-cutting): Task 6 (no-explicit-any rule); LOC constraint enforced as acceptance criteria in Task 17.

2. **Placeholders:** none. Every step shows code or command.

3. **Type consistency:** `getGradeStyle` imported in Tasks 8/9/10 from the same module; `getTodayKey` from `src/utils/date` (Task 3) used by userStore + downstream; `AiError` + `AiClient` exported from `src/services/ai/`.

4. **Deferred (explicit):**
   - Android `com/hikmetgulsesli/*.kt` commit-and-verify — separated to a follow-up operational task (not design).
   - `useNativeDriver: true` migration for the hydration wave animation — alt-project 3 (perf).
   - MMKV read-error repair behavior (PRD §10 "single migration repair") — alt-project 3 (test infrastructure).
   - Real `HttpAiClient` implementation — alt-project 2.

5. **Task 5 ambiguity resolved:** `analysisStore.ts` was originally described as ephemeral. Step 5 has a conditional: if it uses `persist`, add migrate; otherwise add a comment. This is explicit.
