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
    '\\.module\\.[sp]?css$': 'identity-obj-proxy',
    '^.+\\.[sp]?css$': '<rootDir>/__mocks__/emptyMock.js',
  },
  reporters: [['jest-simple-dot-reporter', { color: true }]],
  coverageReporters: ['lcov', 'text-summary'],
};
