import { useAnalysisStore } from '../../src/stores/analysisStore';
import { useHydrationStore } from '../../src/stores/hydrationStore';
import { useLogStore } from '../../src/stores/logStore';
import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';
import { useUserStore } from '../../src/stores/userStore';

/**
 * Reset every persisted zustand store to a deterministic baseline so tests
 * cannot leak state between runs.
 *
 * Defaults match the seed profiles shipped on first launch.
 */
export function resetAllStores(): void {
  const now = new Date().toISOString();
  useUserStore.setState({
    profile: {
      id: 'default',
      createdAt: now,
      updatedAt: now,
      goals: {
        dailyCalorieGoal: null,
        dailyProteinGoal: null,
        dailyCarbGoal: null,
        dailyFatGoal: null,
        showMicronutrients: false,
        showSodium: false,
        showFiber: false,
        showSugar: false,
      },
      unitSystem: 'metric',
      isFirstLaunch: true,
      isPremium: false,
      plan: 'free',
      trialEndsAt: null,
      freeScansDateKey: now.split('T')[0],
      freeScansUsed: 0,
      healthGoal: null,
      email: null,
      loginMethod: null,
    },
  });
  useLogStore.setState({ entries: {} });
  useAnalysisStore.setState({
    currentAnalysis: null,
    isAnalyzing: false,
    imageUris: [],
  });
  useOfflineQueueStore.setState({ queue: [], isProcessing: false });
  useHydrationStore.setState({ waterIntake: {}, dailyWaterGoal: 2500 });
}
