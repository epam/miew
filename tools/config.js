/* eslint-env node */

import yargs from 'yargs';

export default {
  docs: {
    dst: 'docs/auto/',
  },
  cover: {
    src: [
      'src/**/*.js',
      '!src/**/*.test.js',
    ],
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
  test: {
    src: [
      'src/**/*.test.js',
      'test/**/*.js',
    ],
  },
  roServer: Boolean(process.env.MIEW_READONLY_SERVER || yargs.argv.roServer),
};
