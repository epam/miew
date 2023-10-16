/* global miew */

function runReps(opts) {
  window.miew = new window.Miew({
    settings: opts.settings,
    view: opts.view,
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

const protein = '1crn';
const proteinPath = `/data/${protein}.pdb`;

// test proper working of different clip planes
function testPlanes(runMiewAndCheckFn) {
  describe('check effects with clip planes', () => {
    it(`render parts of ${protein} with clipped surface modes`, runMiewAndCheckFn(runReps, `${protein}_zclip`, {
      load: proteinPath,
      reps: [
        { selector: 'all', mode: 'TU', colorer: 'UN' },
        { selector: 'sequence 42', mode: ['QS', { zClip: true }], colorer: 'SQ' },
        { selector: 'sequence 9', mode: ['SA', { zClip: true }], colorer: 'SQ' },
        { selector: 'sequence 19:20', mode: ['SE', { zClip: true }], colorer: 'SQ' },
        { selector: 'sequence 2:3', mode: ['CS', { zClip: true }], colorer: 'SQ' },
      ],
      view: '1+n4pwTVeI8Erh8LAMfNYPZuLLb8TnA7AIZhCwA==',
    }));

    // test combinations of global clip plane, fog and background parameters
    const view = '1+n4pwTVeI8Erh8LAlvFdPQAAAAAAAACAAAAAgA==';
    const reps = [
      { mode: 'QS', colorer: ['UN', { color: 0x1e90ff }] },
      { mode: 'LC', colorer: 'UN' },
    ];

    it(`render clipped ${protein} with fog and colored background`, runMiewAndCheckFn(runReps, `${protein}_cl_fg_bg`, {
      load: proteinPath,
      settings: {
        draft: { clipPlane: true },
        fog: true,
        fogNearFactor: 0.7,
        fogFarFactor: 0.7,
        bg: { color: 0x800000 },
      },
      reps,
      view,
    }));

    it(`render clipped ${protein} with colored background without fog`, runMiewAndCheckFn(runReps, `${protein}_cl_bg`, {
      load: proteinPath,
      settings: {
        draft: { clipPlane: true },
        fog: false,
        bg: { color: 0x800000 },
      },
      reps,
      view,
    }));

    it(`render clipped ${protein} with fog and transparent background`, runMiewAndCheckFn(runReps, `${protein}_cl_fg_tr`, {
      load: proteinPath,
      settings: {
        draft: { clipPlane: true, clipPlaneFactor: 0.3 },
        fog: true,
        bg: { transparent: true },
      },
      reps,
      view,
    }));

    it(`render clipped ${protein} with colored fog and background`, runMiewAndCheckFn(runReps, `${protein}_cl_cf_bg`, {
      load: proteinPath,
      settings: {
        draft: { clipPlane: true, clipPlaneFactor: 0.7 },
        fog: true,
        fogColor: 0x008000,
        fogColorEnable: true,
        bg: { color: 0x800000 },
      },
      reps,
      view,
    }));
  });
}

export default testPlanes;
