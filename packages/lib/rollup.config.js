/* eslint-env node */

import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import del from 'rollup-plugin-delete'
import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import packageJson from './package.json'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import replace from '@rollup/plugin-replace'
import { string } from 'rollup-plugin-string'
import ttypescript from 'ttypescript'
import typescript from 'rollup-plugin-typescript2'
import version from './tools/version'
import { terser } from 'rollup-plugin-terser'
import postcss from 'rollup-plugin-postcss'

// import cleanup from 'rollup-plugin-cleanup'

// import strip from '@rollup/plugin-strip'

// const mode = {
//   PRODUCTION: 'production',
//   DEVELOPMENT: 'development'
// }

const banner = `/** ${version.copyright} */\n`
const extensions = ['.js', '.ts']
// const isProduction = process.env.NODE_ENV === mode.PRODUCTION
const includePattern = 'src/**/*'
const warnExceptions = {
  THIS_IS_UNDEFINED: [
    'spin.js' // https://github.com/fgnass/spin.js/issues/351
  ]
}

const config = {
  input: './src/index.ts',
  output: [
    {
      format: 'umd',
      name: 'Miew',
      file: packageJson.main,
      banner,
      sourcemap: true
    },
    {
      format: 'es',
      file: packageJson.module,
      banner,
      sourcemap: true
    },
    {
      format: 'iife',
      file: 'dist/miew.min.js',
      name: 'miew',
      plugins: [terser()],
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
    del({
      targets: 'dist/*',
      runOnce: true
    }),
    peerDepsExternal({ includeDependencies: true }),
    replace({
      preventAssignment: true,
      values: {
        PACKAGE_VERSION: JSON.stringify(version.combined),
        DEBUG: false
      }
    }),
    string({
      include: ['**/*.vert', '**/*.frag']
    }),
    nodeResolve({ extensions, preferBuiltins: false }),
    commonjs({ sourceMap: false }),
    typescript({
      typescript: ttypescript,
      tsconfigOverride: {
        exclude: ['__tests__/**/*']
      }
    }),
    postcss({
      extract: path.resolve(packageJson.style)
    }),
    babel({
      extensions,
      babelHelpers: 'runtime',
      include: includePattern
    })
    // cleanup({
    //   extensions: extensions.map((ext) => ext.trimStart('.')),
    //   comments: 'none',
    //   include: includePattern
    // }),
    // ...(isProduction ? [strip({ include: includePattern })] : [])
  ]
}

export default config
