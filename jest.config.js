module.exports = {
  preset: '@react-native/jest-preset',
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/test-utils/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-vector-icons|react-native-svg|react-native-camera-kit|react-native-mmkv|react-native-permissions|react-native-gifted-charts|@tanstack/react-query|zustand|@testing-library)/)',
  ],
  moduleNameMapper: {
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^react-native-image-picker$':
      '<rootDir>/__mocks__/react-native-image-picker.js',
    // aiService is mocked per-test via jest.mock so each suite can swap
    // its own implementation without conflicting with a static __mocks__
    // entry. Tests that need the default fallback should use
    // jest.requireMock('../../src/services/aiService').
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/stores/**/*.ts',
    'src/utils/**/*.ts',
    'src/hooks/**/*.ts',
    'src/config/**/*.ts',
    'src/components/**/*.tsx',
    '!src/**/*/{test,spec}.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'json-summary', 'lcov'],
};
