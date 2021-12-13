module.exports = {
  verbose: true,
  reporters: [['jest-simple-dot-reporter', { color: true }]],
  collectCoverageFrom: ['src/**/*.jsx'],
  moduleDirectories: ['node_modules'],
  coverageReporters: ['lcov', 'text-summary'],
  coverageDirectory: 'coverage',
  moduleNameMapper: { '\\.(css|scss)$': 'identity-obj-proxy' }
}
