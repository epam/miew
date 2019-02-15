const os = require('os');

module.exports = {
  root: true,
  extends: 'airbnb-base', // https://github.com/airbnb/javascript

  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
  },

  env: {
    browser: true,
  },

  globals: {
    DEBUG: true,
  },

  // current deviations from AirBnB setup
  rules: {
    'linebreak-style': ['warn', os.EOL === '\n' ? 'unix' : 'windows'],
    'no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-continue': 'off',
    'no-bitwise': 'off',
    'no-plusplus': 'off',
    'no-multi-assign': 'off',
    'no-nested-ternary': 'off',
    'class-methods-use-this': 'off',

    // issues to evaluate and fix
    'no-console': 'off', // 30 problems
    'no-prototype-builtins': 'off', // 60 problems
    'no-restricted-syntax': 'off', // 27 problems
    'max-len': 'off', // 270 problems
    'func-names': 'off', // 562 problems
  },

  overrides: [{
    files: ['src/**/*.test.js', 'test/**/*.js'],
    env: {
      node: true,
      mocha: true,
    },
    rules: {
      'func-names': 'off',
    },
  }, {
    files: ['*.js', 'tools/**/*.js'],
    env: {
      node: true,
    },
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  }],
};
