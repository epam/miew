import AtomsGroup from './AtomsGroup';

class AtomsSphereGroup extends AtomsGroup {
  _makeGeoArgs() {
    return [this._selection.chunks.length, this._polyComplexity];
  }

  _build() {
    const atomsIdc = this._selection.chunks;
    const { atoms, parent } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    for (let i = 0, n = atomsIdc.length; i < n; ++i) {
      const atom = atoms[atomsIdc[i]];
      geo.setItem(i, atom.position, mode.calcAtomRadius(atom));
      geo.setColor(i, colorer.getAtomColor(atom, parent));
    }
    geo.finalize();
  }

  updateToFrame(frameData) {
    // This method looks like a copy paste. However, it
    // was decided to postpone animation refactoring until GFX is fixed.
    const atomsIdc = this._selection.chunks;
    const { atoms } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const updateColor = frameData.needsColorUpdate(colorer);
    const geo = this._geo;
    for (let i = 0, n = atomsIdc.length; i < n; ++i) {
      const atom = atoms[atomsIdc[i]];
      geo.setItem(i, frameData.getAtomPos(atomsIdc[i]), mode.calcAtomRadius(atom));
      if (updateColor) {
        geo.setColor(i, frameData.getAtomColor(colorer, atom));
      }
    }
    geo.finalize();
  }
}

export default AtomsSphereGroup;
