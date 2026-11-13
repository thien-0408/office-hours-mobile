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
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: props => React.createElement(View, props) };
});

// expo-image pulls expo-modules-core (native modules); render a plain View.
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Image: props => React.createElement(View, props) };
});

// ---- MO-01 native modules ----
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' }),
  ),
  getForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' }),
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: { latitude: 0, longitude: 0, accuracy: 5, altitude: 0 },
      timestamp: 0,
    }),
  ),
  watchPositionAsync: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
  Accuracy: { Balanced: 3, High: 4, Highest: 5 },
}));
jest.mock('expo-sensors', () => ({
  Barometer: {
    isAvailableAsync: jest.fn(() => Promise.resolve(true)),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: props => React.createElement(View, props),
    Camera: {
      requestCameraPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' }),
      ),
      getCameraPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: true, canAskAgain: true, status: 'granted' }),
      ),
    },
    useCameraPermissions: jest.fn(() => [
      { granted: true, canAskAgain: true },
      jest.fn(),
    ]),
  };
});
jest.mock('@react-native-ml-kit/text-recognition', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn(() => Promise.resolve({ text: '', blocks: [] })),
  },
}));
// expo-gl: GLView renders a plain View; onContextCreate is never called.
jest.mock('expo-gl', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GLView: props => React.createElement(View, props),
    ExpoWebGLRenderingContext: class {},
  };
});
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      downloadAsync: jest.fn(() => Promise.resolve()),
      localUri: 'file:///mock',
      uri: 'file:///mock',
    })),
    loadAsync: jest.fn(() => Promise.resolve([])),
  },
}));
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  cacheDirectory: 'file:///cache/',
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
}));
