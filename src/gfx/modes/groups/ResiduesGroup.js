

import ChemGroup from './ChemGroup';

function ResiduesGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  ChemGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

ResiduesGroup.prototype = Object.create(ChemGroup.prototype);
ResiduesGroup.prototype.constructor = ResiduesGroup;

ResiduesGroup.prototype.raycast = function(raycaster, intersects) {
  var residues = this._selection.residues;
  var inters = [];
  this._mesh.raycast(raycaster, inters);
  var chunksIdc  = this._chunksIdc;
  // process inters array - arr object references
  for (var i = 0, n = inters.length; i < n; ++i) {
    if (!inters[i].hasOwnProperty('chunkIdx')) {
      continue;
    }
    var resIdx = chunksIdc[inters[i].chunkIdx];
    if (resIdx < residues.length) {
      inters[i].residue = residues[resIdx];
      intersects.push(inters[i]);
    }
  }
};

ResiduesGroup.prototype._calcChunksList = function(mask) {
  var chunksList = [];
  var residues = this._selection.residues;
  var resIdc = this._chunksIdc;
  for (var i = 0, n = resIdc.length; i < n; ++i) {
    var res = residues[resIdc[i]];
    if ((res._mask & mask) !== 0) {
      chunksList.push(i);
    }
  }
  return chunksList;
};

export default ResiduesGroup;

