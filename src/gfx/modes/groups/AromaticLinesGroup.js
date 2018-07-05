

import AromaticGroup from './AromaticGroup';

function AromaticLinesGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  const self = this;
  const segmentsHeight = this._segmentsHeight = mode.getAromaticArcChunks();
  self._build = function() {
    const geo = self._geo;
    const radOffset = mode.getAromaticOffset();
    self._buildInner(radOffset, function(chunkIdx, color, points) {
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

  this._geoArgs = [selection.chunks.length, segmentsHeight, true];
  AromaticGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

AromaticLinesGroup.prototype = Object.create(AromaticGroup.prototype);
AromaticLinesGroup.prototype.constructor = AromaticLinesGroup;

export default AromaticLinesGroup;

