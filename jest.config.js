const preset = require('@react-native/jest-preset/jest-preset');

module.exports = {
  preset: '@react-native/jest-preset',
  // agent worktrees live under .claude/; never pick up their copies
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  // firebase/ has its own Jest config (npm run test:rules, needs the emulator)
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.claude/',
    '[\\\\/]firebase[\\\\/]tests[\\\\/]',
  ],
  setupFiles: [...preset.setupFiles, '<rootDir>/jest.setup.js'],
  transform: {
    ...preset.transform,
    '^.+\\.mjs$': 'babel-jest',
    '^.+\\.(ttf|otf)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-masked-view|@react-navigation|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-screens|react-native-svg|react-native-safe-area-context|@shopify/flash-list|lucide-react-native|three|@react-three/.*|@expo-google-fonts|expo(nent)?|@expo(nent)?/.*|expo-.*)/)',
  ],
};
