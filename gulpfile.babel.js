import gulp     from 'gulp';
import del      from 'del';
import sequence from 'run-sequence';
import yargs    from 'yargs';
import path     from 'path';
import log      from 'fancy-log';
import _        from 'lodash';
import jsdoc    from 'gulp-jsdoc3';
import open     from 'open';
import webpack  from 'webpack';
import {rollup} from 'rollup';
import glob     from 'glob';
import express  from 'express';
import sassModuleImporter from 'sass-module-importer'; // eslint-disable-line import/no-unresolved, import/extensions

import WebpackDevServer from 'webpack-dev-server';

const plugins = {
  sourcemaps:   require('gulp-sourcemaps'),
  uglify:       require('gulp-uglify'),
  rename:       require('gulp-rename'),
  eslint:       require('gulp-eslint'),
  sass:         require('gulp-sass'),
  autoprefixer: require('gulp-autoprefixer'),
  jison:        require('gulp-jison'),
  insert:       require('gulp-insert'),
  mocha:        require('gulp-mocha'),
  eol:          require('gulp-eol'),
  ignore:       require('gulp-ignore'),
  istanbul:     require('gulp-babel-istanbul'),
  cleanCss:     require('gulp-clean-css'),
  coveralls:    require('gulp-coveralls'),
};

import version from './tools/version';
log(version.copyright);

import webpackConfig from './webpack.config.babel';
import webpackDevConfig from './webpack.dev.babel';
import rollupConfig  from './rollup.config';
import packageJson   from './package';
import config from './tools/config';

//////////////////////////////////////////////////////////////////////////////

gulp.task('default', done =>
  sequence(['clean', 'lint'], 'test:cover', ['build', 'docs'], done));

//////////////////////////////////////////////////////////////////////////////

function _cleanTasks(names) {
  for (let i = 0; i < names.length; ++i) {
    const name = names[i];
    gulp.task(`clean:${name}`, () => del(config[name].dst));
  }
}

gulp.task('clean', ['clean:docs', 'clean:cover', 'clean:lib', 'clean:demo', 'clean:e2e']);

_cleanTasks([
  'docs',
  'cover',
  'lib',
  'demo',
  'e2e',
]);

//////////////////////////////////////////////////////////////////////////////

gulp.task('lint', done => sequence('lint:js', 'lint:css', done));

gulp.task('lint:js', () =>
  gulp.src(config.lint.src)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format('visualstudio', function(msg) {
      if (msg !== 'no problems') {
        log('Lint errors found\n\n' + msg + '\n');
      }
    }))
    .pipe(plugins.eslint.failAfterError()));

gulp.task('lint:js-fix', () =>
  gulp.src(config.lint.src, {base: '.'})
    .pipe(plugins.eslint({fix: true}))
    .pipe(plugins.eslint.format())
    .pipe(plugins.ignore.include(function(file) {
      return file.eslint !== null && file.eslint.fixed;
    }))
    .pipe(gulp.dest('.')));

gulp.task('lint:css');

//////////////////////////////////////////////////////////////////////////////

gulp.task('test', () =>
  gulp.src(config.test.src, {read: false})
    .pipe(plugins.mocha()));

gulp.task('test:cover', ['test:cover-hook'], (done) => {
  gulp.src(config.test.src, {read: false})
    .pipe(plugins.mocha({
      reporter: 'dot',
    }))
    .on('error', done) // otherwise, an error in tests is silently ignored ("pipes do not propagate errors")
    .pipe(plugins.istanbul.writeReports({
      dir: config.cover.dst,
      reporters: ['lcov', 'json', 'text-summary'],
      reportOpts: {dir: config.cover.dst},
    }))
    .on('end', done);
});

gulp.task('test:cover-hook', () =>
  gulp.src(config.cover.src)
    .pipe(plugins.istanbul({includeUntested: true}))
    .pipe(plugins.istanbul.hookRequire()));

gulp.task('test:coveralls', () =>
  gulp.src(config.cover.dst + 'lcov.info')
    .pipe(plugins.coveralls()));

gulp.task('test:e2e', ['clean:e2e'], () =>
  gulp.src(config.e2e.src, {read: false})
    .pipe(plugins.mocha()));

//////////////////////////////////////////////////////////////////////////////

gulp.task('build', ['build:js', 'build:css', 'build:demo', 'build:examples']);

const uglifyConfig = {
  output: {
    comments: /copyright/i,
  },
  compress: {
    drop_console: true,
    global_defs: { // eslint-disable-line camelcase
      DEBUG: false,
      PACKAGE_VERSION: version.combined,
    }
  }
};


