import NucleicItemGroup from './NucleicItemGroup';

class NucleicCylindersGroup extends NucleicItemGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super(geoParams, selection, colorer, mode, transforms, polyComplexity, material);
    this._stickRad = mode.calcStickRadius();
  }

  _makeGeoArgs() {
    return [this._selection.chunks.length, this._polyComplexity];
  }

  _processItem(chunkIdx, cyl1, cyl2, color) {
    const geo = this._geo;
    geo.setItem(chunkIdx, cyl1, cyl2, this._stickRad);
    geo.setColor(chunkIdx, color, color);
  }
}

export default NucleicCylindersGroup;
