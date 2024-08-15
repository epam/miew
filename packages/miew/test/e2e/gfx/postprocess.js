/* global miew */
import _ from 'lodash';

const protein = '1zlm';

const effects = [
  { // selection
    name: 'Selection',
    id: 'sel',
    select: 'residue LYS',
  },
  { // fxaa
    name: 'FXAA',
    id: 'aa',
    settings: 'fxaa',
    values: [false, true],
  },
  { // ambient occlusion
    name: 'Ambient Occlusion',
    id: 'ao',
    settings: 'ao',
    values: [false, true],
  },
  { // outline
    name: 'Outline',
    id: 'out',
    settings: 'outline.on',
    values: [false, true],
  },
  { // electron density
    name: 'Electron Density',
    id: 'den',
    settings: 'use.multiFile',
    values: [false, true],
    load: `/data/${protein}.dsn6`,
  },
  { // stereo distortion
    name: 'Stereo Distortion',
    id: 'ste',
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
      miew.view('1RjanwUpsuULsscfCHTIEPcxVEj88nzZAtuW8vQ==');
    });
  }
}

function buildParams(bitMask) {
  const descStrs = [];
  const idStrs = [''];
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
      idStrs.push(effect.id);
      descStrs.push(effect.name);
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
  const id = idStrs.join('_');
  const desc = descStrs.join(', ');
  return {
    desc, settings, select, load, id,
  };
}

// Make full combination of the effects to check proper management of render targets and validity of random effects
// composition without electron density
function testPostProcessEffects(fxs) {
  describe('use the Miew to display a data set with different combination of post-process effects', () => {
    const number = 2 ** effects.length;
    for (let i = 0; i < number; i++) {
      const combination = buildParams(i);
      // add general protein to load
      combination.load[combination.load.length] = `/data/${protein}.pdb`;
      it(`render ${protein} with ${combination.desc}`, fxs(
        loadMolWithEffects,
        `${protein}${combination.id}`,
        combination,
      ));
    }
  });
}

export default testPostProcessEffects;
