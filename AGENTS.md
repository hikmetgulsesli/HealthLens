# HealthLens — Agent Guide

> This file is intended for AI coding agents. It describes the project architecture, conventions, and workflows so that agents can make accurate, safe changes without prior context.

---

## 1. Project Overview

**HealthLens** is a React Native mobile application (iOS primary, Android capable) that lets users photograph food and receive AI-powered nutritional analysis. Users can review detected items, adjust portions, categorize meals, save entries to a daily log, track progress against personal nutrition goals, and browse historical data.

The app is bootstrapped with `@react-native-community/cli` (not Expo). The UI is implemented in TypeScript with a dark, clinical design system. All interface strings are currently in **Turkish** (`tr`) per the product requirements, even though the source code uses English identifiers.

- **Package name**: `com.hikmetgulsesli.healthlens`
- **Display name**: HealthLens
- **Minimum Node version**: `>= 22.11.0`
- **React Native version**: `0.85.3`
- **React version**: `19.2.3`
- **New Architecture (Fabric)**: Enabled (`RCTNewArchEnabled` is `true` in iOS `Info.plist`)

---

## 2. Technology Stack

| Layer                | Technology                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- |
| Framework            | React Native 0.85 + TypeScript                                                         |
| Navigation           | React Navigation v7 (`@react-navigation/native`, `native-stack`, `bottom-tabs`)        |
| State Management     | Zustand (`zustand`) with `persist` middleware                                          |
| Server/Cache State   | TanStack Query (`@tanstack/react-query`) — installed, ready for AI service integration |
| Local Storage        | `react-native-mmkv` (used as Zustand persistence backend)                              |
| Camera               | `react-native-camera-kit`                                                              |
| Permissions          | `react-native-permissions`                                                             |
| Charts               | `react-native-gifted-charts` (installed, currently using custom SVG bars)              |
| Vector Icons         | `react-native-vector-icons` (MaterialIcons)                                            |
| SVG                  | `react-native-svg`                                                                     |
| Safe Area            | `react-native-safe-area-context`                                                       |
| Build Tool (JS)      | Metro (via `@react-native/metro-config`)                                               |
| Build Tool (iOS)     | Xcode + CocoaPods (Ruby `Gemfile` + `bundle install`)                                  |
| Build Tool (Android) | Gradle + Kotlin                                                                        |
| Linting              | ESLint (`@react-native/eslint-config`)                                                 |
| Formatting           | Prettier 2.8.8                                                                         |
| Testing              | Jest (`@react-native/jest-preset`) + `react-test-renderer`                             |

---

## 3. Project Structure

```
HealthLens/
├── App.tsx                    # Root component: SafeAreaProvider + StatusBar + AppNavigator
├── index.js                   # Entry point: AppRegistry
├── app.json                   # App name config
├── package.json               # Dependencies & scripts
├── tsconfig.json              # Extends @react-native/typescript-config
├── babel.config.js            # @react-native/babel-preset
├── metro.config.js            # Default Metro config merge
├── jest.config.js             # @react-native/jest-preset
├── .eslintrc.js               # Extends @react-native
├── .prettierrc.js             # arrowParens: avoid, singleQuote: true, trailingComma: all
├── Gemfile / Gemfile.lock     # Ruby deps for CocoaPods
├── android/                   # Android project (Gradle)
├── ios/                       # iOS project (Xcode + Pods)
├── design/                    # Stitch design assets
│   └── stitch/
│       ├── DESIGN_MANIFEST.json
│       ├── assets/
│       ├── html/              # HTML design references per screen
│       └── screens/           # PNG mockups
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Root stack + bottom tab navigator definitions
│   ├── screens/
│   │   ├── CameraScreen.tsx   # Full-screen camera with capture + reticle
│   │   ├── ReviewScreen.tsx   # AI results review, portion sliders, save
│   │   ├── DashboardScreen.tsx# Daily calorie ring, macro bars, meal list
│   │   ├── HistoryScreen.tsx  # Calendar picker, daily summary, 7-day trend
│   │   └── ProfileScreen.tsx  # Goals, micronutrient toggles, export/delete
│   ├── stores/
│   │   ├── analysisStore.ts   # Ephemeral AI analysis state (Zustand)
│   │   ├── logStore.ts        # Persisted daily log entries (Zustand + MMKV)
│   │   └── userStore.ts       # Persisted user profile & goals (Zustand + MMKV)
│   ├── theme/
│   │   ├── colors.ts          # Complete color tokens (clinical dark + dashboard dark)
│   │   ├── typography.ts      # Font scale + font family names
│   │   ├── spacing.ts         # Spacing tokens
│   │   └── radii.ts           # Border radius tokens
│   ├── types/
│   │   └── index.ts           # Domain TypeScript interfaces
│   ├── utils/
│   │   └── constants.ts       # App constants (min/max values, schema version)
│   └── declarations.d.ts      # Type declaration for react-native-vector-icons
└── __tests__/
    └── App.test.tsx           # Basic render smoke test
```

