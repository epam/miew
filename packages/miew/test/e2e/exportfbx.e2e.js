/* global miew */
import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';
import chromeDriver from 'selenium-webdriver/chrome';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import golden from './golden';

import EmptyPage from './pages/empty.page';
import chromeOptionsArguments from './webdriver.cfg';

chai.use(dirtyChai);

let driver = null;
let page;

const tmpFolder = './mismatch';

/*
    Object testComplexesSets has two arrays with test settings description;
    By default it is run only complexesFast (which has only two tests);
    If complexesFast test fails to clarify the reason complexesFull test set should be run
*/
const testComplexesSets = {
  complexesFull:
  [{
    name: 'Cartoon',
    pdbId: '1CRN',
    checksum: '3897699624fad1e068ede2f89504e937',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'CA', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Licorice',
    pdbId: '1CRN',
    checksum: '1bdece9a1f2e87cd0ee8e606a5c3ca6d',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'LC', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Trace',
    pdbId: '1CRN',
    checksum: '49231a8faf49507d77119b99f0ad1193',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'TR', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Balls and Sticks',
    pdbId: '1CRN',
    checksum: '497777cffd9c9f0bb71bb49b4bad7bed',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'BS', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Tube',
    pdbId: '1CRN',
    checksum: '11582fdc073fc96cabdfa1fda9604d86',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'TU', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Quick Surface',
    pdbId: '1CRN',
    checksum: '1de2ae17937ed4db40a80f4e86735580',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'QS', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Solvent Accessible Surface',
    pdbId: '1CRN',
    checksum: 'ce44729de7bfaf17c87061f7e905903d',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'SA', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Solvent Excluded Surface',
    pdbId: '1CRN',
    checksum: '26aa80520ebe4ccbb802822cddc87ffc',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'SE', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Contact Surface',
    pdbId: '1CRN',
    checksum: 'bac8d047b3240d836f739456bdfb7679',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'CS', colorer: 'SQ', material: 'SF' }],
    },
  }, {
    name: 'Van der Waals',
    pdbId: '1CRN',
    checksum: '602e6271b10019486068c5107210287b',
    opts: {
      load: '../data/1CRN.pdb',
      reps: [{ mode: 'VW', colorer: 'SQ', material: 'SF' }],
    },
  }],

  complexesFast:
  [{
    name: 'Non-surfaces',
    pdbId: '4XN6',
    checksum: 'b94d46b3528a9e350fa2b2a1bbfbd15f',
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
    pdbId: '1CRN',
    checksum: 'e2f57ddb3b409cde32669cdd74b746cf',
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
  }],
};

function cleanFolderFromFBX(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      if (file.split('.')[1] === 'fbx') fs.unlinkSync(path.join(directory, file));
    }
  });
}

function fbxDownload(fn, complexInfo) {
  const pathToDownloadFile = path.resolve(__dirname, tmpFolder, `${complexInfo.pdbId}.fbx`);

  return function () {
    return page.reload()
      .then(() => cleanFolderFromFBX(path.resolve(__dirname, tmpFolder)))
      .then(() => page.waitForMiew())
      .then(() => driver.executeScript(fn, complexInfo))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => driver.executeScript(() => { miew.save({ fileType: 'fbx' }); }))
      .then(() => page.waitForExport(pathToDownloadFile))
      .then(() => {
        let currentFBXData = fs.readFileSync(pathToDownloadFile, 'utf8');
        const usefulInfoCurrentInd = currentFBXData.indexOf('Object properties');
        currentFBXData = currentFBXData.slice(usefulInfoCurrentInd);
        const md5sum = crypto.createHash('md5').update(currentFBXData, 'utf8').digest('hex');

        golden.report.data.entries.push({
          testName: `"${complexInfo.name}"`,
          rowClass: (complexInfo.checksum === md5sum) ? 'pass' : 'fail',
        });
        expect(complexInfo.checksum).equal(md5sum);
      });
  };
}

describe.skip('As a third-party developer, I want to ', function () {
  this.timeout(0);
  this.slow(2000);

  const cfg = {
    title: 'FBX Tests',
    report: 'report-fbx.html',
    url: null, // 'https://miew.opensource.epam.com/master',
    localPath: path.resolve(__dirname, '../../build'),
    localPort: 8008,
    threshold: 0,
  };

  before(() => {
    const chromeOptions = new chromeDriver.Options();
    const tmpDirectory = path.resolve(__dirname, tmpFolder);
    chromeOptions.addArguments(chromeOptionsArguments);
    chromeOptions.setUserPreferences({ 'download.default_directory': tmpDirectory });

    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setIeOptions(new ieDriver.Options().requireWindowFocus(true).enablePersistentHover(false))
      .setChromeOptions(chromeOptions)
      .build();

    golden.report.path.template = path.resolve(__dirname, 'mismatch/index_fbx.hbs');
    return golden.startup(driver, cfg)
      .then((url) => {
        page = new EmptyPage(driver, `${url}/examples/empty.html`);
        return page.waitForMiew();
      })
      .then((version) => {
        golden.report.data.version = version;
      });
  });

  after(() => golden.shutdown()
    .then(() => {
      golden.report.path.template = path.resolve(__dirname, 'mismatch/index.hbs');
      cleanFolderFromFBX(path.resolve(__dirname, tmpFolder));
    }));

  const testComplexes = testComplexesSets.complexesFast;
  for (let i = 0, n = testComplexes.length; i < n; i++) {
    it(`export fbx from ${testComplexes[i].name} modes`, fbxDownload(
      (complex) => {
        window.miew = new window.Miew(complex.opts);
        if (miew.init()) {
          miew.run();
        }
      },
      testComplexes[i],
    ));
  }
});
