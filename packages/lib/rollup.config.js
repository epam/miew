/* eslint-env node */

const rollupPluginBabel = require('rollup-plugin-babel');
const rollupPluginCommonJS = require('rollup-plugin-commonjs');
const rollupPluginReplace = require('rollup-plugin-replace');
const rollupPluginNodeResolve = require('rollup-plugin-node-resolve');
const { string } = require('rollup-plugin-string');

const path = require('path');
const version = require('./tools/version');
const packageJson = require('./package.json');

const banner = `/** ${version.copyright} */\n`;

const warnExceptions = {
  THIS_IS_UNDEFINED: [
    'spin.js', // https://github.com/fgnass/spin.js/issues/351
  ],
};

export default {
  external: ['three', 'lodash'],
  input: './src/index.js',
  onwarn(warning, warn) {
    const exceptions = (warning.loc && warnExceptions[warning.code]) || [];
    if (!exceptions.some((name) => warning.loc.file.endsWith(name))) {
      warn(warning);
    }
  },
  plugins: [
    rollupPluginReplace({
      PACKAGE_VERSION: JSON.stringify(version.combined),
      DEBUG: false,
    }),
    string({
      include: [
        '**/*.vert',
        '**/*.frag',
      ],
    }),
    rollupPluginNodeResolve(),
    rollupPluginCommonJS({
      include: [
        /node_modules/,
        './vendor/js/**',
        './src/utils/SelectionParser.js',
        './src/utils/MiewCLIParser.js',
      ],
      namedExports: {
        'vendor/js/Smooth.js': ['Smooth'],
      },
    }),
    rollupPluginBabel({
      runtimeHelpers: true,
      exclude: [
        /node_modules[\\/](?!three)/,
        './vendor/js/**',
        './src/utils/SelectionParser',
        './src/utils/MiewCLIParser.js',
      ],
      extends: path.join(__dirname, '/.babelrc'),
    }),

  ],
  output: [{
    format: 'umd',
    name: 'Miew',
    file: `build/${packageJson.main}`,
    banner,
    sourcemap: true,
    globals: {
      three: 'THREE',
      lodash: '_',
    },
  }, {
    format: 'es',
    file: `build/${packageJson.module}`,
    banner,
    sourcemap: true,
  }],
};
