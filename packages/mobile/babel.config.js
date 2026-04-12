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
      // Reanimated plugin DISABLED — causes createAnimatedComponent crashes
      // with RN 0.76 Fabric components + uniwind + gesture-handler.
      // Using RN's built-in Animated API instead.
      // 'react-native-reanimated/plugin',
    ],
  };
};
