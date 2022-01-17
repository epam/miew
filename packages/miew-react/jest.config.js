module.exports = {
  testPathIgnorePatterns: ['dist', 'node_modules'],
  transform: {
    '\\.js?$': 'babel-jest',
    '\\.(ts|tsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    '^src(.*)$': '<rootDir>/src/$1',
    '^components(.*)$': '<rootDir>/src/components/$1',
    '^state(.*)$': '<rootDir>/src/state/$1'
  },
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ]
}
