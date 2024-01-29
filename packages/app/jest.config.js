module.exports = {
  verbose: true,
  transform: {
    "^.+\\.jsx?$": "./tools/babel-jest-wrapper.js",
  },
  reporters: [["jest-simple-dot-reporter", { color: true }]],
  collectCoverageFrom: ["src/**/*.jsx"],
  moduleDirectories: ["node_modules"],
  coverageReporters: ["lcov", "text-summary"],
  coverageDirectory: "coverage",
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/__mocks__/styleMock.js",
  },
};
