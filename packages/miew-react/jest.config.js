/* eslint-env node */
module.exports = {
  verbose: true,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://localhost',
  },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { rootMode: 'upward' }],
  },
  moduleNameMapper: {
    '^.+\\.[sp]?css$': 'babel-jest',
  },
  reporters: [['jest-simple-dot-reporter', { color: true }]],
  coverageReporters: ['lcov', 'text-summary'],
};
