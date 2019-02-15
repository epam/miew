import AtomsSphereGroup from './AtomsSphereGroup';

class AtomsSurfaceGroup extends AtomsSphereGroup {
  _makeGeoArgs() {
    const selectedAtoms = [];
    const { atoms, chunks } = this._selection;
    const n = chunks.length;
    for (let i = 0; i < n; ++i) {
      selectedAtoms[i] = atoms[chunks[i]];
    }
    const opts = this._mode.getSurfaceOpts();
    opts.atoms = selectedAtoms;
    return [n, opts];
  }
}
export default AtomsSurfaceGroup;
