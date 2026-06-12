module.exports = {
  root: true,
  extends: "@react-native",
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "android/",
    "ios/",
    "dist/",
    "coverage/",
    "patches/",
  ],
  rules: {
    // Aligned with eslint-plugin-react-hooks "recommended" default (warn).
    // @react-native/eslint-config hardens it to error; mount-only effects
    // are an intentional pattern in this codebase.
    "react-hooks/exhaustive-deps": "warn",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        // warn (not error): the project convention `const X = memo(function X() {})`
        // (see .claude/rules/mobile.md) triggers false positives on no-shadow.
        "@typescript-eslint/no-shadow": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "no-shadow": "off",
        "no-undef": "off",
      },
    },
    {
      files: ["jest.setup.js", "jest.config.js"],
      env: { jest: true },
    },
  ],
};
