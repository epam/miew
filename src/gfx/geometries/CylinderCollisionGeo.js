

import * as THREE from 'three';
import utils from '../../utils';
import gfxutils from '../gfxutils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';

const VEC_SIZE = 3;
const tmpVector = new THREE.Vector3();
const normMtx = new THREE.Matrix3();

function CylinderCollisionGeo(instanceCount, polyComplexity) {
  const cylGeometry = new THREE.CylinderBufferGeometry(1, 1, 1.0, Math.max(3, polyComplexity), 2, true);
  ChunkedObjectsGeometry.call(this, cylGeometry, instanceCount);

  const chunkSize = this._chunkSize;
  this._chunkPos = this._chunkGeo.attributes.position.array;
  this._chunkNorms = this._chunkGeo.attributes.normal.array;
  this._tmpVector = utils.allocateTyped(Float32Array, chunkSize * VEC_SIZE);
}

CylinderCollisionGeo.prototype = Object.create(ChunkedObjectsGeometry.prototype);
CylinderCollisionGeo.prototype.constructor = CylinderCollisionGeo;

CylinderCollisionGeo.prototype.setItem = function(itemIdx, botPos, topPos, itemRad) {
  const chunkSize = this._chunkSize;
  const itemOffset = chunkSize * itemIdx * VEC_SIZE;

  const tmpArray = this._tmpVector;
  const geoPos = this._chunkPos;
  const geoNorm = this._chunkNorms;

  const mtx1 = gfxutils.calcCylinderMatrix(botPos, topPos, itemRad);
  normMtx.getNormalMatrix(mtx1);
  let i = 0;
  let idx;
  for (; i < chunkSize; ++i) {
    idx = i * VEC_SIZE;
    tmpVector.fromArray(geoPos, idx);
    tmpVector.applyMatrix4(mtx1);
    tmpVector.toArray(tmpArray, idx);
  }
  this._positions.set(tmpArray, itemOffset);

  for (i = 0; i < chunkSize; ++i) {
    idx = i * VEC_SIZE;
    tmpVector.fromArray(geoNorm, idx);
    tmpVector.applyMatrix3(normMtx);
    tmpVector.toArray(tmpArray, idx);
  }
  this._normals.set(tmpArray, itemOffset);
};

export default CylinderCollisionGeo;

