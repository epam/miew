

import NucleicItemGroup from './NucleicItemGroup';

function NucleicCylindersGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  this._stickRad = mode.calcStickRadius();
  this._geoArgs = [selection.chunks.length, polyComplexity];

  NucleicItemGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

NucleicCylindersGroup.prototype = Object.create(NucleicItemGroup.prototype);
NucleicCylindersGroup.prototype.constructor = NucleicCylindersGroup;

NucleicCylindersGroup.prototype._processItem = function(chunkIdx, cyl1, cyl2, color) {
  var geo = this._geo;
  geo.setItem(chunkIdx, cyl1, cyl2, this._stickRad);
  geo.setColor(chunkIdx, color, color);
};

export default NucleicCylindersGroup;

