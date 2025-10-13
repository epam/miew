module.exports = {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'no-descending-specificity': null,
    'color-function-notation': 'legacy',
    'selector-attribute-quotes': 'never',
    'alpha-value-notation': 'number',
    'property-no-vendor-prefix': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'scss/load-partial-extension': 'always',
  },
};
