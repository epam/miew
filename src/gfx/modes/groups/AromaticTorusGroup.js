

import * as THREE from 'three';
import gfxutils from '../../gfxutils';
import AromaticGroup from './AromaticGroup';

function _createShape(rad, parts) {
  var pts = [];
  for (var i = 0; i < parts; ++i) {
    var a = 2 * i / parts * Math.PI;
    pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0));
  }
  return pts;
}
var calcChunkMatrix = gfxutils.calcChunkMatrix;

function AromaticTorusGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {

  var self = this;
  var segmentsHeight = self._segmentsHeight = polyComplexity;
  var torusRad = mode.getAromRadius();
  var radiusV = new THREE.Vector2(torusRad, torusRad);
  var radOffset = mode.calcStickRadius() + 2 * torusRad;
  var lookAtVector = new THREE.Vector3();
  var mtc = [];

  self._build = function() {
    var geo = self._geo;
    self._buildInner(radOffset, function(chunkIdx, color, points, center, upDir) {
      for (var j = 0; j <= segmentsHeight; ++j) {
        var currPoint = points[j];
        var currDir = currPoint.clone().sub(center).cross(upDir);
        lookAtVector.addVectors(currPoint, currDir);
        mtc[j] = calcChunkMatrix(currPoint, lookAtVector, upDir, radiusV);
      }
      geo.setItem(chunkIdx, mtc);
      geo.setColor(chunkIdx, color);
    });
    geo.finalize();
  };

  this._geoArgs = [_createShape(1.0, polyComplexity), this._segmentsHeight + 1, selection.chunks.length];
  AromaticGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

AromaticTorusGroup.prototype = Object.create(AromaticGroup.prototype);
AromaticTorusGroup.prototype.constructor = AromaticTorusGroup;

export default AromaticTorusGroup;

