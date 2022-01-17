import autoprefixer from 'autoprefixer'
import babel from '@rollup/plugin-babel'
import cleanup from 'rollup-plugin-cleanup'
import commonjs from '@rollup/plugin-commonjs'
import copy from 'rollup-plugin-copy'
import del from 'rollup-plugin-delete'
import json from '@rollup/plugin-json'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import pkg from './package.json'
import postcss from 'rollup-plugin-postcss'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import strip from '@rollup/plugin-strip'
import svgr from '@svgr/rollup'
import typescript from 'rollup-plugin-typescript2'
import version from './tools/version'

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
    postcss({
      plugins: [autoprefixer({ grid: 'autoplace' })],
      // extract: path.resolve('dist/index.css'),
      minimize: isProduction,
      sourceMap: true,
      modules: true,
      use: ['sass']
    }),
    svgr(),
    copy({
      targets: [{ src: 'src/style/*.svg', dest: 'dist' }]
    }),
    cleanup({
      extensions: extensions.map(ext => ext.trimStart('.')),
      comments: 'none'
    }),
    ...(isProduction ? [strip({ include: 'src/**/*.{js,jsx,ts,tsx}' })] : [])
  ]
}

export default config
