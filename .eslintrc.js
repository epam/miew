module.exports = {
  root: true,
  extends: 'airbnb-base/legacy', // https://github.com/airbnb/javascript/tree/master/es5

  parserOptions: {
   sourceType: 'module',
  },

  env: {
    browser: true,
  },

  globals: {
    requirejs: true,
    DEBUG: true,
  },

  // current deviations from AirBnB setup (TODO: revisit later)
  rules: {
    'no-underscore-dangle': 'off', // TODO: consider ['warn', {allowAfterThis: true}]
    'vars-on-top': 'off',
    'space-before-function-paren': ['warn', 'never'],
    'no-mixed-operators': 'off',
    'key-spacing': 'off', // TODO: consider 'warn'
    'spaced-comment': 'off', // TODO: consider ['warn', 'always', {line: {exceptions: ['/']}, block: {exceptions: ['*']}}]
    'func-names': 'off',
    'padded-blocks': 'off',
    'quote-props': 'off',
    'one-var-declaration-per-line': 'off',
    'max-len': ['warn', {code: 120, tabWidth: 2}],
    'object-curly-spacing': ['warn', 'never'],
    'indent': ['warn', 2],
    'no-param-reassign': 'off',
    'one-var': 'off',
    'no-undef': 'off',
    'no-console': 'off',
    'comma-dangle': 'off',
    'no-multi-spaces': 'off', // TODO: consider 'warn'
    'no-prototype-builtins': 'off', // TODO: consider 'error'
    'no-unused-vars': ['error', {"argsIgnorePattern": "^_|Ignored$"}],
    'wrap-iife': ['error', 'any'], // TODO: consider specifying one
    'no-use-before-define': ['error', 'nofunc'],
    'object-property-newline': 'off', // TODO: consider 'warn'
    'no-restricted-syntax': 'off',
    'no-else-return': 'off',
    'no-cond-assign': ['error', 'except-parens'],
    'space-infix-ops': ['warn', {int32Hint: true}],
    'no-nested-ternary': 'off',
    'global-require': 'off',
    'linebreak-style': 'off', // ['warn', 'windows'], // BUG: https://youtrack.jetbrains.com/issue/WEB-25487
    'no-continue': 'off',
    'no-bitwise': 'off',
    'no-plusplus': 'off', // TODO: consider ["error", {"allowForLoopAfterthoughts": true}]
    'no-multi-assign': 'off',

    'class-methods-use-this': 'off',
  },
};
