import AtomsSphereGroup from './AtomsSphereGroup';

class AtomsSurfaceGroup extends AtomsSphereGroup {
  _makeGeoArgs() {
    const selectedAtoms = [];
    const atoms = this._selection.atoms;
    const chunks = this._selection.chunks;
    let i = 0, n = chunks.length;
    for (; i < n; ++i) {
      selectedAtoms[i] = atoms[chunks[i]];
    }
    const opts = this._mode.getSurfaceOpts();
    opts.atoms = selectedAtoms;
    return [n, opts];
  }
}
export default AtomsSurfaceGroup;
