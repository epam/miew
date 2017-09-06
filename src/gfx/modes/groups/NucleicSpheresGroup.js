

import NucleicItemGroup from './NucleicItemGroup';

function NucleicCylindersItemGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  this._stickRad = mode.calcStickRadius();
  this._geoArgs = [selection.chunks.length * 2, polyComplexity];
  NucleicItemGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

NucleicCylindersItemGroup.prototype = Object.create(NucleicItemGroup.prototype);
NucleicCylindersItemGroup.prototype.constructor = NucleicCylindersItemGroup;

NucleicCylindersItemGroup.prototype._processItem = function(chunkIdx, cyl1, cyl2, color) {
  var geo = this._geo;
  var stickRad = this._stickRad;
  var idx = chunkIdx * 2;
  geo.setItem(idx, cyl1, stickRad);
  geo.setColor(idx, color);
  idx++;
  geo.setItem(idx, cyl2, stickRad);
  geo.setColor(idx, color);
};

export default NucleicCylindersItemGroup;

