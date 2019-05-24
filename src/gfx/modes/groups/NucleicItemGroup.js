import ResiduesGroup from './ResiduesGroup';

class NucleicItemGroup extends ResiduesGroup {
  raycast(raycaster, intersects) {
    const { residues } = this._selection;
    const inters = [];
    this._mesh.raycast(raycaster, inters);
    const chunksIdc = this._chunksIdc;
    // process inters array - arr object references
    for (let i = 0, n = inters.length; i < n; ++i) {
      if (!inters[i].hasOwnProperty('chunkIdx')) {
        continue;
      }
      const resIdx = chunksIdc[Math.floor(inters[i].chunkIdx / 2)];
      if (resIdx < residues.length) {
        inters[i].residue = residues[resIdx];
        intersects.push(inters[i]);
      }
    }
  }

  _build() {
    const { residues, parent } = this._selection;
    const colorer = this._colorer;
    const geo = this._geo;
    const stickRad = this._mode.calcStickRadius();
    let chunkIdx = 0;

    const resIdc = this._selection.chunks;
    for (let i = 0, n = resIdc.length; i < n; ++i) {
      const res = residues[resIdc[i]];
      const color = colorer.getResidueColor(res, parent);
      this._processItem(chunkIdx++, res._cylinders[0], res._cylinders[1], stickRad, color);
    }
    geo.finalize();
  }

  _calcChunksList(mask) {
    const chunksList = [];
    let chunkIdx = 0;
    const { residues } = this._selection;
    const resIdc = this._chunksIdc;

    for (let i = 0, n = resIdc.length; i < n; ++i) {
      const res = residues[resIdc[i]];
      if ((res._mask & mask) !== 0) {
        chunksList[chunkIdx++] = 2 * i;
        chunksList[chunkIdx++] = 2 * i + 1;
      }
    }
    return chunksList;
  }

  updateToFrame(frameData) {
    // This method looks like a copy paste. However, it
    // was decided to postpone animation refactoring until GFX is fixed.
    const residues = frameData.getResidues();
    const { parent } = this._selection;
    const colorer = this._colorer;
    const geo = this._geo;
    const stickRad = this._mode.calcStickRadius();
    let chunkIdx = 0;

    const resIdc = this._selection.chunks;
    for (let i = 0, n = resIdc.length; i < n; ++i) {
      const res = residues[resIdc[i]];
      const color = colorer.getResidueColor(res, parent);
      this._processItem(chunkIdx++, res._cylinders[0], res._cylinders[1], stickRad, color);
    }
    geo.finishUpdate();
  }
}

export default NucleicItemGroup;
