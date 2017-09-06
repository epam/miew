

import NucleicItemGroup from './NucleicItemGroup';

function NucleicCylindersItemGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  this._stickRad = mode.calcStickRadius();
  this._geoArgs = [selection.chunks.length, polyComplexity];

  NucleicItemGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

NucleicCylindersItemGroup.prototype = Object.create(NucleicItemGroup.prototype);
NucleicCylindersItemGroup.prototype.constructor = NucleicCylindersItemGroup;

NucleicCylindersItemGroup.prototype._processItem = function(chunkIdx, cyl1, cyl2, color) {
  var geo = this._geo;
  geo.setItem(chunkIdx, cyl1, cyl2, this._stickRad);
  geo.setColor(chunkIdx, color, color);
};

export default NucleicCylindersItemGroup;

