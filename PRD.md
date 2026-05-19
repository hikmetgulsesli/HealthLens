STATUS: done

PROJECT_NAME: HealthLens
PROJECT_SLUG: healthlens

TECH_STACK: react-native
PLATFORM: mobile
UI_LANGUAGE: tr
DB_REQUIRED: yes

RUN_SLUG: healthlens-ios-001
REPO: HealthLens
GITHUB_REPO: hikmetgulsesli/HealthLens
BRANCH: main
APP_TITLE: HealthLens
PACKAGE_NAME: com.hikmetgulsesli.healthlens

---

# PRD

## 1. Overview

HealthLens is an iOS mobile application that enables users to capture or upload food photos and receive instant AI-powered nutritional analysis. The app identifies food items, estimates portion sizes, and calculates calories, macronutrients (protein, carbohydrates, fat), and selected micronutrients. Users can save results to a daily nutrition log, track intake against personal goals, and review historical eating patterns through a unified dashboard.

The core value proposition is frictionless food logging: instead of manually searching a database, a single photo initiates recognition, estimation, and record creation within seconds.

## 2. Target Users

- Health-conscious individuals who want to track daily nutrition without manual data entry.
- Fitness enthusiasts monitoring calorie and macronutrient targets.
- People with dietary restrictions (e.g., diabetes, hypertension) who need quick awareness of meal composition.
- Casual users curious about the nutritional content of restaurant or home-cooked meals.

## 3. Goals

- Eliminate manual search-and-select friction from food logging.
- Provide accurate nutritional estimates from a single photograph.
- Encourage consistent tracking through a sub-10-second capture-to-save flow.
- Deliver actionable, time-based insights on eating habits and goal adherence.
- Maintain offline resilience by queuing analysis requests and syncing when connectivity returns.

## 4. Primary Workflows

### A. Quick Analysis
1. User opens the app and lands on the Camera surface.
2. User frames the food and taps the shutter or volume button.
3. App presents a preview with an AI-generated food list, estimated portions, and nutrition totals.
4. User reviews, edits items if needed, selects a meal category (breakfast, lunch, dinner, snack), and saves.
5. The entry is persisted to the daily log and the dashboard updates.

### B. Gallery Import
1. User opens the app and switches from Camera to Photo Library.
2. User selects one image from the iOS photo library.
3. App runs the same AI analysis pipeline as Quick Analysis.
4. User reviews, edits, categorizes, and saves.

### C. Daily Tracking
1. User navigates to the Dashboard surface.
2. The dashboard shows today’s calorie and macro summary rings, a chronological meal list, and remaining goal allowances.
3. User taps a meal entry to view detail, edit quantities, or delete.
4. Changes immediately reflect in the daily totals.

### D. Goal Setting
1. User navigates to Profile → Nutrition Goals.
2. User sets daily calorie target and protein/carbohydrate/fat gram targets.
3. User toggles micronutrient display (sodium, fiber, sugar) on or off.
4. Goals are persisted and all dashboard summaries recalculate against the new targets.

### E. History Review
1. User navigates to History and selects a past date via a calendar picker.
2. App loads the full meal log and totals for that date.
3. User can compare any historical day to current goals or scroll through a weekly trend summary.

## 5. Functional Requirements

- **Camera Capture**: Real-time camera preview with tap-to-focus, pinch-to-zoom, and flash toggle. Support both portrait and landscape orientations.
- **Photo Library Access**: Native iOS image picker with permission handling. Support HEIC, JPEG, and PNG inputs.
- **AI Food Recognition**: Identify single-item and multi-item dishes from a photo. Return a ranked list of detected foods with confidence scores.
- **Portion Estimation**: Estimate weight/volume per detected item using reference objects or standard serving heuristics. Provide a manual override slider.
- **Nutritional Calculation**: Map detected foods and portion estimates to a local nutritional database. Compute calories, protein, carbohydrates, fat, fiber, sugar, and sodium.
- **Daily Log Aggregation**: Group saved entries under meal categories (breakfast, lunch, dinner, snack) per calendar day.
- **Goal Management**: Allow numeric input for calorie and macro targets. Store per user profile.
- **Historical Browse**: Load any past date’s log from local storage. Show weekly trend charts (7-day rolling averages).
- **Offline Queue**: If analysis API is unreachable, queue the image and metadata locally. Retry in background when connectivity is restored.
- **Barcode Fallback**: Allow scanning a food barcode as an alternative input path when AI recognition is uncertain or unavailable.
- **Multi-Language UI**: All interface labels are in Turkish (`tr`). Nutritional data labels follow standard Turkish naming.

## 6. Product Surfaces

