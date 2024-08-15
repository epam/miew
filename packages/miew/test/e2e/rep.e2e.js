/* global miew */

import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';
import chromeDriver from 'selenium-webdriver/chrome';

import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

import EmptyPage from './pages/empty.page';
import golden from './golden';

import goldenCfg from './golden.cfg';
import chromeOptionsArguments from './webdriver.cfg';
import defaultSettings from './defaultSettings';

chai.use(dirtyChai);

const cfg = {
  ...goldenCfg,
  title: 'Representations Tests',
  report: 'report-rep.html',
};

let driver;
let page;

function runMiewAndCheck(fn, id, opts) {
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

  // storage of Miew properties: modes, colorers, materials
  const retrieve = {};
  describe('get lists of properties from Miew', () => {
    // run script on driver that returns list of Miew prperties
    function getListFromMiew(fn, checkFn, listName, checkId) {
      return function () {
        retrieve[listName] = page.reload()
          .then(() => page.waitForMiew())
          .then(() => driver.executeScript(fn, listName))
          .then((json) => JSON.parse(json));
        return retrieve[listName].then((list) => checkFn(list, checkId));
      };
    }
    // check list on having required element
    function checkList(list, requiredId) {
      expect(list).to.be.an('Array');
      expect(list).to.be.not.empty();
      _.each(list, (entry) => {
        expect(entry).to.include.all.keys(['id', 'name']);
      });
      expect(_.map(list, (entry) => entry.id)).to.include(requiredId);
    }
    // script to run on the driver
    function getPropList(list) {
      window.miew = new window.Miew({});
      const { miew } = window;
      return miew && JSON.stringify(miew.constructor[list].all.map((entry) => ({
        id: Array.isArray(entry.id) ? entry.id[0] : entry.id,
        name: entry.prototype ? entry.prototype.name : entry.name,
      })));
    }

    [
      ['modes', 'BS'],
      ['colorers', 'EL'],
      ['materials', 'SF'],
    ].forEach(([listName, sampleId]) => {
      it(`retrieve a list of ${listName} including "${sampleId}"`, getListFromMiew(
        getPropList,
        checkList,
        listName,
        sampleId,
      ));
    });
  });

  describe('assign different combinations of modes, colorers and materials i.e.', function () {
    const protein = '1aid';
    const proteinPath = `/data/${protein}.pdb`;
    const view = '18KeRwuF6IsJGtmPAkO9IPZrOGD9xy0I/ku/APQ==';

    // runs Miew and do nothing (required for empty test)
    function run(opts) {
      window.miew = new window.Miew(opts);
      if (miew.init()) {
        miew.run();
      }
    }
    // runs Miew with specific rep mode and view
    function runRep(opts) {
      window.miew = new window.Miew({
        settings: opts.settings,
        view: opts.view,
      });
      if (miew.init()) {
        miew.run();
        miew.load(opts.load).then(() => {
          miew.applyPreset('small');
          const { rep } = opts;
          miew.rep(rep.id, rep);
        });
      }
    }

    it(`load ${protein} (filler test)`, runMiewAndCheck(run, protein, {
      load: proteinPath,
      view,
    }));

    const suite = this;
    before(() => Promise.all([retrieve.modes, retrieve.colorers]).then(([modes, colorers]) => {
      _.each(modes, (mode) => {
        _.each(colorers, (colorer) => {
          suite.addTest(it(`set ${mode.name} mode with ${colorer.name} coloring`, runMiewAndCheck(
            runRep,
            `${protein}_${mode.id}_${colorer.id}`,
            {
              load: proteinPath,
              rep: { id: 0, mode: mode.id, colorer: colorer.id },
              view,
            },
          )));
        });
      });
    }));

    // const suite = this;
    before(() => retrieve.materials.then((materials) => {
      _.each(materials, (material) => {
        suite.addTest(it(`set ${material.name} material`, runMiewAndCheck(
          runRep,
          `${protein}_QS_EL_${material.id}`,
          {
            load: proteinPath,
            rep: {
              id: 1,
              mode: 'QS',
              colorer: 'EL',
              material: material.id,
            },
            view,
          },
        )));
      });
    }));
  });

  describe('check parameters of properties', () => {
    const protein = '4V4F';
    const proteinPath = `/data/${protein}.mmtf`;

    function runReps(opts) {
      window.miew = new window.Miew({
        settings: opts.settings,
        view: '1HM0iwbqdTz5fQpPCZaEBPfgFibut+Q0/vYEbwA==',
      });
      if (miew.init()) {
        miew.run();
        miew.load(opts.load).then(() => {
          miew.applyPreset('small');
          if (!opts.reps) return;
          const { reps } = opts;
          for (let i = 0; i < reps.length; ++i) {
            miew.rep(i, reps[i]);
          }
        });
      }
    }

    it(`load ${protein} with an appropriate orientation and scale`, runMiewAndCheck(runReps, protein, {
      load: proteinPath,
    }));

    it(`render ${protein} width default colorer paramaters`, runMiewAndCheck(runReps, `${protein}_precolors`, {
      load: proteinPath,
      reps: [
        { selector: 'chain AA', mode: 'CA', colorer: 'HY' },
        { selector: 'chain AB', mode: 'BS', colorer: 'OC' },
        { selector: 'chain AD', mode: 'LC', colorer: 'TM' },
        { selector: 'chain AC', mode: 'TU', colorer: 'CO' },
        { selector: 'chain AF', mode: 'CA', colorer: 'MO' },
        { selector: 'chain AH', mode: 'CA', colorer: 'UN' },
        { selector: 'chain AI', mode: 'CA', colorer: 'SQ' },
        { selector: 'chain AJ', mode: 'BS', colorer: 'EL' },
      ],
    }));

    it(`check color parameters for ${protein}`, runMiewAndCheck(runReps, `${protein}_colors`, {
      load: proteinPath,
      reps: [
        { selector: 'chain AA', mode: 'CA', colorer: ['HY', { gradient: 'hot' }] },
        { selector: 'chain AB', mode: 'BS', colorer: ['OC', { gradient: 'blues' }] },
        { selector: 'chain AD', mode: 'LC', colorer: ['TM', { min: -5, max: 15 }] },
        { selector: 'chain AC', mode: 'TU', colorer: ['CO', { color: 0xffff00, baseColor: 0xFFC0CB, subset: 'nonpolar' }] },
        { selector: 'chain AF', mode: 'CA', colorer: ['MO', { gradient: 'reds' }] },
        { selector: 'chain AH', mode: 'CA', colorer: ['UN', { color: 0x008000 }] },
        { selector: 'chain AI', mode: 'CA', colorer: ['SQ', { gradient: 'blue-red' }] },
        { selector: 'chain AJ', mode: 'BS', colorer: ['EL', { carbon: 0x800080 }] },
      ],
    }));

    it(`render ${protein} with default mode parameters`, runMiewAndCheck(runReps, `${protein}_prepare`, {
      load: proteinPath,
      reps: [
        { selector: 'chain AA', mode: 'BS', colorer: 'EL' },
        { selector: 'chain AB', mode: 'BS', colorer: 'EL' },
        { selector: 'chain AC', mode: 'BS', colorer: 'EL' },
        { selector: 'chain AD', mode: 'BS', colorer: 'SS' },
        { selector: 'chain AE', mode: 'BS', colorer: 'EL' },
        { selector: 'chain AF', mode: 'BS', colorer: 'EL' },
        { selector: 'chain AG', mode: 'BS', colorer: 'UN' },
        { selector: 'chain AH', mode: 'BS', colorer: 'UN' },
        { selector: 'chain AI', mode: 'BS', colorer: 'EL' },
        { selector: 'chain AJ', mode: 'BS', colorer: 'EL' },
        { selector: 'chain A5', mode: 'BS', colorer: 'RT' },
      ],
    }));

    it(`check mode parameters for ${protein}`, runMiewAndCheck(runReps, `${protein}_params`, {
      load: proteinPath,
      reps: [{
        selector: 'chain AA',
        mode: ['BS', {
          atom: 0.15,
          bond: 0.4,
          space: 0.8,
          multibond: false,
        }],
        colorer: 'EL',
      },
      { selector: 'chain AB', mode: ['LC', { bond: 0.5, space: 0.6, multibond: false }], colorer: 'EL' },
      { selector: 'chain AC', mode: ['LN', { lineWidth: 2, atom: 0.5, multibond: false }], colorer: 'EL' },
      {
        selector: 'chain AD',
        mode: ['CA', {
          radius: 0.1,
          depth: 0.5,
          tension: 0.5,
          ss: { helix: { width: 2, arrow: 3 }, strand: { width: 0.5, arrow: 1 } },
        }],
        colorer: 'SS',
      },
      { selector: 'chain AE', mode: ['TU', { radius: 1, tension: 2 }], colorer: 'EL' },
      { selector: 'chain AF', mode: ['TR', { radius: 1 }], colorer: 'EL' },
      {
        selector: 'chain AG',
        mode: ['QS', {
          isoValue: 2.5,
          scale: 0.8,
          zClip: true,
          wireframe: true,
        }],
        colorer: 'UN',
      },
      { selector: 'chain AH', mode: ['SA', { probeRadius: 0.5, wireframe: true, subset: 'elem N' }], colorer: 'UN' },
      {
        selector: 'chain AI',
        mode: ['SE', {
          probeRadius: 3,
          zClip: true,
          wireframe: true,
          subset: 'elem N',
        }],
        colorer: 'EL',
      },
      { selector: 'chain AJ', mode: 'BS', colorer: 'EL' },
      {
        selector: 'chain A5',
        mode: ['TX', {
          template: 'test atom {{name}}',
          bg: 'adjust',
          fg: 'inverse',
          horizontalAlign: 'right',
        }],
        colorer: 'RT',
      }],
    }));

    describe('check combinations of selectors and modes, i. e.', function () {
      it(`check selectors for ${protein}`, runMiewAndCheck(runReps, `${protein}_selectors`, {
        load: proteinPath,
        reps: [
          { selector: 'sequence -1:71 and chain AA', mode: 'CA', colorer: 'SQ' },
          { selector: 'serial 1079:1629', mode: 'BS', colorer: 'SQ' },
          { selector: 'chain A3,A2 and nucleic', mode: 'CA', colorer: 'RT' },
          { selector: 'chain A5 and pyrimidine', mode: 'CA', colorer: 'RT' },
          { selector: 'chain A6,A7 and purine', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AG and charged', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AG and polar', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AI and nonpolar', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AD and water', mode: 'BS', colorer: 'EL' },
          { selector: 'chain AD and elem N', mode: 'BS', colorer: 'EL' },
          { selector: 'chain AD and name CA', mode: 'BS', colorer: 'EL' },
          { selector: 'chain AC and residue ALA', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AE and aromatic', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AE and basic', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AE and acidic', mode: 'BS', colorer: 'RT' },
          { selector: 'chain AJ and protein or hetatm and not water', mode: 'TU', colorer: 'SS' },
          { selector: 'chain AF and none', mode: 'BS', colorer: 'EL' },
          { selector: 'chain AK and altloc " "', mode: 'BS', colorer: 'CH' },
          { selector: 'chain AH and polarh', mode: 'BS', colorer: 'EL' },
          { selector: 'chain AH and nonpolarh', mode: 'BS', colorer: 'EL' },
        ],
      }));

      const suite = this;
      before(() => Promise.all([retrieve.modes]).then(([modes]) => {
        _.each(modes, (mode) => {
          suite.addTest(it(`check selectors for ${protein} with ${mode.name} mode`, runMiewAndCheck(runReps, `${protein}_${mode.id}`, {
            load: proteinPath,
            reps: [
              { selector: 'sequence -1:71 and chain AA', mode: mode.id, colorer: 'SQ' },
              { selector: 'serial 1079:1629', mode: mode.id, colorer: 'SQ' },
              { selector: 'chain A3,A2 and nucleic', mode: mode.id, colorer: 'RT' },
              { selector: 'chain A5 and pyrimidine', mode: mode.id, colorer: 'RT' },
              { selector: 'chain A6,A7 and purine', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AG and charged', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AG and polar', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AI and nonpolar', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AD and water', mode: mode.id, colorer: 'EL' },
              { selector: 'chain AD and elem N', mode: mode.id, colorer: 'EL' },
              { selector: 'chain AD and name CA', mode: mode.id, colorer: 'EL' },
              { selector: 'chain AC and residue ALA', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AE and aromatic', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AE and basic', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AE and acidic', mode: mode.id, colorer: 'RT' },
              { selector: 'chain AJ and protein or hetatm and not water', mode: mode.id, colorer: 'SS' },
              { selector: 'chain AF and none', mode: mode.id, colorer: 'EL' },
              { selector: 'chain AK and altloc " "', mode: mode.id, colorer: 'CH' },
              { selector: 'chain AH and polarh', mode: mode.id, colorer: 'EL' },
              { selector: 'chain AH and nonpolarh', mode: mode.id, colorer: 'EL' },
            ],
          })));
        });
      }));
    });
  });
});
