/* global miew */
import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';
import chromeDriver from 'selenium-webdriver/chrome';
import fs from 'fs';
import express from 'express';
import path from 'path';

import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import EmptyPage from '../e2e/pages/empty.page';

chai.use(dirtyChai);

let driver = null;
let localhost = null;
let page;

const goldenFolder = './goldenFBX/';
const tmpFolder = './goldenFBX/tmp';

const testComplexesFull = [{
  name: 'Cartoon',
  prefix: 'CA',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{mode: 'CA', colorer: 'SQ', material: 'SF'}],
  },
}, {
  name: 'Licorice',
  prefix: 'LC',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'LC', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Trace',
  prefix: 'TR',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'TR', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Balls and Sticks',
  prefix: 'BS',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'BS', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Tube',
  prefix: 'TU',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'TU', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Quick Surface',
  prefix: 'QS',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'QS', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Solvent Accessible Surface',
  prefix: 'SA',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'SA', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Solvent Excluded Surface',
  prefix: 'SE',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'SE', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Contact Surface',
  prefix: 'CS',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'CS', colorer: 'SQ', material: 'SF' }],
  },
}, {
  name: 'Van der Waals',
  prefix: 'VW',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [{ mode: 'VW', colorer: 'SQ', material: 'SF' }],
  },
}];

const testComplexesFast = [{
  name: 'Lines',
  prefix: 'Line',
  pdbId: '4XN6',
  opts: {
    load: '../data/4XN6.pdb',
    reps: [
      { selector: 'serial 1:200', mode: 'CA', colorer: 'SS' },
      { selector: 'serial 201:400', mode: 'BS', colorer: 'SS' },
      { selector: 'serial 401:600', mode: 'LC', colorer: 'SS' },
      { selector: 'serial 601:800', mode: 'TU', colorer: 'SS' },
      { selector: 'serial 801:1000', mode: 'TR', colorer: 'SS' },
    ],
  },
}, {
  name: 'Surfaces',
  prefix: 'Surf',
  pdbId: '1CRN',
  opts: {
    load: '../data/1CRN.pdb',
    reps: [
      { selector: 'serial 1:60', mode: 'VW', colorer: 'SS' },
      { selector: 'serial 61:120', mode: 'QS', colorer: 'SS' },
      { selector: 'serial 121:180', mode: 'SA', colorer: 'SS' },
      { selector: 'serial 181:240', mode: 'SE', colorer: 'SS' },
      { selector: 'serial 241:300', mode: 'CS', colorer: 'SS' },
    ],
  },
}];

function _prepareBrowser(width = 1024, height = 768) {
  const getPadding = 'return[window.outerWidth-window.innerWidth,window.outerHeight-window.innerHeight];';
  return driver.executeScript(getPadding)
    .then((pad) => driver.manage().window().setRect({ width: width + pad[0], height: height + pad[1] }))
    .then(() => driver.getCapabilities())
    .then((caps) => {
      const browserName = caps.get('browserName').replace(/\b\w/g, (c) => c.toUpperCase());
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
  app.use('/data', express.static(path.resolve(__dirname, '../data')));
  return new Promise((resolve) => {
    localhost = app.listen(cfg.localPort, () => {
      resolve(`http://localhost:${cfg.localPort}`);
    });
  });
}

function startup(webDriver, cfg) {
  driver = webDriver;
  return _prepareBrowser()
    .then(() => _prepareServer(cfg))
    .then((url) => url);
}

function shutdown() {
  return driver.quit()
    .then(() => {
      driver = null;
      if (localhost) {
        localhost.close();
        localhost = null;
      }
    });
}

function fbxDownload(fn, complexInfo) {
  const pathToGolden = path.resolve(__dirname, goldenFolder, `${complexInfo.prefix}_${complexInfo.pdbId}.fbx`);
  const pathToCurrent = path.resolve(__dirname, tmpFolder, `${complexInfo.pdbId}.fbx`);

  return function () {
    return page.reload()
      .then(() => page.waitForMiew())
      .then(() => driver.executeScript(fn, complexInfo))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => driver.executeScript(() => { miew.save({ fileType: 'fbx' }); }))
      .then(() => page.waitForExport(pathToCurrent))
      .then(() => {
        let goldenFBXData = fs.readFileSync(pathToGolden, 'utf8');
        let currentFBXData = fs.readFileSync(pathToCurrent, 'utf8');
        const usefulInfoGoldenInd = goldenFBXData.indexOf('Object properties');
        const usefulInfoCurrentInd = currentFBXData.indexOf('Object properties');
        goldenFBXData = goldenFBXData.slice(usefulInfoGoldenInd);
        currentFBXData = currentFBXData.slice(usefulInfoCurrentInd);
        fs.unlinkSync(pathToCurrent); // deleting tmp file

        expect(currentFBXData).equal(goldenFBXData);
      });
  };
}

describe('The FBX exporter', function () {
  this.timeout(0);
  this.slow(1000);

  const cfg = {
    title: 'FBX Tests',
    report: 'report-fbxExporter.html',
    url: null, // 'https://miew.opensource.epam.com/master',
    localPath: path.resolve(__dirname, '../../build'),
    localPort: 8008,
    threshold: 0,
  };

  before(() => {
    const chromeOptions = new chromeDriver.Options();
    const tmpDirectory = path.resolve(__dirname, tmpFolder);
    chromeOptions.addArguments(['--disable-gpu']);// '--headless'
    chromeOptions.setUserPreferences({ 'download.default_directory': tmpDirectory });

    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setIeOptions(new ieDriver.Options().requireWindowFocus(true).enablePersistentHover(false))
      .setChromeOptions(chromeOptions)
      .build();

    // cleaning tmp folder
    fs.readdir(tmpDirectory, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlinkSync(path.join(tmpDirectory, file));
      }
    });

    return startup(driver, cfg)
      .then((url) => {
        page = new EmptyPage(driver, `${url}/examples/empty.html`);
        return page.waitForMiew();
      });
  });

  after(() => shutdown());
  const testComplexes = testComplexesFast; // testComplexesFull
  for (let i = 0, n = testComplexes.length; i < n; i++) {
    it(testComplexes[i].name, fbxDownload((complex) => {
      window.miew = new window.Miew(complex.opts);
      if (miew.init()) {
        miew.run();
      }
    },
    testComplexes[i]));
  }
});
