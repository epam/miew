import path from 'path';
import fs from 'fs';
import express from 'express';
import webdriver from 'selenium-webdriver';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

import MiewPage from './pages/miew.page';
import golden from './golden';

chai.use(dirtyChai);

const cfg = {
  url: null, // 'http://miew.opensource.epam.com/master/',
  localPath: path.resolve(__dirname, '../../build'),
  localPort: 8008,
  window: {width: 1024, height: 768},
  threshold: 1,
};

const driver = new webdriver.Builder()
  .forBrowser('chrome')
  .build();

let localhost;
let page;

function prepareBrowser(width, height) {
  const getPadding = 'return[window.outerWidth-window.innerWidth,window.outerHeight-window.innerHeight];';
  return driver.executeScript(getPadding)
    .then((pad) => driver.manage().window().setSize(width + pad[0], height + pad[1]))
    .then(() => driver.getCapabilities())
    .then((caps) => {
      const browserName = caps.get('browserName').replace(/\b\w/g, c => c.toUpperCase());
      const version = caps.get('version') || caps.get('browserVersion') || '(unknown version)';
      const platform = caps.get('platform') || caps.get('platformName') || 'unspecified platform';
      return `${browserName} ${version} for ${platform}`;
    });
}

function prepareServer(url) {
  if (url) {
    return Promise.resolve(url);
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

describe('Miew demo application', function() {

  this.timeout(0);

  before(function() {
    golden.use(driver);
    golden.report.begin(this.test.parent.title);
    golden.report.data.threshold = cfg.threshold;

    return prepareBrowser(cfg.window.width, cfg.window.height)
      .then((browser) => {
        golden.report.data.browser = browser;
        return prepareServer(cfg.url);
      })
      .then((url) => {
        page = new MiewPage(driver, url);
        return page.waitForMiew();
      })
      .then((version) => {
        golden.report.data.version = version;
      });
  });

  after(function() {
    return driver.quit().then(() => {
      if (localhost) {
        localhost.close();
      }
      golden.report.end();
    });
  });

  beforeEach(function() {
    golden.report.context.desc = this.currentTest.title;
  });

  it('shows 1CRN by default', function() {
    return page.waitUntilTitleContains('1CRN')
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1crn', this));
  });

  let retrieve = {};
  [
    ['modes', 'BS'],
    ['colorers', 'EL'],
  ].forEach(([listName, sampleId]) => {
    it(`provides a list of ${listName} including "${sampleId}"`, function() {
      retrieve[listName] = page.getValueFor(`miew.constructor.${listName}.descriptions`);
      return retrieve[listName].then((list) => {
        expect(list).to.be.an('Array');
        expect(list).to.be.not.empty();
        _.each(list, (entry) => {
          expect(entry).to.include.all.keys(['id', 'name']);
        });
        expect(_.map(list, entry => entry.id)).to.include(sampleId);
      });
    });
  });

  it('loads 1AID with the default preset', function() {
    return page.openTerminal()
      .then(() => page.runScript(`\
set interpolateViews false
load 1AID
view "18KeRwuF6IsJGtmPAkO9IPZrOGD9xy0I/ku/APQ=="`))
      .then(() => page.waitUntilTitleContains('1AID'))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1aid', this));
  });

  describe('displays all combinations of modes and colorers, i.e.', function() {

    it('applies "small" preset', function() {
      return page.runScript('preset small')
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('1aid_BS_EL', this));
    });

    const suite = this;
    before(function() {
      return Promise.all([retrieve.modes, retrieve.colorers]).then(([modes, colorers]) => {
        _.each(modes, (mode) => {
          _.each(colorers, (colorer) => {
            const command = `clear\nrep 0 m=${mode.id} c=${colorer.id}`;
            suite.addTest(it(`displays ${mode.name} with ${colorer.name} coloring`, function() {
              return page.runScript(command)
                .then(() => page.waitUntilRepresentationIs(0, mode.id, colorer.id))
                .then(() => golden.shouldMatch(`1aid_${mode.id}_${colorer.id}`, this));
            }));
          });
        });
      });
    });

  });

});
