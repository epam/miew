import * as THREE from 'three';
import utils from '../../utils';
import gfxutils from '../gfxutils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';

const VEC_SIZE = 3;
const centerPos = new THREE.Vector3();
const tmpVector = new THREE.Vector3();
const normMtx = new THREE.Matrix3();

class Simple2CCylindersGeometry extends ChunkedObjectsGeometry {
  constructor(instanceCount, polyComplexity) {
    const cylGeometry = new THREE.CylinderGeometry(1, 1, 1.0, Math.max(3, polyComplexity), 2, true);
    super(cylGeometry, 2 * instanceCount);

    const chunkSize = this._chunkSize;
    this._chunkPos = this._chunkGeo.attributes.position.array;
    this._chunkNorms = this._chunkGeo.attributes.normal.array;
    this._tmpVector = utils.allocateTyped(Float32Array, chunkSize * VEC_SIZE);
  }

  setItem(itemIdx, botPos, topPos, itemRad) {
    const chunkSize = this._chunkSize;
    const firstOffset = chunkSize * 2 * itemIdx * VEC_SIZE;
    const secondOffset = firstOffset + chunkSize * VEC_SIZE;

    const tmpArray = this._tmpVector;
    const geoPos = this._chunkPos;
    const geoNorm = this._chunkNorms;

    centerPos.lerpVectors(botPos, topPos, 0.5);
    const mtx1 = gfxutils.calcCylinderMatrix(botPos, centerPos, itemRad);
    normMtx.getNormalMatrix(mtx1);

    let idx;
    for (let i = 0; i < chunkSize; ++i) {
      idx = i * VEC_SIZE;
      tmpVector.fromArray(geoPos, idx);
      tmpVector.applyMatrix4(mtx1);
      tmpVector.toArray(tmpArray, idx);
    }
    this._positions.set(tmpArray, firstOffset);

    // now shift center to get another part of the cylinder
    centerPos.sub(botPos);
    for (let i = 0; i < chunkSize; ++i) {
      idx = i * VEC_SIZE;
      tmpArray[idx] += centerPos.x;
      tmpArray[idx + 1] += centerPos.y;
      tmpArray[idx + 2] += centerPos.z;
    }
    this._positions.set(tmpArray, secondOffset);

    for (let i = 0; i < chunkSize; ++i) {
      idx = i * VEC_SIZE;
      tmpVector.fromArray(geoNorm, idx);
      tmpVector.applyMatrix3(normMtx);
      tmpVector.toArray(tmpArray, idx);
    }
    this._normals.set(tmpArray, firstOffset);
    this._normals.set(tmpArray, secondOffset);
  }

  setColor(itemIdx, colorVal1, colorVal2) {
    const first = 2 * itemIdx;
    super.setColor(first, colorVal1);

    const second = first + 1;
    super.setColor(second, colorVal2);
  }
}

export default Simple2CCylindersGeometry;
