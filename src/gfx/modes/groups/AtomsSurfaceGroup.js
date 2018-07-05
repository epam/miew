

import AtomsSphereGroup from './AtomsSphereGroup';

class AtomsSurfaceGroup extends AtomsSphereGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super(geoParams, selection, colorer, mode, transforms, polyComplexity, material);
  }

_makeGeoArgs(selection, mode, _colorer, _polyComplexity) {
    var selectedAtoms = [];
    var atoms = selection.atoms;
    var chunks = selection.chunks;
    var i = 0, n = chunks.length;
    for (; i < n; ++i) {
      selectedAtoms[i] = atoms[chunks[i]];
    }
    var opts = mode.getSurfaceOpts();
    opts.atoms = selectedAtoms;
    return [n, opts];
  }
}
export default AtomsSurfaceGroup;

