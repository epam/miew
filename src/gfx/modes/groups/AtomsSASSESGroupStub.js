/* This is a stub class keep it until SAS/SES is refactored */

import AtomsSphereGroup from './AtomsSphereGroup';

class AtomsSASSESGroupStub extends AtomsSphereGroup {
  _makeGeoArgs() {
    const selectedAtoms = [];
    const { atoms, chunks } = this._selection;
    const n = chunks.length;
    for (let i = 0; i < n; ++i) {
      selectedAtoms[i] = atoms[chunks[i]];
    }
    const opts = this._mode.getSurfaceOpts();
    opts.atoms = selectedAtoms;
    opts.selection = this._selection;
    opts.colorMode = this._colorer;
    return [n, opts];
  }
}

export default AtomsSASSESGroupStub;
