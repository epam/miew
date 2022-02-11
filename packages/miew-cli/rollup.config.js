import babel from '@rollup/plugin-babel'
import cleanup from 'rollup-plugin-cleanup'
import commonjs from '@rollup/plugin-commonjs'
import del from 'rollup-plugin-delete'
import json from '@rollup/plugin-json'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import pkg from './package.json'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import strip from '@rollup/plugin-strip'
import typescript from 'rollup-plugin-typescript2'
import version from './tools/version'
import { terser } from 'rollup-plugin-terser'

const mode = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development'
}

const extensions = ['.js', '.jsx', '.ts', '.tsx']
const isProduction = process.env.NODE_ENV === mode.PRODUCTION
const banner = `/** ${version.copyright} */\n`

const config = {
  input: pkg.source,
  output: [
    {
      file: pkg.main,
      exports: 'named',
      format: 'cjs',
      banner
    },
    {
      file: pkg.module,
      exports: 'named',
      format: 'es',
      banner
    },
    {
      format: 'iife',
      file: 'dist/miew-cli.min.js',
      name: 'miewCli',
      plugins: [terser()],
      banner,
      sourcemap: true,
      globals: {
        lodash: '_'
      }
    }
  ],
  plugins: [
    del({
      targets: 'dist/*',
      runOnce: true
    }),
    peerDepsExternal({ includeDependencies: true }),
    resolve({ extensions, preferBuiltins: false }),
    commonjs({ sourceMap: false }),
    replace(
      {
        preventAssignment: true,
        'process.env.NODE_ENV': JSON.stringify(
          isProduction ? mode.PRODUCTION : mode.DEVELOPMENT
        ),
        'process.env.VERSION': JSON.stringify(pkg.version),
        'process.env.BUILD_DATE': JSON.stringify(
          new Date().toISOString().slice(0, 19)
        ),
        'process.env.BUILD_NUMBER': JSON.stringify(undefined)
      },
      {
        include: 'src/**/*.{js,jsx,ts,tsx}'
      }
    ),
    json(),
    typescript(),
    babel({
      extensions,
      babelHelpers: 'runtime',
      include: ['src/**/*']
    }),
    cleanup({
      extensions: extensions.map((ext) => ext.trimStart('.')),
      comments: 'none'
    }),
    ...(isProduction ? [strip({ include: 'src/**/*.{js,jsx,ts,tsx}' })] : [])
  ]
}

export default config
