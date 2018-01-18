import webdriver from 'selenium-webdriver';
import ieDriver from 'selenium-webdriver/ie';

import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import _ from 'lodash';

import MiewPage from './pages/miew.page';
import golden from './golden';

chai.use(dirtyChai);

import goldenCfg from './golden.cfg';

const cfg = Object.assign({}, goldenCfg, {
  title: 'Representations Tests',
  report: 'report-rep.html',
});

let driver;
let page;

describe('As a power user, I want to', function() {

  this.timeout(0);
  this.slow(1000);

  before(function() {
    driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setIeOptions(new ieDriver.Options().requireWindowFocus(true).enablePersistentHover(false))
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

  after(function() {
    return golden.shutdown();
  });

  beforeEach(function() {
    golden.report.context.desc = this.currentTest.title;
  });

  it('see 1CRN by default', function() {
    return page.waitUntilTitleContains('1CRN')
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1crn', this));
  });

  let retrieve = {};
  [
    ['modes', 'BS'],
    ['colorers', 'EL'],
    ['materials', 'SF'],
  ].forEach(([listName, sampleId]) => {
    it(`retrieve a list of ${listName} including "${sampleId}"`, function() {
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

  it('load 1AID with an appropriate orientation and scale', function() {
    return page.openTerminal()
      .then(() => page.runScript(`\
set interpolateViews false
load 1AID
view "18KeRwuF6IsJGtmPAkO9IPZrOGD9xy0I/ku/APQ=="`))
      .then(() => page.waitUntilTitleContains('1AID'))
      .then(() => page.waitUntilRebuildIsDone())
      .then(() => golden.shouldMatch('1aid', this));
  });

  describe('assign all combinations of modes and colorers via terminal, i.e.', function() {

    it('apply "small" preset', function() {
      return page.runScript('preset small')
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('1aid_BS_EL', this));
    });

    const suite = this;
    before(function() {
      return Promise.all([retrieve.modes, retrieve.colorers]).then(([modes, colorers]) => {
        _.each(modes, (mode) => {
          _.each(colorers, (colorer) => {
            suite.addTest(it(`set ${mode.name} mode with ${colorer.name} coloring`, function() {
              return page.runScript(`clear\nrep 0 m=${mode.id} c=${colorer.id}`)
                .then(() => page.waitUntilRepresentationIs(0, mode.id, colorer.id))
                .then(() => golden.shouldMatch(`1aid_${mode.id}_${colorer.id}`, this));
            }));
          });
        });
      });
    });

  });

  describe('assign all materials via terminal, i.e.', function() {

    it('apply "small" preset', function() {
      return page.runScript('preset small')
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('1aid_BS_EL', this));
    });

    it('add a surface', function() {
      return page.runScript('add m=QS')
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('1aid_QS_EL', this));
    });

    const suite = this;
    before(function() {
      return retrieve.materials.then((materials) => {
        _.each(materials, (material) => {
          suite.addTest(it(`set ${material.name} material`, function() {
            return page.runScript(`clear\nrep 1 m=QS mt=${material.id}`)
              .then(() => page.waitUntilRepresentationIs(1, 'QS', 'EL'))
              .then(() => golden.shouldMatch(`1aid_QS_EL_${material.id}`, this));
          }));
        });
      });
    });

  });

  describe('check correct color parameters work', function() {

    it('load 4V4F with an appropriate orientation and scale', function() {
      return page.runScript(`\
clear
load "mmtf:4v4f"
preset small
view "1HM0iwbqdTz5fQpPCZaEBPfgFibut+Q0/vYEbwA=="`)
        .then(() => page.waitUntilTitleContains('4V4F'))
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('4v4f', this));
    });

    it('prepare the molecule', function() {
      return page.runScript(`\
set autobuild false
rep 0 s = "chain AA" m = "CA" c = "HY" mt = "SF"
rep 1 s = "chain AB" m = "BS" c = "OC" mt = "SF"
rep 2 s = "chain AD" m = "LC" c = "TM" mt = "SF"
rep 3 s = "chain AC" m = "TU" c = "CO" mt = "SF"
rep 4 s = "chain AF" m = "CA" c = "MO" mt = "SF"
rep 5 s = "chain AH" m = "CA" c = "UN" mt = "SF"
rep 6 s = "chain AI" m = "CA" c = "SQ" mt = "SF"
rep 7 s = "chain AJ" m = "BS" c = "EL" mt = "SF"
build all`)
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('4v4f_precolors', this));
    });

    it('change color parameters', function() {
      return page.runScript(`\
set autobuild false
rep 0 c=HY gradient = "hot"
rep 1 c=OC gradient = "blues"
rep 2 c=TM min = -5 max = 15
rep 3 c=CO color = 16776960 baseColor = "pink" subset = "nonpolar"
rep 4 c=MO gradient = "reds"
rep 5 c=UN color = "green"
rep 6 c=SQ gradient = "blue-red"
rep 7 c=EL carbon = "purple"
build all`)
        .then(() => page.waitUntilRepresentationIs(7, 'BS', 'EL'))
        .then(() => golden.shouldMatch('4v4f_colors', this));
    });

  });

  describe('check correct mode parameters work', function() {

    it('prepare the molecule', function() {
      return page.runScript(`\
set autobuild false
rep 0 s = "chain AA" m = "BS" c = "EL"
rep 1 s = "chain AB" m = "BS" c = "EL"
rep 2 s = "chain AC" m = "BS" c = "EL"
rep 3 s = "chain AD" m = "BS" c = "SS"
rep 4 s = "chain AE" m = "BS" c = "EL"
rep 5 s = "chain AF" m = "BS" c = "EL"
rep 6 s = "chain AG" m = "BS" c = "UN"
rep 7 s = "chain AH" m = "BS" c = "UN"
rep 8 s = "chain AI" m = "BS" c = "EL"
rep 9 s = "chain AJ" m = "BS" c = "EL"
rep 10 s = "chain A5" m = "BS" c = "RT"
build all`)
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('4v4f_prepare', this));
    });

    it('change mode parameters', function() {
      return page.runScript(`\
set autobuild false
rep 0 m=BS atom = 0.15 bond = 0.4 space = 0.8 multibond = false
rep 1 m=LC bond = 0.5 space = 0.6 multibond = false
rep 2 m=LN lineWidth = 2 atom = 0.5 multibond = false
rep 3 m=CA radius = 0.1 depth = 0.5 tension = 0.5 ss.helix.width = 2 \
ss.strand.width = 0.5 ss.helix.arrow = 3 ss.strand.arrow = 1
rep 4 m=TU radius = 1 tension = 2
rep 5 m=TR radius = 1
rep 6 m=QS isoValue = 2.5 scale = 0.8 zClip = true wireframe = true
rep 7 m=SA probeRadius = 0.5 wireframe = true subset = "elem N"
rep 8 m=SE probeRadius = 3 zClip = true wireframe = true subset = "elem N"
rep 10 m=TX template = 'test atom {{name}}' bg = "adjust" fg = "inverse" horizontalAlign = "right"
build all`)
        .then(() => page.waitUntilRepresentationIs(10, 'TX', 'RT'))
        .then(() => golden.shouldMatch('4v4f_params', this));
    });

  });

  describe('assign combinations of selectors and modes via terminal, i. e.', function() {
    it('build selectors pattern', function() {
      return page.runScript(`\
set autobuild false
rep 0 s="sequence -1:71 and chain AA" m=CA c=SQ mt=SF
rep 1 s="serial 1079:1629" m=BS c=SQ mt=SF
rep 2 s="chain A3,A2 and nucleic" m=CA c=RT mt=SF
rep 3 s="chain A5 and pyrimidine" m=CA c=RT mt=SF
rep 4 s="chain A6,A7 and purine" m=BS c=RT mt=SF
rep 5 s="chain AG and charged" m=BS c=RT mt=SF
rep 6 s="chain AG and polar" m=BS c=RT mt=SF
rep 7 s="chain AI and nonpolar" m=BS c=RT mt=SF
rep 8 s="chain AD and water" m=BS c=EL mt=SF
rep 9 s="chain AD and elem N" m=BS c=EL mt=SF
rep 10 s="chain AD and name CA" m=BS c=EL mt=SF
rep 11 s="chain AC and residue ALA" m=BS c=RT mt=SF
rep 12 s="chain AE and aromatic" m=BS c=RT mt=SF
rep 13 s="chain AE and basic" m=BS c=RT mt=SF
rep 14 s="chain AE and acidic" m=BS c=RT mt=SF
rep 15 s="chain AJ and protein or hetatm and not water" m=TU c=SS mt=SF
rep 16 s="chain AF and none" m=BS c=EL mt=SF
rep 17 s='chain AK and altloc " "' m=BS c=CH mt=SF
rep 18 s="chain AH and polarh" m=BS c=EL mt=SF
rep 19 s="chain AH and nonpolarh" m=BS c=EL mt=SF
build all`)
        .then(() => page.waitUntilRebuildIsDone())
        .then(() => golden.shouldMatch('4v4f_selectors', this));
    });

    let repNumbers = Array.from(Array(20).keys());
    const suite = this;
    before(function() {
      return Promise.all([retrieve.modes]).then(([modes]) => {
        _.each(modes, (mode) => {
          const command = repNumbers.map(number => `rep ${number} m=${mode.id}`).join('\n');
          suite.addTest(it(`set ${mode.name} mode with all selectors`, function() {
            return page.runScript(`\
clear
set autobuild false
${command}
build all`)
              .then(() => page.waitUntilRepresentationIs(19, mode.id, 'EL'))
              .then(() => golden.shouldMatch(`4v4f_${mode.id}`, this));
          }));
        });
      });
    });

  });

});
