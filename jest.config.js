module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-vector-icons|react-native-svg|react-native-camera-kit|react-native-mmkv|react-native-permissions|react-native-gifted-charts|@tanstack/react-query|zustand)/)',
  ],
  moduleNameMapper: {
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^react-native-image-picker$':
      '<rootDir>/__mocks__/react-native-image-picker.js',
    '^../services/aiService$': '<rootDir>/__mocks__/aiService.js',
    '^./services/aiService$': '<rootDir>/__mocks__/aiService.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
