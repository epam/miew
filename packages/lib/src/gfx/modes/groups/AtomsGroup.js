import ChemGroup from './ChemGroup';

class AtomsGroup extends ChemGroup {
  raycast(raycaster, intersects) {
    const { atoms } = this._selection;
    const inters = [];
    this._mesh.raycast(raycaster, inters);
    const atomsIdc = this._chunksIdc;
    // process inters array - arr object references
    for (let i = 0, n = inters.length; i < n; ++i) {
      if (!inters[i].hasOwnProperty('chunkIdx')) {
        continue;
      }
      const atomIdx = atomsIdc[inters[i].chunkIdx];
      if (atomIdx < atoms.length) {
        inters[i].atom = atoms[atomIdx];
        intersects.push(inters[i]);
      }
    }
  }

  _calcChunksList(mask) {
    const chunksList = [];
    const { atoms } = this._selection;
    const atomsIdc = this._chunksIdc;
    for (let i = 0, n = atomsIdc.length; i < n; ++i) {
      const atom = atoms[atomsIdc[i]];
      if ((atom.mask & mask) !== 0) {
        chunksList.push(i);
      }
    }
    return chunksList;
  }
}

export default AtomsGroup;
