

import NucleicItemGroup from './NucleicItemGroup';

class NucleicSpheresGroup extends  NucleicItemGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super(geoParams, selection, colorer, mode, transforms, polyComplexity, material);
    this._stickRad = mode.calcStickRadius();
    this._geoArgs = [selection.chunks.length * 2, polyComplexity];
  }

  _processItem(chunkIdx, cyl1, cyl2, color) {
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
