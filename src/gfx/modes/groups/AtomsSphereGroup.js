

import AtomsGroup from './AtomsGroup';

function AtomsSphereGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  this._geoArgs = this._makeGeoArgs(selection, mode, colorer, polyComplexity);
  AtomsGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

AtomsSphereGroup.prototype = Object.create(AtomsGroup.prototype);
AtomsSphereGroup.prototype.constructor = AtomsSphereGroup;

AtomsSphereGroup.prototype._makeGeoArgs = function(selection, mode, colorer, polyComplexity) {
  return [selection.chunks.length, polyComplexity];
};

AtomsSphereGroup.prototype._build = function() {
  var atomsIdc  = this._selection.chunks;
  var atoms = this._selection.atoms;
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  for (var i = 0, n = atomsIdc.length; i < n; ++i) {
    var atom = atoms[atomsIdc[i]];
    geo.setItem(i, atom._position, mode.calcAtomRadius(atom));
    geo.setColor(i, colorer.getAtomColor(atom, parent));
  }
  geo.finalize();
};

AtomsSphereGroup.prototype.updateToFrame = function(frameData) {
  // TODO This method looks like a copy paste. However, it
  // was decided to postpone animation refactoring until GFX is fixed.
  var atomsIdc  = this._selection.chunks;
  var atoms = this._selection.atoms;
  var mode = this._mode;
  var colorer = this._colorer;
  var updateColor = frameData.needsColorUpdate(colorer);
  var geo = this._geo;
  for (var i = 0, n = atomsIdc.length; i < n; ++i) {
    var atom = atoms[atomsIdc[i]];
    geo.setItem(i, frameData.getAtomPos(atomsIdc[i]), mode.calcAtomRadius(atom));
    if (updateColor) {
      geo.setColor(i, frameData.getAtomColor(colorer, atom));
    }
  }
  geo.finalize();
};

export default AtomsSphereGroup;

