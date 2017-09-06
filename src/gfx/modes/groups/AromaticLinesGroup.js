

import AromaticGroup from './AromaticGroup';

function AromaticLinesGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  var self = this;
  var segmentsHeight = this._segmentsHeight = mode.getAromaticArcChunks();
  self._build = function() {
    var geo = self._geo;
    var radOffset = mode.getAromaticOffset();
    self._buildInner(radOffset, function(chunkIdx, color, points) {
      var prevPt = points[0];//do not replace with start
      for (var j = 1; j <= segmentsHeight; ++j) {
        var currPoint = points[j];
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