---

## 4. Build and Run Commands

All commands run from the project root.

```bash
# Install JS dependencies
npm install

# iOS: install CocoaPods (first time or after native dep changes)
bundle install
bundle exec pod install --project-directory=ios

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx jest --testPathPattern="CameraScreen"

# Run tests in watch mode
npx jest --watch
```

> **Note**: The `ios/Pods` directory is gitignored. Fresh clones must run `bundle install && bundle exec pod install` before building for iOS.

---

## 5. Code Style Guidelines

- **Language**: TypeScript. Strict mode is enabled via `@react-native/typescript-config`.
- **Quotes**: Single quotes (`'`) — enforced by Prettier.
- **Trailing commas**: Always (`all`) — enforced by Prettier.
- **Arrow function parens**: Avoid when possible — enforced by Prettier.
- **Semicolons**: Implicit (not required by the preset, but code currently uses them).
- **Imports**: Use named exports for screens and stores. React is imported explicitly (`import React from 'react'`).
- **Styles**: All components use `StyleSheet.create()` defined in the same file. No external CSS-in-JS libraries.
- **Theme access**: Import tokens directly from `src/theme/*`:
  ```ts
  import { colors, withAlpha } from '../theme/colors';
  import { spacing } from '../theme/spacing';
  import { radii } from '../theme/radii';
  import { typography, fontFamily } from '../theme/typography';
  ```
- **Colors**: The app uses two distinct dark palettes:
  - **Clinical dark** (`colors.*`) — Camera, History, Profile, Review screens.
  - **Dashboard dark** (`colors.dashboard*`) — Dashboard screen only.
- **Typography tokens**: Prefer `typography['headlineMd']` spread syntax over inline font sizes when possible.
- **No `any` in domain logic**: The PRD mandates no `any` types in business logic. The current codebase has one `any` in `mmkvStorage` wrappers inside stores; avoid adding more.

---

## 6. Navigation Architecture

- **Root Stack** (`RootStackParamList`):
  - `MainTabs` — the bottom tab navigator
  - `Review` — modal screen for AI review (slides from bottom)
- **Bottom Tabs** (`MainTabParamList`):
  - `CameraTab` → CameraScreen
  - `Dashboard` → DashboardScreen
  - `History` → HistoryScreen
  - `Profile` → ProfileScreen

The Camera tab is the default landing surface. From the Dashboard, tapping the FAB navigates to `CameraTab`. The Review screen is pushed modally from the Camera screen after capture.

---

## 7. State Management Conventions

### Zustand Stores

1. **`analysisStore`** (ephemeral, not persisted)

   - Holds `currentAnalysis` and `isAnalyzing`.
   - Provides item-level mutations: `updateItemPortion`, `removeItem`, `addItem`, `setMealCategory`.
   - Cleared after save (`setAnalysis(null)`).

2. **`logStore`** (persisted to MMKV)

   - Stores `entries: Record<string, LogEntry[]>` keyed by `dateKey` (`YYYY-MM-DD`).
   - Actions: `addEntry`, `updateEntry`, `deleteEntry`, `getEntriesForDate`.

3. **`userStore`** (persisted to MMKV)
   - Stores `profile: UserProfile` with nested `goals`.
   - Actions: `setGoals`, `setUnitSystem`.
   - Default profile created on first launch with all goals `null`.

