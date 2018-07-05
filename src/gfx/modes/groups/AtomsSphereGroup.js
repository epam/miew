

import AtomsGroup from './AtomsGroup';

class AtomsSphereGroup extends AtomsGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super(geoParams, selection, colorer, mode, transforms, polyComplexity, material);
    this._geoArgs = this._makeGeoArgs(selection, mode, colorer, polyComplexity);
  }


  _makeGeoArgs(selection, mode, colorer, polyComplexity) {
    return [selection.chunks.length, polyComplexity];
  }

  _build() {
    var atomsIdc = this._selection.chunks;
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
  }

  updateToFrame(frameData) {
    // TODO This method looks like a copy paste. However, it
    // was decided to postpone animation refactoring until GFX is fixed.
    var atomsIdc = this._selection.chunks;
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
  }
}

export default AtomsSphereGroup;

