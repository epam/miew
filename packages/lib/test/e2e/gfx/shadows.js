/* global miew */

import _ from 'lodash';
import { expect } from 'chai';

// get from Miew its modes list
function getModes() {
  window.miew = new window.Miew({});
  const { miew } = window;
  return miew && JSON.stringify(miew.constructor.modes.all.map((mode) => ({
    id: Array.isArray(mode.id) ? mode.id[0] : mode.id,
    name: mode.prototype ? mode.prototype.name : mode.name,
  })));
}

// gimply runs Miew (required for empty test)
function runMiew(opts) {
  window.miew = new window.Miew(opts);
  if (miew.init()) {
    miew.run();
  }
}

// runs Miew with specific rep mode and view
function runMiewWithReps(opts) {
  window.miew = new window.Miew({ settings: opts.settings });
  if (miew.init()) {
    miew.run();
    miew.load(opts.load).then(() => {
      miew.rep({ mode: opts.mode });
      // set view that demonstrates shadows apropriately
      miew.view('1+n4pwTVeI8Erh8LAHI6CPZQtMb+VQiZAcLyePw==');
    });
  }
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

const retrieve = {};

// test proper working shadows in different modes
function testShadows(getList, runMiewAndCheckFn) {
  // get all modes existing in Miew, to check all of them with shadows
  describe('preliminary step', () => {
    it('get all miew modes', getList(getModes, {}, retrieve, checkList, 'modes', 'BS'));
  });
  // test all modes with shadows
  const suite = describe('assign all combinations of modes to shadows, i.e.', () => {
    // empty test just running miew. its is needed to make before() run and add test for all modes
    it('load 1crn (filler test)', runMiewAndCheckFn(runMiew, '1crn', { load: '/data/1crn.pdb' }));
    // test all modes
    before(() => retrieve.modes.then((modes) => {
      _.each(modes, (mode) => {
        suite.addTest(it(`set ${mode.name} mode with shadows on`, runMiewAndCheckFn(runMiewWithReps, `1crn_sha_${mode.id}`, {
          load: '/data/1crn.pdb',
          settings: { shadow: { on: true } },
          mode: mode.id,
        })));
      });
    }));
  });
}

export default testShadows;