- **Surface: Camera Capture**
  - **Purpose**: Provide the fastest path from real-world food to digital analysis.
  - **Core content**: Live camera preview, capture button, flash toggle, gallery shortcut, focus reticle.
  - **User actions**: capture photo, toggle flash, pinch to zoom, switch to gallery import, navigate to dashboard.
  - **Design guidance**: The camera viewfinder should occupy the full screen. Controls should be thumb-reachable in portrait. Avoid cluttering the preview with text overlays.

- **Surface: AI Review**
  - **Purpose**: Let the user validate and refine AI results before saving.
  - **Core content**: Captured image thumbnail, detected food list with portion sliders, per-item nutrition rows, running total summary, meal category selector.
  - **User actions**: edit portion size, delete a detected item, add a missing item manually, change meal category, save to log, retake photo.
  - **Design guidance**: The image should remain visible as context. Nutrition numbers should update in real time as the user adjusts portions. Confident predictions (>80%) are visually distinct from uncertain ones.

- **Surface: Dashboard**
  - **Purpose**: Surface daily progress and recent activity at a glance.
  - **Core content**: Calorie ring progress, macro bar charts (protein, carbs, fat), today’s meal list with quick totals, remaining allowance labels, a prominent camera shortcut.
  - **User actions**: tap a meal to edit, tap camera to capture, swipe to yesterday/today, tap a macro bar for detail.
  - **Design guidance**: Use a card-based layout with clear hierarchy. Progress rings should animate on entry. Empty states encourage first capture.

- **Surface: History**
  - **Purpose**: Enable retrospective review and trend awareness.
  - **Core content**: Calendar date picker, selected date’s meal log, daily totals, weekly trend chart, average comparison to goals.
  - **User actions**: select a date, scroll through meal list, tap a meal for detail, share a daily summary image.
  - **Design guidance**: The calendar should show small indicators (dots) on days with entries. Charts should be simple bar or line graphs, not overloaded with series.

- **Surface: Profile and Goals**
  - **Purpose**: Manage personal targets and app settings.
  - **Core content**: Calorie target input, macro gram inputs, micronutrient toggle switches, unit preference (metric/imperial), data management (export/delete).
  - **User actions**: edit goals, toggle nutrients, export data as JSON/CSV, delete all history, review app info.
  - **Design guidance**: Use native iOS form styling (grouped table appearance). Input fields should show validation inline. Destructive actions require a confirmation modal.

## 7. Behavioral Contract

- **Capture-to-save latency**: From shutter tap to AI Review screen, the app must display a result or a graceful loading state within 3 seconds on a standard Wi-Fi connection. If the AI service exceeds 5 seconds, the app shows a "still analyzing" state with a cancel option.
- **Offline behavior**: If the user captures a photo while offline, the app stores the image locally, shows a pending badge on the Dashboard, and automatically retries when the app returns to foreground with connectivity.
- **Daily rollover**: The "today" log resets at 00:00 local device time. Entries saved before midnight belong to the previous day; entries saved after belong to the new day. No retroactive auto-reassignment occurs.
- **Goal recalculation**: When a user updates their calorie or macro goals, all visible dashboard summaries immediately recalculate remaining allowances. Historical days do not retroactively change their goal context; they show the goal that was active at the time of entry.
- **Deletion cascade**: Deleting a meal entry immediately removes it from the daily log and subtracts its nutrition from all running totals. There is no soft-delete or undo buffer; the action is final after confirmation.
- **Permission denial**: If camera or photo library permission is denied, the app shows an instructional empty state with a deep link to iOS Settings. It does not crash or repeatedly prompt.

## 8. Action Inventory

| Action | Visible Result | State Change | Persistence Result |
|--------|---------------|--------------|-------------------|
| Capture photo | AI Review screen opens with loading or results | `currentAnalysis` populated | Image saved to temporary cache |
| Select from gallery | Same as capture | Same as capture | Image copied to temporary cache |
| Adjust portion slider | Per-item and total nutrition numbers update live | `analysis.items[i].portion` updated | No persistence until save |
| Delete detected item | Item removed from list; totals recalculate | Item removed from `analysis.items` | No persistence until save |
| Add manual item | New row appears with default portion; totals update | Item appended to `analysis.items` | No persistence until save |
| Select meal category | Category label updates | `analysis.mealCategory` set | No persistence until save |
| Save to log | Dashboard updates with new entry; toast confirmation | Entry appended to `dailyLog[date]` | Entry persisted to local DB; if offline, queued for sync |
| Edit saved entry | AI Review opens pre-filled; save overwrites original | Original entry replaced in `dailyLog[date]` | Original entry updated in local DB |
| Delete saved entry | Entry removed from Dashboard/History lists | Entry removed from `dailyLog[date]` | Entry deleted from local DB |
| Update goals | Dashboard rings/bars recalculate | `userProfile.goals` updated | Goals persisted to local DB |
| Change date in History | Meal log and totals for selected date load | `selectedHistoryDate` updated | Read-only; no persistence change |
| Export data | Share sheet opens with JSON/CSV file | None | Read-only export from local DB |

