/* eslint-env node */
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import nodeResolve from '@rollup/plugin-node-resolve'
import cleanup from 'rollup-plugin-cleanup'
import { string } from 'rollup-plugin-string'
import path from 'path'
import version from './tools/version'
import packageJson from './package.json'
import strip from '@rollup/plugin-strip'

const mode = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development'
}

const banner = `/** ${version.copyright} */\n`
const extensions = ['.js', '.jsx', '.ts', '.tsx']
const isProduction = process.env.NODE_ENV === mode.PRODUCTION
const includePattern = 'src/**/*'
const warnExceptions = {
  THIS_IS_UNDEFINED: [
    'spin.js' // https://github.com/fgnass/spin.js/issues/351
  ]
}

const config = {
  input: './src/index.js',
  output: [
    {
      format: 'umd',
      name: 'Miew',
      file: packageJson.main,
      banner,
      sourcemap: true,
      globals: {
        three: 'THREE',
        lodash: '_'
      }
    },
    {
      format: 'es',
      file: packageJson.module,
      banner,
      sourcemap: true
    }
  ],
  onwarn(warning, warn) {
    const exceptions = (warning.loc && warnExceptions[warning.code]) || []
    if (!exceptions.some((name) => warning.loc.file.endsWith(name))) {
      warn(warning)
    }
  },
  plugins: [
    replace({
      PACKAGE_VERSION: JSON.stringify(version.combined),
      DEBUG: false
    }),
    peerDepsExternal({ includeDependencies: true }),
    string({
      include: ['**/*.vert', '**/*.frag']
    }),
    nodeResolve(),
    commonjs({
      include: [
        /node_modules/,
        './src/vendors/Smooth.js',
        './src/vendors/mmtf.js',
        './src/utils/SelectionParser.js',
        './src/utils/MiewCLIParser.js'
      ]
    }),
    cleanup({
      extensions: extensions.map((ext) => ext.trimStart('.')),
      comments: 'none',
      include: includePattern
    }),
    ...(isProduction ? [strip({ include: includePattern })] : []),
    babel({
      babelHelpers: 'runtime',
      exclude: [
        /node_modules[\\/](?!three)/,
        './vendor/js/**',
        './src/utils/SelectionParser',
        './src/utils/MiewCLIParser.js'
      ],
      extends: path.join(__dirname, '/.babelrc')
    })
  ]
}

export default config
