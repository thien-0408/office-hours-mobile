module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['docs/'],
  overrides: [
    {
      files: ['firebase/**/*.{js,ts}'],
      env: {node: true, jest: true},
    },
  ],
};