## 9. Data Contract

### Entities

**UserProfile**
- `id`: string (uuid, primary key)
- `createdAt`: ISO string
- `updatedAt`: ISO string
- `dailyCalorieGoal`: number (optional, default null)
- `dailyProteinGoal`: number (optional, grams)
- `dailyCarbGoal`: number (optional, grams)
- `dailyFatGoal`: number (optional, grams)
- `showMicronutrients`: boolean (default false)
- `unitSystem`: enum ['metric', 'imperial'] (default 'metric')

**FoodItem (analysis result)**
- `id`: string (uuid)
- `name`: string (e.g., "Mercimek Çorbası")
- `confidence`: number (0–1)
- `estimatedPortionGrams`: number
- `caloriesPer100g`: number
- `proteinPer100g`: number
- `carbsPer100g`: number
- `fatPer100g`: number
- `fiberPer100g`: number (optional)
- `sugarPer100g`: number (optional)
- `sodiumPer100g`: number (optional)

**LogEntry**
- `id`: string (uuid, primary key)
- `createdAt`: ISO string
- `updatedAt`: ISO string
- `dateKey`: string (YYYY-MM-DD, indexed)
- `mealCategory`: enum ['breakfast', 'lunch', 'dinner', 'snack']
- `imageUri`: string (local file path, optional if manual entry)
- `items`: FoodItem[]
- `totalCalories`: number (computed and stored for query speed)
- `totalProtein`: number
- `totalCarbs`: number
- `totalFat`: number

**OfflineQueueItem**
- `id`: string (uuid)
- `createdAt`: ISO string
- `imageUri`: string
- `mealCategory`: string
- `status`: enum ['pending', 'uploading', 'failed']
- `retryCount`: number (default 0)

### Seed State
- A singleton `UserProfile` is created on first launch with all goal fields null and `showMicronutrients` false.
- The local database ships with a lightweight static food reference table containing ~200 common Turkish foods with base nutritional values per 100g. This table is read-only and used as a fallback when the AI service is unavailable.

## 10. Validation And Error Rules

- **Portion input**: Must be a positive number between 1 and 5000 grams. Values outside this range are clamped and the user is shown an inline warning.
- **Goal inputs**: Calorie goals must be between 500 and 10000. Macro goals must be between 0 and 500 grams each. Non-numeric input is rejected with a native iOS number pad.
- **Empty analysis save**: If the user deletes all detected items and does not add any manual items, the Save button is disabled. A helper text states: "En az bir besin ekleyin."
- **Image size limit**: Photos larger than 20 MB are compressed before analysis upload. If compression fails, an error toast appears: "Görsel boyutu çok büyük. Lütfen daha küçük bir fotoğraf seçin."
- **Network timeout**: If the AI service does not respond within 15 seconds, the request is marked failed. The user sees a retry button and the image is added to the offline queue.
- **Duplicate prevention**: Within a 5-second window, identical API requests (same image checksum) are deduplicated. The app returns the in-flight promise instead of issuing a new request.
- **Database corruption**: On startup, if the local database fails to open, the app attempts a single migration repair. If repair fails, the app shows a fatal error screen with instructions to reinstall; no silent data loss occurs.

## 11. State Persistence Rules

- **Local Database**: All `LogEntry`, `UserProfile`, and `OfflineQueueItem` records are stored in a local SQLite database via a React Native storage layer (e.g., WatermelonDB or SQLite with TypeORM). The database file resides in the app’s sandbox Documents directory.
- **Image cache**: Captured images are stored in the app’s `Caches` directory. Images associated with saved log entries are copied to a `Images` subdirectory within Documents for durability. Temporary capture images are deleted after 7 days if not saved.
- **Schema versioning**: The database uses a `schemaVersion` integer (starting at 1). Migrations are applied on app launch before any queries run. A migration log table records applied versions.
- **Backup behavior**: The local database and images are included in standard iOS device backups (iCloud/iTunes) because they reside in the Documents directory.
- **Recovery**: If a schema migration fails, the app presents a blocking error. If the user chooses "Reset", the database is deleted and recreated from scratch; images remain but orphaned entries are cleaned on next launch.
- **Ephemeral state**: Camera preview buffers, current analysis results before save, and navigation stack are not persisted. They are lost if the app is terminated before saving.

## 12. Design Intent For Stitch

