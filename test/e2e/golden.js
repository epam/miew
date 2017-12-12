import path from 'path';
import fs from 'fs';
import express from 'express';
import resemble from 'node-resemble-js';
import Handlebars from 'handlebars';
import {expect} from 'chai';

resemble.outputSettings({
  transparency: 0.25
});

let driver = null;
let localhost = null;

function _zeroes(num, len) {
  return ('000000' + num).slice(-len);
}

const report = {
  path: {
    golden: path.resolve(__dirname, 'golden/'),
    mismatch: path.resolve(__dirname, 'mismatch/'),
    missing: path.resolve(__dirname, 'golden/missing.svg'),
    template: path.resolve(__dirname, 'mismatch/index.hbs'),
    html: path.resolve(__dirname, 'mismatch/index.html'),
  },

  context: {
    desc: 'N/A',
    index: 0,
  },

  getExpectedPath: (id) => path.join(report.path.golden, `${id}.png`),
  getActualPath: (id) => path.join(report.path.mismatch, `${_zeroes(report.context.index, 3)}_${id}.png`),
  getDifferencePath: (id) => path.join(report.path.mismatch, `${_zeroes(report.context.index, 3)}_${id}.diff.png`),

  getHtmlPath(filename) {
    const relative = path.relative(path.dirname(report.path.html), filename);
    return relative.replace(/\\/g, '/');
  },

  begin(title) {
    this.data = {
      title,
      version: 'N/A',
      browser: 'N/A',
      url: 'N/A',
      date: new Date(),
      threshold: 0,
      entries: [],
    };
  },

  add(id, shot, diff) {
    ++report.context.index;
    fs.writeFileSync(report.getActualPath(id), shot);
    let mismatch = 100;
    if (diff) {
      mismatch = parseFloat(diff.misMatchPercentage);
      diff.getDiffImage().pack().pipe(fs.createWriteStream(report.getDifferencePath(id)));
    }
    this.data.entries.push({
      id,
      desc: this.context.desc,
      expectedImage: report.getHtmlPath(diff ? report.getExpectedPath(id) : report.path.missing),
      actualImage: report.getHtmlPath(report.getActualPath(id)),
      differenceImage: report.getHtmlPath(diff ? report.getDifferencePath(id) : report.path.missing),
      mismatch,
      rowClass: !diff ? 'skip' : (mismatch > this.data.threshold ? 'fail' : 'pass'),
    });
  },

  end() {
    const source = fs.readFileSync(report.path.template, 'utf-8');
    const template = Handlebars.compile(source);
    const result = template(this.data);
    fs.writeFileSync(report.path.html, result);
  },
};

function _prepareBrowser(width = 1024, height = 768) {
  const getPadding = 'return[window.outerWidth-window.innerWidth,window.outerHeight-window.innerHeight];';
  return driver.executeScript(getPadding)
    //need to comment the string below, when using Opera browser
    .then((pad) => driver.manage().window().setSize(width + pad[0], height + pad[1]))
    .then(() => driver.getCapabilities())
    .then((caps) => {
      const browserName = caps.get('browserName').replace(/\b\w/g, c => c.toUpperCase());
      const version = caps.get('version') || caps.get('browserVersion') || '(unknown version)';
      const platform = caps.get('platform') || caps.get('platformName') || 'unspecified platform';
      return `${browserName} ${version} for ${platform}`;
    });
}

function _prepareServer(cfg) {
  if (cfg.url) {
    return Promise.resolve(cfg.url);
  }
  if (!fs.existsSync(path.join(cfg.localPath, 'index.html'))) {
    throw new URIError(`App is not found in ${cfg.localPath}, did you forget to build it?`);
  }
  const app = express();
  app.use('/', express.static(cfg.localPath));
  return new Promise((resolve) => {
    localhost = app.listen(cfg.localPort, () => {
      resolve(`http://localhost:${cfg.localPort}`);
    });
  });
}

function startup(webDriver, cfg) {
  driver = webDriver;
  report.begin(cfg.title);
  report.path.html = path.join(report.path.mismatch, cfg.report);
  report.data.threshold = cfg.threshold;

  return _prepareBrowser()
    .then((browser) => {
      report.data.browser = browser;
      return _prepareServer(cfg);
    })
    .then((url) => {
      report.data.url = url;
      return url;
    });
}

function shutdown() {
  return driver.quit()
    .then(() => {
      driver = null;
      if (localhost) {
        localhost.close();
        localhost = null;
      }
      report.end();
    });
}

function _matchAsPromised(first, second) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(second)) {
        reject(new URIError('Golden image not found: ' + path.basename(second)));
      } else {
        resemble(first)
          .compareTo(second)
          .ignoreNothing()
          .onComplete((diff) => resolve(diff));
      }
    } catch (err) {
      reject(err);
    }
  });
}

function shouldMatch(id, test) {
  const prefix = 'data:image/png;base64,';
  const prefixLength = prefix.length;
  return driver.executeScript(() => window.miew && window.miew.screenshot(128))
    .then((dataUrl) => {
      expect(dataUrl && dataUrl.slice(0, prefixLength)).to.equal(prefix);
      const shot = Buffer.from(dataUrl.slice(prefixLength), 'base64');
      return _matchAsPromised(shot, report.getExpectedPath(id))
        .then((diff) => {
          report.add(id, shot, diff);
          expect(diff.isSameDimensions).to.be.true();
          expect(Number.parseFloat(diff.misMatchPercentage)).to.be.not.greaterThan(report.data.threshold);
        })
        .catch((err) => {
          // "Why doesn't instanceof work on instances of Error subclasses under babel-node?"
          // https://stackoverflow.com/a/33877501/1852238
          if (err instanceof URIError) {
            report.add(id, shot, null);
            test.skip();
          }
          return Promise.reject(err);
        });
    });
}

export default {
  report,
  startup,
  shutdown,
  shouldMatch,
};
