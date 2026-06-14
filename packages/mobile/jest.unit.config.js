/**
 * Pure-logic unit tests (node environment, no React Native renderer).
 *
 * The scaffolded `jest.config.js` targets component tests via the RN preset,
 * which is brittle on RN 0.85 / React 19. This config runs only `*.unit.test.ts`
 * files that import pure modules (stores, helpers) — fast, deterministic, and
 * independent of the native mock stack.
 */
module.exports = {
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
};