### MMKV Storage

Each store uses a separate MMKV instance (`id: 'log-storage'`, `id: 'user-storage'`). The custom `mmkvStorage` adapter wraps MMKV to satisfy Zustand's `persist` middleware interface.

---

## 8. Testing Strategy

- **Unit/Component tests**: Jest + `react-test-renderer`.
- **Current test**: Only a basic App render smoke test exists in `__tests__/App.test.tsx`.
- **E2E**: No E2E tests are implemented yet. The PRD specifies Maestro or Detox for flows like camera permission → capture → mock AI → save → verify dashboard.
- **testID props**: Several screens already expose `testID` attributes for E2E selectors (e.g. `cameraPreview`, `cameraCaptureButton`, `saveLogButton`). Continue adding `testID` to all primary interactive elements.
- **Snapshot policy**: Snapshots are allowed only for static design-system components (buttons, cards, inputs). Business screens are excluded.

---

## 9. Key Domain Types

Defined in `src/types/index.ts`:

- `MealCategory` — `'breakfast' | 'lunch' | 'dinner' | 'snack'`
- `FoodItem` — detected food with macros per 100g, confidence, portion grams
- `LogEntry` — saved meal with date key, items, computed totals
- `UserProfile` — goals, unit system, timestamps
- `NutritionGoals` — calorie/protein/carb/fat targets + micronutrient visibility flags
- `AnalysisResult` — ephemeral result from AI pipeline
- `OfflineQueueItem` — defined but not yet implemented in stores

---

## 10. Security & Privacy Considerations

- **Camera / Photo Library permissions**: Declared in `ios/HealthLens/Info.plist` with Turkish descriptions.
- **Network security**: `NSAllowsArbitraryLoads` is `false`; `NSAllowsLocalNetworking` is `true` for Metro.
- **Data storage**: All logs and profile data are stored locally in MMKV (app sandbox). No backend sync is implemented yet.
- **Export**: The Profile screen has a JSON export button (`handleExport`) that currently shows data in an Alert (not a real file share yet).
- **Deletion**: `handleDeleteAll` shows a native confirmation Alert before clearing all history. No soft-delete or undo buffer exists.

---

## 11. Known Gaps & TODOs (from code inspection)

- **AI integration**: The analysis pipeline is mocked. `CameraScreen.handleCapture` uses `setTimeout` with hardcoded mock data. The real AI service client needs to be wired in.
- **Offline queue**: `OfflineQueueItem` type exists but no store or logic implements it yet.
- **Gallery import**: The gallery shortcut button in `CameraScreen` is present but not wired to a picker.
- **Barcode fallback**: Not implemented.
- **Add manual item**: The "Add Item" button in `ReviewScreen` is present but not wired.
- **Edit saved entry**: Not implemented; tapping a meal in Dashboard/History does not open review.
- **Image persistence**: Captured images use `mock://captured-image` URI; real file handling is needed.
- **Turkish UI strings**: The PRD specifies Turkish labels, but most on-screen text is currently in English.
- **Custom fonts**: `HankenGrotesk` and `Inter` are referenced in `typography.ts` but not yet linked in native projects.

---

## 12. Design System

The design tokens in `src/theme/*` were generated from Stitch HTML exports. Files contain comments like:

```ts
// Generated from Stitch HTML files — DO NOT EDIT MANUALLY
```

If you need to update colors, typography, spacing, or radii, modify the source-of-truth in `design/stitch/` and regenerate, or update the theme files and remove the comment to indicate manual override.

---

## 13. Platform Notes

- **iOS**: Primary target. New Architecture (Fabric) is enabled. Portrait-only on iPhone; all orientations on iPad.
- **Android**: Supported but secondary. `android:usesCleartextTraffic` uses a Gradle variable (`${usesCleartextTraffic}`).
- **Hermes**: Enabled by default (React Native 0.85).

---

## 14. Useful References

- `PRD.md` — Full product requirements document (Turkish UI, data contracts, behavioral contracts, quality requirements).
- `design/stitch/DESIGN_MANIFEST.json` — Screen inventory with PNG and HTML references.
- `README.md` — Standard React Native getting-started guide.
