module.exports = {
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).+(ts|js)'],
  testPathIgnorePatterns: ['fixtures', 'dist', 'node_modules'],
  transform: {
    '\\.js?$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '\\.frag$': 'jest-raw-loader',
    '\\.vert$': 'jest-raw-loader'
  },
  transformIgnorePatterns: ['/node_modules/(?!spin.js)'],
  moduleNameMapper: {
    'Miew(.*)': '<rootDir>/src/Miew.js'
  }
}
