import NucleicItemGroup from './NucleicItemGroup';

class NucleicCylindersGroup extends NucleicItemGroup {
  _makeGeoArgs() {
    return [this._selection.chunks.length, this._polyComplexity];
  }

  _processItem(chunkIdx, cyl1, cyl2, color) {
    this._stickRad = this._mode.calcStickRadius();
    const geo = this._geo;
    geo.setItem(chunkIdx, cyl1, cyl2, this._stickRad);
    geo.setColor(chunkIdx, color, color);
  }
}

export default NucleicCylindersGroup;
