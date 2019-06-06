import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';

import chai from 'chai';
import dirtyChai from 'dirty-chai';

import EmptyPage from './pages/empty.page';
import golden from './golden';
import goldenCfg from './golden.cfg';

import testPostProcess from './gfx/postprocess';
import testShadows from './gfx/shadows';
import testStereoModes from './gfx/stereo';

chai.use(dirtyChai);

const cfg = Object.assign({}, goldenCfg, {
  title: 'Effects Tests',
  report: 'report-fxs.html',
});

let driver;
let page;

function runMiewAndCheck(fn, id, opts) {
  return function () {
    return page.reload()
      .then(() => page.waitForMiew())
      .then(() => driver.executeScript(fn, opts))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch(id, this));
  };
}

function getPropListFromMiew(fn, opts, propStorage, checkFn, listName, checkId) {
  return function () {
    propStorage[listName] = page.reload()
      .then(() => page.waitForMiew())
      .then(() => driver.executeScript(fn, opts))
      .then(json => JSON.parse(json));
    return propStorage[listName].then(list => checkFn(list, checkId));
  };
}

describe('As a third-party developer, I want to', function () {
  this.timeout(0);
  this.slow(1000);

  before(() => {
    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setIeOptions(new ieDriver.Options().requireWindowFocus(true).enablePersistentHover(false))
      .build();

    return golden.startup(driver, cfg)
      .then((url) => {
        page = new EmptyPage(driver, `${url}/examples/empty.html`);
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

  // test visual effect which involve complex render targets management
  testPostProcess(runMiewAndCheck);

  // test all combinations of modes working with shadows
  testShadows(getPropListFromMiew, runMiewAndCheck);

  // test several stereo modes
  testStereoModes(runMiewAndCheck);
});
