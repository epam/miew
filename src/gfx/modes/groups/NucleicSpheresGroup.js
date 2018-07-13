import NucleicItemGroup from './NucleicItemGroup';

class NucleicSpheresGroup extends  NucleicItemGroup {
  _makeGeoArgs() {
    return [this._selection.chunks.length * 2, this._polyComplexity];
  }

  _processItem(chunkIdx, cyl1, cyl2, color) {
    this._stickRad = this._mode.calcStickRadius();
    const geo = this._geo;
    const stickRad = this._stickRad;
    let idx = chunkIdx * 2;
    geo.setItem(idx, cyl1, stickRad);
    geo.setColor(idx, color);
    idx++;
    geo.setItem(idx, cyl2, stickRad);
    geo.setColor(idx, color);
  }
}

export default NucleicSpheresGroup;
