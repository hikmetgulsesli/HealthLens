import React, { useEffect } from 'react';
import {StatusBar, LogBox, AppState, AppStateStatus} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

LogBox.ignoreLogs([
  'Failed to find parent screen controller from <RNSScreenContentWrapper>',
]);
import {AppNavigator} from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';
import {useOfflineQueueStore} from './src/stores/offlineQueueStore';
import {useUserStore} from './src/stores/userStore';

function useForegroundSync() {
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state !== 'active') return;
      void useOfflineQueueStore.getState().processQueue();
      void useUserStore.getState().syncKeychainLimit();
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);
}

function App(): React.JSX.Element {
  useForegroundSync();
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
