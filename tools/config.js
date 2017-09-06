/* eslint-env node */

import yargs from 'yargs';

export default {
  docs: {
    dst: 'docs/auto/',
  },
  cover: {
    dst: 'coverage/',
  },
  lib: {
    src: 'src/',
    dst: 'build/dist/',
  },
  examples: {
    src: 'examples/',
    dst: 'build/examples',
  },
  demo: {
    src: 'demo/',
    dst: 'build/',
  },
  lint: {
    src: [
      '*.js',
      'src/**/*.js',
      'demo/scripts/**/*.js',
      'examples/**/*.js',
      'test/**/*.js',
      'tools/**/*.js',
    ],
  },
  roServer: Boolean(process.env.MIEW_READONLY_SERVER || yargs.argv.roServer),
};
