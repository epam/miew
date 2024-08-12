/* global miew */
import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';
import chromeDriver from 'selenium-webdriver/chrome';

import chai from 'chai';
import dirtyChai from 'dirty-chai';

import EmptyPage from './pages/empty.page';
import golden from './golden';
import goldenCfg from './golden.cfg';
import chromeOptionsArguments from './webdriver.cfg';
import defaultSettings from './defaultSettings';

chai.use(dirtyChai);

const cfg = {
  ...goldenCfg,
  title: 'API Tests',
  report: 'report-api.html',
};

let driver;
let page;

function describeButHideTitle(title, fn) {
  const suite = describe(title, fn);
  suite.fullTitle = function () {
    return this.parent.fullTitle();
  };
  return suite;
}

const describeEpic = describeButHideTitle;
const describeGroup = describeButHideTitle;

function api(fn, id, opts) {
  const args = {
    ...opts,
    settings: {
      ...defaultSettings,
      ...opts?.settings,
    },
  };
  return function () {
    return page.reload()
      .then(() => page.waitForMiew())
      .then(() => driver.executeScript(fn, args))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch(id, this));
  };
}

describe('As a third-party developer, I want to', function () {
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

  describeEpic('use the Miew to display a data set so that I add visualization to my app, i.e.', () => {
    describeGroup('(embed the Miew)', () => {
      it('embed the Miew in a DIV on my web page so that I show a data set there', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
        }
      }, 'empty'));
    });

    describeGroup('(load a data set)', () => {
      it('load a data set with the default appearance so that I save my time and effort on a proper setup', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
        }
      }, '1crn', { load: '../data/1CRN.pdb' }));

      it('specify initial data appearance so that it differs from defaults', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
        }
      }, '1crn_TU_SQ_LN_UN', {
        load: '../data/1CRN.pdb',
        reps: [{
          mode: 'TU',
          colorer: 'SQ',
          material: 'SF',
        }, {
          mode: 'LN',
          colorer: ['UN', { color: 0xFFFFFF }],
          material: 'SF',
        }],
      }));

      it('specify initial position and orientation so that exactly the same picture is reproduced', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
        }
      }, '1crn_view', {
        load: '../data/1CRN.pdb',
        view: '1+n4pwTVeI8Erh8LAZHS5PcVcM70wyDlAXe38Pw==',
      }));

      it('know when the loading finishes and the data are visible so that I perform the next action', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
          miew.load('../data/1CRN.pdb').then((name) => {
            miew.rep({ mode: 'TU', colorer: 'SQ', material: 'SF' });
            miew.repAdd({ mode: 'LN', colorer: ['UN', { color: 0xFFFFFF }], material: 'SF' }, name);
          });
        }
      }, '1crn_TU_SQ_LN_UN'));
    });

    describeGroup('(multiple data sets)', () => {
      it('load a data set in place of an existing one so that I don\'t unload it explicitly', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
          miew.load('../data/4FC1.mmtf');
        }
      }, '4fc1', { load: '../data/1CRN.pdb' }));

      it('add another data set after the first is loaded so that they are displayed simultaneously', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
          miew.load('../data/4FC1.mmtf');
        }
      }, '1crn_4fc1', {
        load: '../data/1CRN.pdb',
        settings: {
          use: {
            multiFile: true,
          },
        },
      }));

      it('load multiple files at once so that I don\'t need to chain loading calls');

      it('unload a data set so that I remove graphics that user does not needed anymore', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
          miew.load('../data/4FC1.mmtf').then(() => {
            miew.unload('1CRN');
          });
        }
      }, '4fc1', {
        load: '../data/1CRN.pdb',
        settings: {
          use: {
            multiFile: true,
          },
        },
      }));
    });

    describeGroup('(data categories)', () => {
      it('load a molecular data set so that I examine molecules');
      it('load a volumetric data set so that I examine raw crystallographic data');
    });

    describeGroup('(data providers)', () => {
      it('load from a remote URL so that I access both public and private resources', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
        }
      }, '1crn', { load: 'https://files.rcsb.org/view/1CRN.pdb' }));

      it('load by PDB ID so that I display common data sets from the Protein Data Bank', api((opts) => {
        window.miew = new window.Miew(opts);
        if (miew.init()) {
          miew.run();
        }
      }, '1crn', { load: '1CRN' }));

      it('load from a File object so that I handle local user files');

      it('load from an immediate text or binary buffer so that I handle data fetching myself');
    });

    describeGroup('(data formats)', () => {
      it('rely on the data format auto detection during loading so that I don\'t detect this myself');
      it('specify the data format during loading so that I override auto detection algorithm');
    });
  });

  describeEpic('control the appearance so that I change the picture in response to user actions, i.e.', () => {
  });

  describeEpic('retrieve some properties so that I process them in my own way, i.e.', () => {
  });
});
