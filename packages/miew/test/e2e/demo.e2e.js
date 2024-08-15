import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';
import chromeDriver from 'selenium-webdriver/chrome';

import MiewPage from './pages/miew.page';
import golden from './golden';

import goldenCfg from './golden.cfg';
import chromeOptionsArguments from './webdriver.cfg';

const cfg = {
  ...goldenCfg,
  title: 'Demo Tests',
  report: 'report-demo.html',
};

let driver;
let page;

describe('As a power user, I want to', function () {
  this.timeout(0);
  this.slow(2000);

  before(() => {
    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setIeOptions(new ieDriver.Options().requireWindowFocus(true).enablePersistentHover(false))
      .setChromeOptions(new chromeDriver.Options().addArguments(chromeOptionsArguments))
      .build();

    return golden.startup(driver, cfg)
      .then((url) => {
        page = new MiewPage(driver, url);
        return page.waitForMiew();
      })
      .then((version) => {
        golden.report.data.version = version;
      });
  });

  after(() => golden.shutdown());

  beforeEach(function () {
    golden.report.context.desc = this.currentTest.title;
  });

  it('see 1CRN by default in demo', function () {
    return page.waitUntilTitleContains('1CRN')
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1crn_demo', this));
  });

  it('load 1AID with an appropriate orientation and scale using Terminal', function () {
    return page.openTerminal()
      .then(() => page.runScript(`\
set interpolateViews false
load 1AID
view "18KeRwuF6IsJGtmPAkO9IPZrOGD9xy0I/ku/APQ=="`))
      .then(() => page.waitUntilTitleContains('1AID'))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1aid_demo', this));
  });
});
