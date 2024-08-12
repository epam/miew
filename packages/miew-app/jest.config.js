/* eslint-env node */
module.exports = {
  verbose: true,
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "https://localhost",
  },
  transform: {
    "^.+\\.[jt]sx?$": ["babel-jest", { rootMode: "upward" }],
  },
  reporters: [["jest-simple-dot-reporter", { color: true }]],
  collectCoverageFrom: ["src/**/*.jsx"],
  moduleDirectories: ["node_modules"],
  coverageReporters: ["lcov", "text-summary"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "^.+\\.[sp]?css$": "babel-jest",
  },
};
