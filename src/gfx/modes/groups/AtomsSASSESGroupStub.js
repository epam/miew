/* This is a stub class keep it until SAS/SES is refactored */

import AtomsSphereGroup from './AtomsSphereGroup';

class AtomsSASSESGroupStub extends AtomsSphereGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super(geoParams, selection, colorer, mode, transforms, polyComplexity, material);
  }

  _makeGeoArgs(selection, mode, colorer, _polyComplexity) {
    const selectedAtoms = [];
    const atoms = selection.atoms;
    const chunks = selection.chunks;
    let i = 0, n = chunks.length;
    for (; i < n; ++i) {
      selectedAtoms[i] = atoms[chunks[i]];
    }
    const opts = mode.getSurfaceOpts();
    opts.atoms = selectedAtoms;
    opts.selection = selection;
    opts.colorMode = colorer;
    return [n, opts];
  }
}

export default AtomsSASSESGroupStub;
