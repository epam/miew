import AromaticGroup from './AromaticGroup';

class AromaticLinesGroup extends AromaticGroup {
  _makeGeoArgs(_polyComplexity) {
    const segmentsHeight = this._segmentsHeight = this._mode.getAromaticArcChunks();
    this._build = function() {
      const geo = this._geo;
      const radOffset = this._mode.getAromaticOffset();
      this._buildInner(radOffset, (chunkIdx, color, points) => {
        let prevPt = points[0];//do not replace with start
        for (let j = 1; j <= segmentsHeight; ++j) {
          const currPoint = points[j];
          geo.setSegment(chunkIdx, j - 1, prevPt, currPoint);
          prevPt = currPoint;
        }
        geo.setColor(chunkIdx, color);
      });
      geo.finalize();
    };

    return [this._selection.chunks.length, segmentsHeight, true];
  }
}

export default AromaticLinesGroup;