- **Aesthetic**: Clean, clinical, and trustworthy. The app should feel like a health tool, not a social network. Use ample whitespace, neutral backgrounds (white/light gray), and a single accent color (deep teal or emerald green) for primary actions and progress indicators.
- **Typography**: Highly legible sans-serif system font (SF Pro). Large, bold numbers for calories and macros. Small, muted labels for units.
- **Photography**: Food photography is central. The camera and review screens should maximize image real estate. UI overlays use subtle blur and dark gradients to remain legible without hiding the food.
- **Motion**: Smooth spring animations for progress rings and macro bars. Quick cross-fade transitions between camera and review. No bouncy or playful animations; keep motion precise and responsive.
- **Surface hierarchy**: Camera is the default landing surface to reinforce speed. Dashboard is secondary and accessible via a bottom tab. History and Profile are tertiary tabs.
- **Empty states**: When no logs exist, the Dashboard shows a friendly illustration of a plate with a camera icon and a primary CTA: "İlk öğününüzü fotoğraflayın."
- **Accessibility**: All interactive elements must have minimum 44x44 pt touch targets. Color is never the sole indicator of state; icons and labels accompany progress colors. Dynamic Type support is required.

## 13. Quality Requirements

- **Performance**: Camera preview must maintain 30 FPS. AI Review screen must render within 100 ms of receiving results. Dashboard must load the current day’s data within 200 ms from local storage.
- **Accuracy**: AI food recognition should achieve >75% top-1 accuracy on common Turkish dishes. Portion estimation should be within ±30% of actual weight for standard plates. These are target metrics, not guaranteed contracts.
- **Reliability**: The app must not crash if the AI service returns malformed JSON. It must handle photo library permission revocations gracefully at any point in the flow.
- **Battery**: Continuous camera preview should not cause thermal throttling within 3 minutes of active use. Background sync of offline queue should use discretionary URL sessions to preserve battery.
- **Privacy**: Food images are transmitted to the AI service only; they are not used for advertising or shared with third parties. A brief privacy notice is shown on first launch.

## 14. Platform Requirements

- **Platform**: iOS 15.0 and later.
- **Devices**: iPhone and iPad support (universal app). On iPad, use split-view compatible layouts and support both orientations.
- **Permissions**: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSAppTransportSecurity` (if needed for custom domains).
- **Orientation**: Portrait primary; landscape supported on iPad and for photo review on iPhone.
- **Dark Mode**: Full dark mode support using system adaptive colors.
- **Accessibility**: VoiceOver labels on all nutrition readouts, camera controls, and charts. Reduce Motion support.
- **App Store**: Must comply with App Store Review Guidelines for health-related apps (no medical claims; present data as informational only).

## 15. Stack Requirements

- **Framework**: React Native 0.73+ with TypeScript.
- **Navigation**: React Navigation (Native Stack + Bottom Tabs).
- **State Management**: Zustand for global UI state; React Query (TanStack Query) for server/AI state and caching.
- **Local Storage**: SQLite via `react-native-quick-sqlite` or WatermelonDB for relational logs; `react-native-mmkv` for small key-value flags (onboarding, schema version).
- **Camera**: `react-native-vision-camera` for capture and `react-native-camera-kit` or native picker for gallery.
- **Permissions**: `react-native-permissions` for unified permission handling.
- **AI/Network**: Axios for HTTP requests to the AI analysis backend. Images uploaded as multipart/form-data.
- **Charts**: `react-native-gifted-charts` or `victory-native` for macro and trend visualizations.
- **Code Quality**: ESLint, Prettier, TypeScript strict mode. No `any` types in domain logic.
- **iOS Native**: Pods managed via CocoaPods. Swift bridging header only if a custom native module is required.

## 16. Testability Contract

- **Component tests**: All presentational components accept props for data and callbacks; no direct store imports. Test with `@testing-library/react-native`.
- **Hook tests**: Custom hooks for camera, permissions, and analysis expose loading/error/data states explicitly. Test with `react-hooks-testing-library`.
- **E2E tests**: Maestro or Detox flows for:
  - Camera permission grant → capture → mock AI response → save → verify dashboard.
  - Goal update → verify dashboard ring recalculation.
- **Mock contracts**: The AI service client must accept an injectable HTTP adapter. Tests use a mocked adapter returning fixture JSON. The camera module is mocked to return a static image asset.
- **testID attributes**: Every screen container, primary button, list item, and input field must have a `testID` prop for E2E selectors. Examples: `testID="cameraCaptureButton"`, `testID="saveLogButton"`, `testID="dashboardCalorieRing"`.
- **Snapshot policy**: Snapshot tests are allowed only for static design system components (buttons, cards, inputs). Business screens are excluded from snapshots to reduce churn.

## 17. Out Of Scope

- Social features (sharing meals with friends, feed, likes, comments).
- Recipe creation or custom recipe builder beyond manual single-item addition.
- Meal planning or grocery list generation.
- Integration with Apple HealthKit, Apple Watch, or third-party wearables.
- Doctor/patient data sharing or medical reporting.
- Web dashboard or companion website.
- Subscription billing or in-app purchases for the initial release.
- Multi-language support beyond Turkish UI labels.
- Real-time video stream analysis (only still-photo capture is supported).
