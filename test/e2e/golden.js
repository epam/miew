import path from 'path';
import fs from 'fs';
import resemble from 'node-resemble-js';
import Handlebars from 'handlebars';
import {expect} from 'chai';

resemble.outputSettings({
  transparency: 0.25
});

let driver = null;

function use(drv) {
  driver = drv;
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
  },

  getExpectedPath: (id) => path.join(report.path.golden, `${id}.png`),
  getActualPath: (id) => path.join(report.path.mismatch, `${id}.png`),
  getDifferencePath: (id) => path.join(report.path.mismatch, `${id}.diff.png`),

  getHtmlPath(filename) {
    if (!fs.existsSync(filename)) {
      filename = report.path.missing;
    }
    const relative = path.relative(path.dirname(report.path.html), filename);
    return relative.replace(/\\/g, '/');
  },

  begin(title) {
    const source = fs.readFileSync(report.path.template, 'utf-8');
    this.template = Handlebars.compile(source);
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
      rowClass: mismatch > this.data.threshold ? 'fail' : 'pass',
    });
  },

  end() {
    const result = this.template(this.data);
    fs.writeFileSync(report.path.html, result);
  },
};

function matchAsPromised(first, second) {
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

  return driver.executeScript(() => window.MIEWS[0].screenshot(128))
    .then((dataUrl) => {
      expect(dataUrl.slice(0, prefixLength)).to.equal(prefix);
      const shot = Buffer.from(dataUrl.slice(prefixLength), 'base64');
      return matchAsPromised(shot, report.getExpectedPath(id))
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
  use,
  shouldMatch,
};
