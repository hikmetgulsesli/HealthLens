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

jest.mock('react-native-svg', () => {
  const React = require('react');
  const passthrough = (name: string) =>
    React.forwardRef((props: { children?: React.ReactNode } & object, _ref: unknown) =>
      React.createElement(name, props, props?.children),
    );
  return {
    Svg: passthrough('Svg'),
    Circle: passthrough('Circle'),
    Path: passthrough('Path'),
    Rect: passthrough('Rect'),
    G: passthrough('G'),
    Text: passthrough('SvgText'),
    Line: passthrough('Line'),
    Polygon: passthrough('Polygon'),
  };
});

jest.mock('react-native-mmkv', () => {
  class MMKV {
    constructor() {
      this.store = new Map();
    }
    getString(name) {
      return this.store.has(name) ? this.store.get(name) : undefined;
    }
    set(name, value) {
      this.store.set(name, value);
    }
    delete(name) {
      this.store.delete(name);
    }
  }
  return { MMKV };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({ password: '0' })),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));
