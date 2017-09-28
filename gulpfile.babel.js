import gulp     from 'gulp';
import del      from 'del';
import sequence from 'run-sequence';
import yargs    from 'yargs';
import path     from 'path';
import util     from 'gulp-util';
import ftp      from 'vinyl-ftp';
import url      from 'url';
import _        from 'lodash';
import jsdoc    from 'gulp-jsdoc3';
import open     from 'open';
import webpack  from 'webpack';
import {rollup} from 'rollup';
import sassModuleImporter from 'sass-module-importer'; // eslint-disable-line import/no-unresolved, import/extensions
import rollupPluginReplace from 'rollup-plugin-replace';

import WebpackDevServer from 'webpack-dev-server';

const plugins = {
  sourcemaps:   require('gulp-sourcemaps'),
  uglify:       require('gulp-uglify'),
  rename:       require('gulp-rename'),
  eslint:       require('gulp-eslint'),
  sass:         require('gulp-sass'),
  webserver:    require('gulp-webserver'),
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
util.log(version.copyright);

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

gulp.task('clean', ['clean:docs', 'clean:cover', 'clean:lib', 'clean:demo']);

_cleanTasks([
  'docs',
  'cover',
  'lib',
  'demo'
]);

//////////////////////////////////////////////////////////////////////////////

gulp.task('lint', done => sequence('lint:js', 'lint:css', done));

gulp.task('lint:js', () =>
  gulp.src(config.lint.src)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format('visualstudio', function(msg) {
      if (msg !== 'no problems') {
        util.log(util.colors.red('Lint errors found:\n\n') + msg);
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

gulp.task('test:cover', ['test:cover-hook'], () =>
  gulp.src(config.test.src, {read: false})
    .pipe(plugins.mocha({
      reporter: 'dot',
    }))
    .pipe(plugins.istanbul.writeReports({
      dir: config.cover.dst,
      reporters: ['lcov', 'json', 'text-summary'],
      reportOpts: {dir: config.cover.dst},
    })));

gulp.task('test:cover-hook', () =>
  gulp.src(config.cover.src)
    .pipe(plugins.istanbul({includeUntested: true}))
    .pipe(plugins.istanbul.hookRequire()));

gulp.task('test:coveralls', () =>
  gulp.src(config.cover.dst + 'lcov.info')
    .pipe(plugins.coveralls()));

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
  const rollupCfg = _.merge(rollupConfig, {
    plugins: [
      rollupPluginReplace({
        PACKAGE_VERSION: JSON.stringify(version.combined),
        DEBUG: false,
      }),
    ]
  });
  return rollup(rollupCfg).then((bundle) => {
    if (Array.isArray(rollupCfg.output)) {
      const multi = _.map(rollupCfg.output, function(target) {
        return bundle.write(_.assign({}, rollupCfg, target));
      });
      return Promise.all(multi);
    }
    throw new Error('Oops!');
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
      throw new util.PluginError('webpack', err);
    }
    util.log('[webpack]', stats.toString({
      colors: true,
      assets: false,
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

gulp.task('tools:sass', () => {
  const src = `${config.demo.src}styles/`;
  const dst = `${config.demo.src}styles/`; // sic! dst == src
  return gulp.src(['main.scss'], {cwd: src})
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass().on('error', plugins.sass.logError))
    .pipe(plugins.autoprefixer())
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(plugins.eol())
    .pipe(gulp.dest(dst));
});

//////////////////////////////////////////////////////////////////////////////

function refToPath(ref) {
  if (ref === 'develop') {
    ref = 'dev';
  }
  if (ref) {
    return ref.split('/')
      .filter((part) => part && part !== '.' && part !== '..')
      .map(encodeURIComponent).join('/');
  }
  return 'default';
}

function remoteAccess() {
  if (!yargs.argv.server) {
    util.log('Skipping deployment,', util.colors.red('--server is not specified.'));
    return null;
  }

  const uo = url.parse(yargs.argv.server);
  const auth = (uo.auth || 'anonymous:anonymous@').split(':');

  const ref = process.env.CI_COMMIT_REF_NAME || process.env.CI_BUILD_REF_NAME;
  const subdir = refToPath(ref);
  if (subdir) {
    util.log('Job reference name is ' + util.colors.magenta(JSON.stringify(ref)) +
      ', using ' + util.colors.magenta(JSON.stringify(subdir)) + ' subdirectory for deployment.');
    uo.pathname = uo.pathname + '/' + subdir;
  }

  const conn = ftp.create({
    host:     uo.host,
    user:     auth[0],
    password: auth[1],
    log:      util.log,
    timeOffset: yargs.argv.serverTime ? yargs.argv.serverTime : 0,
  });
  return {conn, path: uo.pathname};
}

gulp.task('deploy', () => {
  const remote = remoteAccess();
  if (!remote) {
    return util.noop();
  }

  util.log('Will deploy to', util.colors.magenta(remote.path));
  return gulp.src(['**/*'], {base: config.demo.dst, cwd: config.demo.dst, buffer: false})
  // .pipe(conn.newer(uo.pathname)) // only upload newer files // FIXME: Doesn't work!
    .pipe(remote.conn.dest(remote.path));
});

gulp.task('deploy:docs', () => {
  const remote = remoteAccess();
  if (!remote) {
    return util.noop();
  }

  util.log('Will deploy to', util.colors.magenta(remote.path));
  return gulp.src(['**/*'], {base: config.docs.dst, cwd: config.docs.dst, buffer: false})
  // .pipe(conn.newer(uo.pathname)) // only upload newer files // FIXME: Doesn't work!
    .pipe(remote.conn.dest(remote.path + '/docs/'));
});

//////////////////////////////////////////////////////////////////////////////

gulp.task('build+serve', done => sequence('build', 'serve:demo', done));

gulp.task('serve', ['serve:dev']);

gulp.task('serve:demo', () =>
  gulp.src('.')
    .pipe(plugins.webserver({
      port: 8001,
      open: config.demo.dst
    })));

gulp.task('serve:docs', () =>
  gulp.src('.')
    .pipe(plugins.webserver({
      port: 8002,
      open: config.docs.dst
    })));

const webpackPort = 8080;

gulp.task('serve:webpack', () => {
  new WebpackDevServer(webpack(webpackDevConfig), webpackDevConfig.devServer)
    .listen(webpackPort, 'localhost', (err) => {
      if (err) {
        throw new util.PluginError('[WDS]', err);
      }
      const uri = 'http://localhost:' + webpackPort + '/webpack-dev-server/';
      util.log('[WDS]', uri);
      open(uri);
    });
});

//////////////////////////////////////////////////////////////////////////////

gulp.task('show:cover', () =>
  open(config.cover.dst + 'lcov-report/index.html'));

gulp.task('show:docs', () =>
  open(config.docs.dst + 'index.html'));
