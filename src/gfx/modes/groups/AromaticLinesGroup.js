import AromaticGroup from './AromaticGroup';

class AromaticLinesGroup extends AromaticGroup {
  _build() {
    const geo = this._geo;
    const radOffset = this._mode.getAromaticOffset();
    this._buildInner(radOffset, (chunkIdx, color, points) => {
      let prevPt = points[0];// do not replace with start
      for (let j = 1; j <= this._segmentsHeight; ++j) {
        const currPoint = points[j];
        geo.setSegment(chunkIdx, j - 1, prevPt, currPoint);
        prevPt = currPoint;
      }
      geo.setColor(chunkIdx, color);
    });
    geo.finalize();
  }

  _makeGeoArgs() {
    this._segmentsHeight = this._mode.getAromaticArcChunks();
    return [this._selection.chunks.length, this._segmentsHeight, true];
  }
}

export default AromaticLinesGroup;
