

import ResiduesGroup from './ResiduesGroup';

function NucleicItemGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  ResiduesGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

NucleicItemGroup.prototype = Object.create(ResiduesGroup.prototype);
NucleicItemGroup.prototype.constructor = NucleicItemGroup;

NucleicItemGroup.prototype.raycast = function(raycaster, intersects) {
  var residues = this._selection.residues;
  var inters = [];
  this._mesh.raycast(raycaster, inters);
  var chunksIdc  = this._chunksIdc;
  // process inters array - arr object references
  for (var i = 0, n = inters.length; i < n; ++i) {
    if (!inters[i].hasOwnProperty('chunkIdx')) {
      continue;
    }
    var resIdx = chunksIdc[Math.floor(inters[i].chunkIdx / 2)];
    if (resIdx < residues.length) {
      inters[i].residue = residues[resIdx];
      intersects.push(inters[i]);
    }
  }
};

NucleicItemGroup.prototype._build = function() {
  var residues = this._selection.residues;
  var parent = this._selection.parent;
  var colorer = this._colorer;
  var geo = this._geo;
  var chunkIdx = 0;

  var resIdc  = this._selection.chunks;
  for (var i = 0, n = resIdc.length; i < n; ++i) {
    var res = residues[resIdc[i]];
    var color = colorer.getResidueColor(res, parent);
    this._processItem(chunkIdx++, res._cylinders[0], res._cylinders[1], color);
  }
  geo.finalize();
};

NucleicItemGroup.prototype._calcChunksList = function(mask) {
  var chunksList = [];
  var chunkIdx = 0;
  var residues = this._selection.residues;
  var resIdc = this._chunksIdc;

  for (var i = 0, n = resIdc.length; i < n; ++i) {
    var res = residues[resIdc[i]];
    if ((res._mask & mask) !== 0) {
      chunksList[chunkIdx++] =  2 * i;
      chunksList[chunkIdx++] =  2 * i + 1;
    }
  }
  return chunksList;
};

NucleicItemGroup.prototype.updateToFrame = function(frameData) {
  // TODO This method looks like a copy paste. However, it
  // was decided to postpone animation refactoring until GFX is fixed.
  var residues = frameData.getResidues();
  var parent = this._selection.parent;
  var colorer = this._colorer;
  var geo = this._geo;
  var chunkIdx = 0;

  var resIdc  = this._selection.chunks;
  for (var i = 0, n = resIdc.length; i < n; ++i) {
    var res = residues[resIdc[i]];
    var color = colorer.getResidueColor(res, parent);
    // TODO Pass color only when it has been changed?
    this._processItem(chunkIdx++, res._cylinders[0], res._cylinders[1], color);
  }
  geo.finishUpdate();
};

export default NucleicItemGroup;

