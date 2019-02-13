import NucleicItemGroup from './NucleicItemGroup';

class NucleicCylindersGroup extends NucleicItemGroup {
  _makeGeoArgs() {
    return [this._selection.chunks.length, this._polyComplexity];
  }

  _processItem(chunkIdx, cyl1, cyl2, stickRad, color) {
    const geo = this._geo;
    geo.setItem(chunkIdx, cyl1, cyl2, stickRad);
    geo.setColor(chunkIdx, color, color);
  }
}

export default NucleicCylindersGroup;
