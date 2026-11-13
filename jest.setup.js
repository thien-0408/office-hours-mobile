/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

// Reanimated 4.7.1: JSReanimated (used under Jest) throws in
// setCSSEventHandler during module init, so no-op that one call.
jest.mock('react-native-reanimated/src/css/native/proxy', () => ({
  ...jest.requireActual('react-native-reanimated/src/css/native/proxy'),
  setCSSEventHandler: jest.fn(),
}));
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: props => React.createElement(View, props),
    BlurTargetView: props => React.createElement(View, props),
  };
});
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
