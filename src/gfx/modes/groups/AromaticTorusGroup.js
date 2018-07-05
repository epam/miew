

import * as THREE from 'three';
import gfxutils from '../../gfxutils';
import AromaticGroup from './AromaticGroup';

function _createShape(rad, parts) {
  const pts = [];
  for (let i = 0; i < parts; ++i) {
    const a = 2 * i / parts * Math.PI;
    pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0));
  }
  return pts;
}
const calcChunkMatrix = gfxutils.calcChunkMatrix;

function AromaticTorusGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {

  const self = this;
  const segmentsHeight = self._segmentsHeight = polyComplexity;
  const torusRad = mode.getAromRadius();
  const radiusV = new THREE.Vector2(torusRad, torusRad);
  const radOffset = mode.calcStickRadius() + 2 * torusRad;
  const lookAtVector = new THREE.Vector3();
  const mtc = [];

  self._build = function() {
    const geo = self._geo;
    self._buildInner(radOffset, function(chunkIdx, color, points, center, upDir) {
      for (let j = 0; j <= segmentsHeight; ++j) {
        const currPoint = points[j];
        const currDir = currPoint.clone().sub(center).cross(upDir);
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

