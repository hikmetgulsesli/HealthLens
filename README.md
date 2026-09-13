This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# Testing

## Quick reference

```sh
# Run the whole suite (44 suites, 263 tests, ~5s)
npm test

# Type-check + lint + test in one shot
npm run qa

# Coverage report (writes to ./coverage/)
npm run test:coverage

# Sub-suites (faster iteration)
npm run test:screens      # UI mount + interaction
npm run test:stores       # Zustand store reducers + offline queue
npm run test:hooks        # useReduceMotion + custom hooks
npm run test:utils        # date, imageUtils, healthGradeStyle, systemSettings
```

## Conventions

- **Tests live under `__tests__/`** mirroring `src/`. Use the file's
  sibling name plus `.test.ts(x)` (jest default `testMatch`).
- **`renderScreen` helper** (in `__tests__/test-utils/renderScreen.tsx`)
  wraps `TestRenderer.create()` in `act()` and auto-mocks `Alert.alert`.
  Use it for any screen that mounts `react-native` UI.
- **Store tests** call `resetAllStores()` in `beforeEach` to avoid
  cross-test state leaks across `analysisStore` / `logStore` /
  `offlineQueueStore` / `userStore` / `hydrationStore`.
- **Snapshots** are restricted to design-system components only
  (`MacroBadge`, `MacroBento`, `CameraTopBar`, `EmptyMealsCard`,
  etc.). Business screens are excluded.
- **`tsc --noEmit` and `eslint` must both be clean** before committing.
  The `npm run qa` pipeline runs all three.

## TestID contract

Every interactive element exposed to E2E (Maestro) must carry a stable
`testID` prop. Run `npm run test:screens` and grep for the rendered
surface — every primary action must show up. Currently wired:

| testID | Surface |
| --- | --- |
| `cameraPreview`, `cameraCaptureButton`, `cameraGalleryButton`, `cameraFlashButton` | Camera |
| `cameraCloseButton`, `cameraVoiceButton`, `cameraBarcodeButton` | CameraTopBar |
| `paywallStartTrialButton` | Paywall |
| `profileGoalCalorie[-increment/decrement/-input]` | Profile |
| `dashboardCalorieRing`, `dashboardCalorieValue`, `dashboardCameraFab` | Dashboard |
| `dashboardFirstCaptureCta`, `dashboardMealCard-<entryId>` | Dashboard meals |
| `dashboardMacroBar-Protein/Karbonhidrat/Yağ` | Macro bars |
| `reviewAddItemButton`, `reviewRetakeButton`, `saveLogButton`, `reviewAddItemSaveButton` | Review |
| `errorBoundaryRetry` | ErrorBoundary |
| `historyDay-<YYYY-MM-DD>` | History picker |

## AI backend integration

`HttpAiClient` (`src/services/ai/HttpAiClient.ts`) is the only thing
that talks to the network. The contract is:

```
POST {AI_PROXY_URL}/v1/analyze-image
Authorization: Bearer {AI_PROXY_TOKEN}
Content-Type: application/json
{
  "mime": "image/jpeg" | "image/png" | "image/heic",
  "imageBase64": "<base64 of file bytes>"
}

200 OK →
{
  "imageUri": "...",
  "imageUris": ["..."],
  "mealCategory": "breakfast" | "lunch" | "dinner" | "snack",
  "smartInsight": "<string>",
  "items": [
    {
      "id": "<uuid>",
      "name": "<localized>",
      "confidence": 0..1,
      "estimatedPortionGrams": number,
      "caloriesPer100g": number,
      "proteinPer100g": number,
      "carbsPer100g": number,
      "fatPer100g": number,
      "fiberPer100g": number,
      "sugarPer100g": number,
      "sodiumPer100g": number
    }
  ]
}
```

Errors are mapped to a typed `AiError` (`src/services/ai/errors.ts`):

| HTTP | kind | retry? |
| --- | --- | --- |
| timeout (15 s AbortSignal) | `timeout` | yes |
| 401 / 403 | `auth` | no |
| 429 w/ Retry-After | `rate_limit` (+ retryAfterSec) | yes |
| 5xx | `provider_error` | yes |
| 4xx other | `invalid_payload` | no |
| JSON parse fail | `parse_error` | no |

The `offlineQueueStore` (`src/stores/offlineQueueStore.ts`) replays
these with exponential backoff (1 s, 4 s, 16 s) up to `MAX_RETRY = 3`.

### Manual end-to-end probe

To validate the wire contract against a local mock without a real
Kimi / Minimax deployment:

```sh
# Terminal A — fake server
node scripts/fake-ai-server.js   # listens on 127.0.0.1:9999

# Terminal B — Jest integration test
AI_PROXY_URL=http://127.0.0.1:9999 \
AI_PROXY_TOKEN=test-token-12345 \
  npm test -- offlineQueueProcess

# The suite asserts: timeout, retry-after, 401, 500, dedup, and the
# full happy-path (3-item food list) end-to-end.
```

Coverage is published under `./coverage/lcov-report/index.html` after
`npm run test:coverage`.
