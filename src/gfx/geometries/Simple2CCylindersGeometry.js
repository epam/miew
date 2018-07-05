

import * as THREE from 'three';
import utils from '../../utils';
import gfxutils from '../gfxutils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';

const VEC_SIZE = 3;
const parentSetColor = ChunkedObjectsGeometry.prototype.setColor;
const centerPos = new THREE.Vector3();
const tmpVector = new THREE.Vector3();
const normMtx = new THREE.Matrix3();

function Simple2CCylindersGeometry(instanceCount, polyComplexity) {
  const cylGeometry = new THREE.CylinderBufferGeometry(1, 1, 1.0, Math.max(3, polyComplexity), 2, true);
  ChunkedObjectsGeometry.call(this, cylGeometry, 2 * instanceCount);

  const chunkSize = this._chunkSize;
  this._chunkPos = this._chunkGeo.attributes.position.array;
  this._chunkNorms = this._chunkGeo.attributes.normal.array;
  this._tmpVector = utils.allocateTyped(Float32Array, chunkSize * VEC_SIZE);
}

Simple2CCylindersGeometry.prototype = Object.create(ChunkedObjectsGeometry.prototype);
Simple2CCylindersGeometry.prototype.constructor = Simple2CCylindersGeometry;

Simple2CCylindersGeometry.prototype.setItem = function(itemIdx, botPos, topPos, itemRad) {
  const chunkSize = this._chunkSize;
  const firstOffset = chunkSize * 2 * itemIdx * VEC_SIZE;
  const secondOffset = firstOffset + chunkSize * VEC_SIZE;

  const tmpArray = this._tmpVector;
  const geoPos = this._chunkPos;
  const geoNorm = this._chunkNorms;

  centerPos.lerpVectors(botPos, topPos, 0.5);
  const mtx1 = gfxutils.calcCylinderMatrix(botPos, centerPos, itemRad);
  normMtx.getNormalMatrix(mtx1);

  let i = 0;
  let idx;
  for (; i < chunkSize; ++i) {
    idx = i * VEC_SIZE;
    tmpVector.fromArray(geoPos, idx);
    tmpVector.applyMatrix4(mtx1);
    tmpVector.toArray(tmpArray, idx);
  }
  this._positions.set(tmpArray, firstOffset);

  // now shift center to get another part of the cylinder
  centerPos.sub(botPos);
  for (i = 0; i < chunkSize; ++i) {
    idx = i * VEC_SIZE;
    tmpArray[idx] += centerPos.x;
    tmpArray[idx + 1] += centerPos.y;
    tmpArray[idx + 2] += centerPos.z;
  }
  this._positions.set(tmpArray, secondOffset);

  for (i = 0; i < chunkSize; ++i) {
    idx = i * VEC_SIZE;
    tmpVector.fromArray(geoNorm, idx);
    tmpVector.applyMatrix3(normMtx);
    tmpVector.toArray(tmpArray, idx);
  }
  this._normals.set(tmpArray, firstOffset);
  this._normals.set(tmpArray, secondOffset);
};

Simple2CCylindersGeometry.prototype.setColor = function(itemIdx, colorVal1, colorVal2) {
  const first = 2 * itemIdx;
  parentSetColor.call(this, first, colorVal1);

  const second = first + 1;
  parentSetColor.call(this, second, colorVal2);
};

export default Simple2CCylindersGeometry;

