/* eslint-disable global-require */
module.exports = {
  parser: 'postcss-scss',
  plugins: [
    require('postcss-import')(),
    require('postcss-advanced-variables')(),
    require('postcss-nested')(),
    require('postcss-calc')(),
    require('autoprefixer')(),
  ],
};
