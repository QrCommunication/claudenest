module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Path aliases (@/ → src/)
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: { '@': './src' },
        },
      ],
      // Reanimated plugin — required for Reanimated 4 + New Architecture.
      // The crashes with createAnimatedComponent that required disabling this
      // in SDK 52 / RN 0.76 (Old Arch) are resolved in SDK 55 / RN 0.83 (New Arch).
      // MUST be listed last as per Reanimated docs.
      'react-native-reanimated/plugin',
    ],
  };
};
