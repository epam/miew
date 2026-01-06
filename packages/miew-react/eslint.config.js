const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');

const { fixupConfigRules } = require('@eslint/compat');

const reactRefresh = require('eslint-plugin-react-refresh');
const js = require('@eslint/js');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {},
    },

    extends: fixupConfigRules(
      compat.extends(
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ),
    ),

    settings: {
      react: {
        version: '18.2',
      },
      'import/core-modules': ['eslint/config'],
    },

    plugins: {
      'react-refresh': reactRefresh,
    },

    rules: {
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['*.{js,cjs,mjs}'],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  globalIgnores(['**/coverage', '**/dist']),
]);
