const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // 3D models exported from Blender, loaded through expo-asset.
    assetExts: [...defaultConfig.resolver.assetExts, 'glb', 'gltf'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
