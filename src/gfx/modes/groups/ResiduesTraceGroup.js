import ChemGroup from './ChemGroup';

class ResiduesTraceGroup extends ChemGroup {
  _makeGeoArgs() {
    const subDiv = this._selection.subdivs;
    let chunksCount = 0;
    for (let subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
      const subs = subDiv[subDivI].arr;
      for (let i = 0, n = subs.length; i < n; ++i) {
        chunksCount += subs[i].end - subs[i].start;
      }
    }
    return [chunksCount, this._polyComplexity];
  }

  _build() {
    const { residues, parent } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    let chunkIdx = 0;
    const chunkIdc = [];
    const subDiv = this._selection.subdivs;
    const stickRad = mode.calcStickRadius();

    for (let subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
      const subs = subDiv[subDivI].arr;
      for (let i = 0, n = subs.length; i < n; ++i) {
        const startIdx = subs[i].start;
        const endIdx = subs[i].end;
        let prevRes = residues[startIdx];
        for (let idx = startIdx + 1; idx <= endIdx; ++idx) {
          const currRes = residues[idx];
          chunkIdc[chunkIdx] = { first: prevRes._index, second: currRes._index };
          geo.setItem(chunkIdx, prevRes._controlPoint, currRes._controlPoint, stickRad);
          geo.setColor(chunkIdx, colorer.getResidueColor(prevRes, parent), colorer.getResidueColor(currRes, parent));
          chunkIdx++;
          prevRes = currRes;
        }
      }
    }

    this._chunksIdc = chunkIdc;
    geo.finalize();
  }

  updateToFrame(frameData) {
    // This method looks like a copy paste. However, it
    // was decided to postpone animation refactoring until GFX is fixed.

    const residues = frameData.getResidues();
    const { parent } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    let chunkIdx = 0;
    const subDiv = this._selection.subdivs;
    const stickRad = mode.calcStickRadius();
    const updateColor = frameData.needsColorUpdate(colorer);

    for (let subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
      const subs = subDiv[subDivI].arr;
      for (let i = 0, n = subs.length; i < n; ++i) {
        const startIdx = subs[i].start;
        const endIdx = subs[i].end;
        let prevRes = residues[startIdx];
        for (let idx = startIdx + 1; idx <= endIdx; ++idx) {
          const currRes = residues[idx];
          geo.setItem(chunkIdx, prevRes._controlPoint, currRes._controlPoint, stickRad);
          if (updateColor) {
            geo.setColor(chunkIdx, colorer.getResidueColor(prevRes, parent), colorer.getResidueColor(currRes, parent));
          }
          chunkIdx++;
          prevRes = currRes;
        }
      }
    }

    geo.finalize();
  }

  raycast(raycaster, intersects) {
    const inters = [];
    const { residues } = this._selection;
    this._mesh.raycast(raycaster, inters);
    const chunksToIdx = this._chunksIdc;
    // process inters array - arr object references
    for (let i = 0, n = inters.length; i < n; ++i) {
      if (!inters[i].hasOwnProperty('chunkIdx')) {
        continue;
      }
      const { chunkIdx } = inters[i];
      const chunk = chunksToIdx[Math.floor(chunkIdx / 2)];
      const resIdx = chunkIdx % 2 === 0 ? chunk.first : chunk.second;
      if (resIdx < residues.length) {
        inters[i].residue = residues[resIdx];
        intersects.push(inters[i]);
      }
    }
  }

  _calcChunksList(mask) {
    const chunksList = [];
    const chunksToIdx = this._chunksIdc;
    const { residues } = this._selection;
    for (let i = 0, n = chunksToIdx.length; i < n; ++i) {
      const chunk = chunksToIdx[i];
      if (residues[chunk.first]._mask & mask) {
        chunksList.push(i * 2);
      }
      if (residues[chunk.second]._mask & mask) {
        chunksList.push(i * 2 + 1);
      }
    }
    return chunksList;
  }
}

export default ResiduesTraceGroup;
