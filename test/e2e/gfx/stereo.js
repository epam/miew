/* global miew */

// simply runs Miew with opts
function runMiew(opts) {
  window.miew = new window.Miew(opts);
  if (miew.init()) {
    miew.run();
  }
}

// NOTE: WebVR is not supported now in Chrome, so we don't test the mode

const stereo = [
  {
    id: 'si',
    name: 'Simple',
  },
  {
    id: 'di',
    name: 'Distorted',
  },
  {
    id: 'an',
    name: 'Anaglyph',
  },
];

// test proper working shadows in different modes
function testStereo(runMiewAndCheckFn) {
  describe('test stereo modes', () => {
    for (let i = 0; i < stereo.length; i++) {
      const mode = stereo[i];
      it(`run miew in ${mode.name} stereo mode`, runMiewAndCheckFn(runMiew, `1crn_ste_${mode.id}`, {
        load: '/data/1crn.pdb',
        settings: { stereo: mode.name.toUpperCase() },
      }));
    }
  });
}

export default testStereo;
