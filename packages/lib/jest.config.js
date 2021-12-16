module.exports = {
  testMatch: ['**/__tests__/**/?(*.)+(spec|test).+(ts|js)'],
  testPathIgnorePatterns: ['fixtures', 'dist', 'node_modules'],
  transform: {
    '\\.js?$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    'src(.*)$': '<rootDir>/src/$1'
  }
}
