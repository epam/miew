import ChemGroup from './ChemGroup';

class ResiduesGroup extends ChemGroup {
  raycast(raycaster, intersects) {
    const { residues } = this._selection;
    const inters = [];
    this._mesh.raycast(raycaster, inters);
    const chunksIdc = this._chunksIdc;
    // process inters array - arr object references
    for (let i = 0, n = inters.length; i < n; ++i) {
      if (!inters[i].hasOwnProperty('chunkIdx')) {
        continue;
      }
      const resIdx = chunksIdc[inters[i].chunkIdx];
      if (resIdx < residues.length) {
        inters[i].residue = residues[resIdx];
        intersects.push(inters[i]);
      }
    }
  }

  _calcChunksList(mask) {
    const chunksList = [];
    const { residues } = this._selection;
    const resIdc = this._chunksIdc;
    for (let i = 0, n = resIdc.length; i < n; ++i) {
      const res = residues[resIdc[i]];
      if ((res._mask & mask) !== 0) {
        chunksList.push(i);
      }
    }
    return chunksList;
  }
}

export default ResiduesGroup;
