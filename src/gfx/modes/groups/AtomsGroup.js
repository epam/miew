

import ChemGroup from './ChemGroup';

class AtomsGroup extends ChemGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super(geoParams, selection, colorer, mode, transforms, polyComplexity, material);
  }

  raycast(raycaster, intersects) {
    var atoms = this._selection.atoms;
    var inters = [];
    this._mesh.raycast(raycaster, inters);
    var atomsIdc = this._chunksIdc;
    // process inters array - arr object references
    for (var i = 0, n = inters.length; i < n; ++i) {
      if (!inters[i].hasOwnProperty('chunkIdx')) {
        continue;
      }
      var atomIdx = atomsIdc[inters[i].chunkIdx];
      if (atomIdx < atoms.length) {
        inters[i].atom = atoms[atomIdx];
        intersects.push(inters[i]);
      }
    }
  }

  _calcChunksList(mask) {
    var chunksList = [];
    var atoms = this._selection.atoms;
    var atomsIdc = this._chunksIdc;
    for (var i = 0, n = atomsIdc.length; i < n; ++i) {
      var atom = atoms[atomsIdc[i]];
      if ((atom._mask & mask) !== 0) {
        chunksList.push(i);
      }
    }
    return chunksList;
  }
}

export default AtomsGroup;
