/* eslint-env node */

import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginCommonJS from 'rollup-plugin-commonjs';
import rollupPluginReplace from 'rollup-plugin-replace';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import { string } from 'rollup-plugin-string';

import path from 'path';
import version from './tools/version';
import packageJson from './package.json';

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
        './node_modules/**',
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
