import AtomsSphereGroup from './AtomsSphereGroup';

class AtomsSurfaceGroup extends AtomsSphereGroup {
  _makeGeoArgs(selection, mode, _colorer, _polyComplexity) {
    const selectedAtoms = [];
    const atoms = selection.atoms;
    const chunks = selection.chunks;
    let i = 0, n = chunks.length;
    for (; i < n; ++i) {
      selectedAtoms[i] = atoms[chunks[i]];
    }
    const opts = mode.getSurfaceOpts();
    opts.atoms = selectedAtoms;
    return [n, opts];
  }
}

export default AtomsSurfaceGroup;
