import path from 'path';
import fs from 'fs';
import express from 'express';
import webdriver from 'selenium-webdriver';
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';

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
      }).then((url) => {
        page = new MiewPage(driver, url);
        return page.waitForMiew();
      }).then((version) => {
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

  it('shows 1CRN correctly at the start', function() {
    return page.waitUntilTitleContains('1CRN')
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1crn', this));
  });

  it('accepts a command in terminal', function() {
    const command = 'rep 0 m=BS c=EL';
    return page.openTerminal()
      .then(() => page.runScript(command))
      .then(() => page.getFirstCommand())
      .then((text) => {
        // http://www.adamkoch.com/2009/07/25/white-space-and-character-160/
        expect(text.replace(/\s+/g, ' ')).to.equal('miew> ' + command.replace(/\s+/g, ' '));
      });
  });

  it('changes representation to Balls and Sticks', function() {
    return page.waitUntilRebuildIsDone()
      .then(() => golden.shouldMatch('1crn_bs', this));
  });

  describe('for 1AID', function() {

    it('loads and sets the "small" preset', function() {
      return page.runScript(`\
set autoPreset 0
set interpolateViews false
load 1AID
view "18KeRwuF6IsJGtmPAkO9IPZrOGD9xy0I/ku/APQ=="
preset small`)
        .then(() => page.waitUntilTitleContains('1AID'))
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('1aid', this));
    });

    const modes = ['LN', 'LC', 'BS', 'VW', 'TR', 'TU', 'CA', 'QS', 'SA', 'SE', 'CS'];
    const colorers = ['EL', 'RT', 'SQ', 'CH', 'SS', 'UN', 'CO', 'CF', 'TM', 'OC', 'HY', 'MO'];

    modes.forEach((mode) => {
      colorers.forEach((colorer) => {
        const command = `rep 0 m=${mode} c=${colorer}`;
        it(`applies "${command}"`, function() {
          return page.runScript(command)
            .then(() => page.waitUntilRepresentationIs(mode, colorer))
            .then(() => golden.shouldMatch(`1aid_${mode}_${colorer}`, this));
        });
      });
    });

  });

});
