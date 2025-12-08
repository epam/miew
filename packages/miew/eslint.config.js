const {
  defineConfig,
  globalIgnores,
} = require('eslint/config');

const babelParser = require('@babel/eslint-parser');
const globals = require('globals');
const react = require('eslint-plugin-react');
const js = require('@eslint/js');

const {
  fixupConfigRules,
} = require('@eslint/compat');

const {
  FlatCompat,
} = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});
const os = require('os');

module.exports = defineConfig([{
  extends: fixupConfigRules(compat.extends('airbnb-base')),

  settings: {
    'import/core-modules': ['eslint/config'],
  },

  languageOptions: {
    parser: babelParser,
    ecmaVersion: 'latest',
    sourceType: 'module',

    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },

      babelOptions: {
        rootMode: 'upward',
      },
    },

    globals: {
      ...globals.browser,
      DEBUG: true,
    },
  },

  plugins: {
    react,
  },

  // current deviations from AirBnB setup
  rules: {
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
    }],

    'linebreak-style': ['warn', os.EOL === '\n' ? 'unix' : 'windows'],

    'no-unused-vars': ['error', {
      vars: 'all',
      args: 'after-used',
      argsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],

    'no-mixed-operators': ['error', {
      groups: [
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof'],
      ],

      allowSamePrecedence: true,
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
    'max-classes-per-file': 'off',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
  },
}, {
  files: ['src/**/*.test.js', 'test/**/*.js'],

  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.mocha,
    },
  },

  rules: {
    'func-names': 'off',
  },
}, {
  files: ['./*.{js,mjs}', 'tools/**/*.{js,mjs}'],

  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
}, {
  files: ['examples/*.js'],

  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },

  rules: {
    'no-var': 'off',
    'prefer-arrow-callback': 'off',
    'prefer-template': 'off',
    'object-shorthand': 'off',
  },
}, globalIgnores([
  'dist',
  'vendor',
  '!**/.eslintrc.js',
  '!**/.mocharc.js',
  '!**/.stylelintrc.js',
])]);
