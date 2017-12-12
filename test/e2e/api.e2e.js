import webdriver from 'selenium-webdriver';
import firefoxDriver from 'selenium-webdriver/firefox';
import operaDriver from 'selenium-webdriver/opera';
import ieDriver from 'selenium-webdriver/ie';
import chromeDriver from 'selenium-webdriver/chrome';
import edgeDriver from 'selenium-webdriver/edge';
import EmptyPage from './pages/empty.page';
import golden from './golden';
import goldenCfg from './golden.cfg';

const cfg = Object.assign({}, goldenCfg, {
  title: 'API Tests',
  report: 'report-api.html',
});

let driver;
let page;

function describeButHideTitle(title, fn) {
  const suite = describe(title, fn);
  suite.fullTitle = function() {
    return this.parent.fullTitle();
  };
  return suite;
}

const describeEpic = describeButHideTitle;
const describeGroup = describeButHideTitle;

function api(fn, id) {
  return function() {
    return page.reload()
      .then(() => page.waitForMiew())
      .then(() => driver.executeScript(fn))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch(id, this));
  };
}

describe('As a third-party developer, I want to', function() {

  this.timeout(0);
  this.slow(1000);

  //be aware to use 'MicrosoftEdge' instead of 'edge' to use it
  before(function() {
    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setFirefoxOptions(new firefoxDriver.Options())
      .setChromeOptions(new chromeDriver.Options())
      .setIeOptions(new ieDriver.Options().requireWindowFocus(true).enablePersistentHover(false))
      .setEdgeOptions(new edgeDriver.Options())
      .setOperaOptions(new operaDriver.Options()
        .setOperaBinaryPath('C:\\...\\opera.exe'))
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

  after(function() {
    return golden.shutdown();
  });

  beforeEach(function() {
    golden.report.context.desc = this.currentTest.title;
  });

  describeEpic('use the Miew to display a data set so that I add visualization to my app, i.e.', function() {

    describeGroup('(embed the Miew)', function() {

      it('embed the Miew in a DIV on my web page so that I show a data set there', api(() => {
        window.miew = new window.Miew();
        if (miew.init()) {
          miew.run();
        }
      }, 'empty'));

    });

    describeGroup('(load a data set)', function() {

      it('load a data set with the default appearance so that I save my time and effort on a proper setup', api(() => {
        window.miew = new window.Miew({load: '../data/1CRN.pdb'});
        if (miew.init()) {
          miew.run();
        }
      }, '1crn'));

      it('specify initial data appearance so that it differs from defaults', api(() => {
        window.miew = new window.Miew({
          load: '../data/1CRN.pdb',
          reps: [{
            mode: 'TU',
            colorer: 'SQ',
          }, {
            mode: 'LN',
            colorer: ['UN', {color: 0xFFFFFF}],
          }],
        });
        if (miew.init()) {
          miew.run();
        }
      }, '1crn_TU_SQ_LN_UN'));


      it('specify initial position and orientation so that exactly the same picture is reproduced', api(() => {
        window.miew = new window.Miew({
          settings: {interpolateViews: false},
          load: '../data/1CRN.pdb',
          view: '1+n4pwTVeI8Erh8LAZHS5PcVcM70wyDlAXe38Pw=='
        });
        if (miew.init()) {
          miew.run();
        }
      }, '1crn_view'));

      it('know when the loading finishes and the data are visible so that I perform the next action', api(() => {
        window.miew = new window.Miew();
        if (miew.init()) {
          miew.run();
          miew.load('../data/1CRN.pdb').then((name) => {
            miew.rep({mode: 'TU', colorer: 'SQ'});
            miew.repAdd({mode: 'LN', colorer: ['UN', {color: 0xFFFFFF}]}, name);
          });
        }
      }, '1crn_TU_SQ_LN_UN'));
    });

    describeGroup('(multiple data sets)', function() {

      it('load a data set in place of an existing one so that I don\'t unload it explicitly', api(() => {
        window.miew = new window.Miew({load: '../data/1CRN.pdb'});
        if (miew.init()) {
          miew.run();
          miew.load('../data/4FC1.mmtf');
        }
      }, '4fc1'));

      it('add another data set after the first is loaded so that they are displayed simultaneously', api(() => {
        window.miew = new window.Miew({
          load: '../data/1CRN.pdb',
          settings: {
            use: {
              multiFile: true,
            },
          },
        });
        if (miew.init()) {
          miew.run();
          miew.load('../data/4FC1.mmtf');
        }
      }, '1crn_4fc1'));

      it('load multiple files at once so that I don\'t need to chain loading calls');

      it('unload a data set so that I remove graphics that user does not needed anymore', api(() => {
        window.miew = new window.Miew({
          load: '../data/1CRN.pdb',
          settings: {
            use: {
              multiFile: true,
            },
          },
        });
        if (miew.init()) {
          miew.run();
          miew.load('../data/4FC1.mmtf').then(() => {
            miew.unload('1CRN');
          });
        }
      }, '4fc1'));

    });

    describeGroup('(data categories)', function() {

      it('load a molecular data set so that I examine molecules');
      it('load a volumetric data set so that I examine raw crystallographic data');

    });

    describeGroup('(data providers)', function() {

      it('load from a remote URL so that I access both public and private resources', api(() => {
        window.miew = new window.Miew({load: 'https://files.rcsb.org/view/1CRN.pdb'});
        if (miew.init()) {
          miew.run();
        }
      }, '1crn'));

      it('load by PDB ID so that I display common data sets from the Protein Data Bank', api(() => {
        window.miew = new window.Miew({load: '1CRN'});
        if (miew.init()) {
          miew.run();
        }
      }, '1crn'));

      it('load from a File object so that I handle local user files');

      it('load from an immediate text or binary buffer so that I handle data fetching myself');

    });

    describeGroup('(data formats)', function() {

      it('rely on the data format auto detection during loading so that I don\'t detect this myself');
      it('specify the data format during loading so that I override auto detection algorithm');

    });

  });

  describeEpic('control the appearance so that I change the picture in response to user actions, i.e.', function() {
  });

  describeEpic('retrieve some properties so that I process them in my own way, i.e.', function() {
  });

});
