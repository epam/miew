/* global miew */
import _ from 'lodash';

const protein = '1zlm';

const effects = [
  { // selection
    name: 'sel',
    select: 'residue LYS',
  },
  { // fxaa
    name: 'aa',
    settings: 'fxaa',
    values: [false, true],
  },
  { // ambient occlusion
    name: 'ao',
    settings: 'ao',
    values: [false, true],
  },
  { // outline
    name: 'out',
    settings: 'outline.on',
    values: [false, true],
  },
  { // electron density
    name: 'den',
    settings: 'use.multiFile',
    values: [false, true],
    load: `/data/${protein}.dsn6`,
  },
  { // stereo distortion
    name: 'ste',
    settings: 'stereo',
    values: ['NONE', 'DISTORTED'],
  },
];

function loadMolWithEffects(opts) {
  window.miew = new window.Miew({ settings: opts.settings });
  if (miew.init()) {
    miew.run();
    let chain = Promise.resolve();
    const { load } = opts;
    for (let i = 0; i < opts.load.length; i++) {
      chain = chain.then(() => miew.load(load[i]));
    }
    chain.then(() => {
      if (opts.select) {
        miew.select(opts.select);
      }
    });
  }
}

function buildParams(bitMask) {
  let desc = '';
  const settings = {};
  const selectStrs = [];
  const load = [];
  for (let n = 0; n < effects.length; n++) {
    // get effect bit
    const bit = Boolean(bitMask & (1 << n));
    // widen settings
    const effect = effects[n];
    if (effect.settings) {
      _.set(settings, effect.settings, effect.values[Number(bit)]);
    }
    if (bit) {
      // build image notation
      desc += `_${effect.name}`;
      // add selection
      if (effect.select) {
        selectStrs.push(effect.select);
      }
      // add additional file to load
      if (effect.load) {
        load.push(effect.load);
      }
    }
  }
  const select = selectStrs.join(' AND ');
  return {
    desc, settings, select, load,
  };
}

// Make full combination of the effects to check proper management of render targets and validity of random effects
// composition without electron density
function testPostProcessEffects(fxs) {
  describe('use the Miew to display a data set width different combination of post-process effects', () => {
    const number = 2 ** effects.length;
    for (let i = 0; i < number; i++) {
      const combination = buildParams(i);
      // add general protein to load
      combination.load[combination.load.length] = `/data/${protein}.pdb`;
      it('use combination of effects', fxs(
        loadMolWithEffects,
        `${protein}${combination.desc}`,
        combination,
      ));
    }
  });
}

export default testPostProcessEffects;
