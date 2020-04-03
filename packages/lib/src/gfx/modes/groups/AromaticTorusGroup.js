import * as THREE from 'three';
import gfxutils from '../../gfxutils';
import AromaticGroup from './AromaticGroup';

function _createShape(rad, parts) {
  const pts = [];
  for (let i = 0; i < parts; ++i) {
    const a = -2 * i / parts * Math.PI;
    pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0));
  }
  return pts;
}
const { calcChunkMatrix } = gfxutils;

class AromaticTorusGroup extends AromaticGroup {
  _build() {
    const segmentsHeight = this._segmentsHeight;
    const torusRad = this._mode.getAromRadius();
    const radiusV = new THREE.Vector2(torusRad, torusRad);
    const radOffset = this._mode.calcStickRadius() + 2 * torusRad;
    const lookAtVector = new THREE.Vector3();
    const mtc = [];
    const geo = this._geo;
    this._buildInner(radOffset, (chunkIdx, color, points, center, upDir) => {
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
  }

  _makeGeoArgs() {
    this._segmentsHeight = this._polyComplexity;
    return [_createShape(1.0, this._polyComplexity), this._segmentsHeight + 1, this._selection.chunks.length];
  }
}

export default AromaticTorusGroup;
