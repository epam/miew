/* eslint-env node */
/* global require */

import path from 'path';
import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginCommonJS from 'rollup-plugin-commonjs';
import rollupPluginReplace from 'rollup-plugin-replace';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import rollupPluginAlias from 'rollup-plugin-alias';
import rollupPluginString from 'rollup-plugin-string';

import version from './tools/version';
import packageJson from './package.json';

const banner = '/** ' + version.copyright + ' */\n';

const warnExceptions = {
  THIS_IS_UNDEFINED: [
    'spin.js', // https://github.com/fgnass/spin.js/issues/351
  ],
};

export default {
  input: './src/index.js',
  onwarn: function(warning, warn) {
    const exceptions = warning.loc && warnExceptions[warning.code] || [];
    if (!exceptions.some(name => warning.loc.file.endsWith(name))) {
      warn(warning);
    }
  },
  plugins: [
    rollupPluginReplace({
      PACKAGE_VERSION: JSON.stringify(version.combined),
      DEBUG: false,
    }),
    rollupPluginString({
      include: '**/*.glsl',
    }),
    rollupPluginAlias({
      // lib
      three:   path.resolve(__dirname, 'vendor/js/three.module.js'),
      Smooth:  path.resolve(__dirname, 'vendor/js/Smooth.js'),
      mmtf:    path.resolve(__dirname, 'vendor/js/mmtf.js'),
    }),
    rollupPluginNodeResolve(),
    rollupPluginCommonJS({
      include: [
        './node_modules/**',
        './vendor/js/**',
        './src/utils/SelectionParser.js',
        './src/utils/MiewCLIParser.js',
      ],
      exclude: [
        './vendor/js/three.module.js',
      ],
      namedExports: {
        'vendor/js/Smooth.js': ['Smooth'],
      },
    }),
    rollupPluginBabel({
      babelrc: false,
      runtimeHelpers: true,
      presets: [['env', {modules: false}]],
      plugins: ['external-helpers'],
      exclude: [
        './node_modules/**',
        './vendor/js/**',
        './src/utils/SelectionParser',
        './src/utils/MiewCLIParser.js',
      ],
    }),

  ],
  output: [{
    format: 'umd',
    name: 'Miew',
    file: 'build/' + packageJson.main,
    banner,
    sourcemap: true,
  }, {
    format: 'es',
    file: 'build/' + packageJson.module,
    banner,
    sourcemap: true,
  }],
};

