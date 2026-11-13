// Separate Jest config for the Realtime Database rules tests (node env, no React Native preset).
// Run through `npm run test:rules`, which starts the emulator first.
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.test\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', {targets: {node: 'current'}}],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
  testTimeout: 20000,
};