gulp.task('build:js', () => {
  return rollup(rollupConfig).then((bundle) => {
    if (!Array.isArray(rollupConfig.output)) {
      throw new Error('Oops!');
    }
    return Promise.all(_.map(rollupConfig.output, function(target) {
      return bundle.write(target);
    }));
  }).then(function() {
    return gulp.src('build/' + packageJson.main)
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.uglify(uglifyConfig))
      .pipe(plugins.rename({suffix: '.min'}))
      .pipe(plugins.sourcemaps.write('.'))
      .pipe(gulp.dest(config.lib.dst));
  });
});

const cleanCssConfig = {
};


gulp.task('build:css', () =>
  gulp.src('src/Miew.scss')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({importer: sassModuleImporter()}).on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer())
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(config.lib.dst))
    .pipe(plugins.ignore.exclude('*.map'))
    .pipe(plugins.cleanCss(cleanCssConfig))
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(config.lib.dst)));

//////////////////////////////////////////////////////////////////////////////

gulp.task('build:demo', done =>
  webpack(webpackConfig, function(err, stats) {
    if (err) {
      throw new Error(err);
    }
    log('[webpack]', stats.toString({
      colors: true,
      assets: false,
      chunks: true,
    }));
    done();
  }));

gulp.task('build:examples', () =>
  gulp.src([
    config.examples.src + '*.js',
    config.examples.src + '*.html',
  ])
    .pipe(gulp.dest(config.examples.dst)));

//////////////////////////////////////////////////////////////////////////////

const jsdocConfig = {
  opts: {
    template: 'docs/template',
    tutorials: 'docs/tutorials',
    destination: config.docs.dst,
    private: false
  },
  templates: {
    cleverLinks: false,
    monospaceLinks: false,
    default: {
      outputSourceFiles: false,
      outputSourcePath : false,
      staticFiles: {
        include: [
          'node_modules/jsdoc/templates/default/static',
          'docs/template/static'
        ]
      }
    }
  },
  plugins: [
    'plugins/underscore',
    'plugins/markdown'
  ]
};

gulp.task('docs', (done) => {
  gulp.src([
    '../README.md',
    'Miew.js',
    'settings.js',
    // 'gfx/modes.js',
    // 'gfx/modes/Mode.js',
    // 'gfx/colorers.js',
    // 'gfx/colorers/Colorer.js',
    // 'gfx/colorers/ElementColorer.js',
    'utils/EventDispatcher.js',
    'utils/logger.js',
  ], {read: false, cwd: config.lib.src})
    .pipe(jsdoc(jsdocConfig, done));
});

//////////////////////////////////////////////////////////////////////////////

gulp.task('dist', () =>
  gulp.src([
    config.lib.dst + 'Miew.js',
    config.lib.dst + 'Miew.module.js',
    config.lib.dst + 'Miew.min.js',
    config.lib.dst + 'Miew.min.css',
  ])
    .pipe(gulp.dest('dist/')));

//////////////////////////////////////////////////////////////////////////////

gulp.task('tools:jison', () => {
  let src = 'src/**/*.jison';
  let dst = 'src/';
  if (yargs.argv.file) {
    src = yargs.argv.file;
    dst = path.dirname(src);
  }
  return gulp.src(src)
    .pipe(plugins.jison({
      moduleType: 'commonjs',
      'token-stack': true,
      //debug: true,
    }))
    .pipe(plugins.insert.wrap('/* eslint-disable */\n// DO NOT EDIT! Automatically generated from .jison\n', '\n'))
    .pipe(plugins.eol())
    .pipe(gulp.dest(dst));
});

//////////////////////////////////////////////////////////////////////////////

gulp.task('serve', ['serve:demo']);

function serve(port = 80) {
  const url = `http://localhost:${port}/`;
  const app = express();
  app.use('/', express.static('.'));
  return new Promise((resolve) => {
    app.listen(port, () => {
      resolve(url);
    });
  });
}

gulp.task('serve:demo', () =>
  serve(8001)
    .then(url => open(url + config.demo.dst)));

gulp.task('serve:webpack', () => {
  const webpackPort = 8080;
  new WebpackDevServer(webpack(webpackDevConfig), webpackDevConfig.devServer)
    .listen(webpackPort, 'localhost', (err) => {
      if (err) {
        throw new Error(err);
      }
      const uri = 'http://localhost:' + webpackPort + '/webpack-dev-server/';
      log('[WDS]', uri);
      open(uri);
    });
});

//////////////////////////////////////////////////////////////////////////////

gulp.task('show:cover', () =>
  open(config.cover.show));

gulp.task('show:docs', () =>
  open(config.docs.show));

gulp.task('show:e2e', (done) => {
  glob(config.e2e.show, (e, files) => {
    Promise.all(_.map(files, (filename) => new Promise((resolve, reject) => {
      log('open', filename);
      open(filename, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }))).then(() => done());
  });
});
