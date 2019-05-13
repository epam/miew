/* eslint-env node */

export default {
  docs: {
    dst: 'docs/auto/',
    show: 'docs/auto/index.html',
  },
  cover: {
    src: [
      'src/**/*.js',
      '!src/**/*.test.js',
    ],
    dst: 'coverage/',
    show: 'coverage/lcov-report/index.html',
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
      'test/**/*.test.js',
    ],
  },
  e2e: {
    src: 'test/**/*.e2e.js',
    dst: [
      'test/e2e/mismatch/*.png',
      'test/e2e/mismatch/*.html',
    ],
    show: 'test/e2e/mismatch/*.html',
  },
};
