jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
jest.mock('react-native-camera-kit', () => ({
  Camera: 'Camera',
  CameraType: { Back: 'back' },
}));

jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  }),
}));

jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Circle: 'Circle',
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({ password: '0' })),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));
