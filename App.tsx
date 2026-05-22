import React from 'react';
import {StatusBar, LogBox} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

LogBox.ignoreLogs([
  'Failed to find parent screen controller from <RNSScreenContentWrapper>',
]);
import {AppNavigator} from './src/navigation/AppNavigator';
import {colors} from './src/theme/colors';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
