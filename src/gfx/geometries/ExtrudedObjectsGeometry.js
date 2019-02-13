import * as THREE from 'three';
import utils from '../../utils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';

const VEC_SIZE = 3;
const TRI_SIZE = 3;
const tmpPrev = new THREE.Vector3();
const tmpNext = new THREE.Vector3();

function _createExtrudedChunkGeometry(shape, ringsCount) {
  const geo = new THREE.BufferGeometry();
  const ptsCount = shape.length;
  const totalPts = ptsCount * ringsCount;
  const type = totalPts <= 65536 ? Uint16Array : Uint32Array;
  const facesPerChunk = (ringsCount - 1) * ptsCount * 2;
  const indices = new THREE.BufferAttribute(utils.allocateTyped(type, facesPerChunk * TRI_SIZE), 1);

  let currVtxIdx = 0;
  let currFaceIdx = 0;
  for (let y = 0; y < ringsCount; y++) {
    // faces
    if (y !== ringsCount - 1) {
      for (let i = 0; i < ptsCount; i++) {
        const v1 = currVtxIdx + i;
        const v2 = currVtxIdx + ptsCount + i;
        const v3 = currVtxIdx + ptsCount + (i + 1) % ptsCount;
        const v4 = currVtxIdx + (i + 1) % ptsCount;

        indices.setXYZ(currFaceIdx * TRI_SIZE, v1, v4, v2);
        currFaceIdx++;
        indices.setXYZ(currFaceIdx * TRI_SIZE, v2, v4, v3);
        currFaceIdx++;
      }
    }

    currVtxIdx += ptsCount;
  }

  geo.setIndex(indices);
  const pos = utils.allocateTyped(Float32Array, totalPts * VEC_SIZE);
  geo.addAttribute('position', new THREE.BufferAttribute(pos, VEC_SIZE));

  geo._positions = shape;

  return geo;
}

class ExtrudedObjectsGeometry extends ChunkedObjectsGeometry {
  constructor(shape, ringsCount, chunksCount) {
    const chunkGeo = _createExtrudedChunkGeometry(shape, ringsCount);
    super(chunkGeo, chunksCount);
    this._ringsCount = ringsCount;

    const tmpShape = this._tmpShape = [];
    for (let i = 0; i < shape.length; ++i) {
      tmpShape[i] = new THREE.Vector3();
    }
  }

  setItem(itemIdx, matrices) {
    const shape = this._chunkGeo._positions;
    const ptsCount = shape.length;
    let innerPtIdx = 0;
    const chunkStartIdx = ptsCount * this._ringsCount * itemIdx * VEC_SIZE;

    const positions = this._positions;
    const normals = this._normals;

    const tmpShape = this._tmpShape;
    for (let i = 0, n = matrices.length; i < n; ++i) {
      const mtx = matrices[i];

      for (let j = 0; j < ptsCount; ++j) {
        tmpShape[j].copy(shape[j]).applyMatrix4(mtx);
      }

      for (let j = 0; j < ptsCount; ++j) {
        const point = tmpShape[j];
        const nextPt = tmpShape[(j + 1) % ptsCount];
        const prevPt = tmpShape[(j + ptsCount - 1) % ptsCount];

        const vtxIdx = chunkStartIdx + innerPtIdx;

        positions[vtxIdx] = point.x;
        positions[vtxIdx + 1] = point.y;
        positions[vtxIdx + 2] = point.z;

        tmpPrev.subVectors(point, prevPt).normalize();
        tmpNext.subVectors(point, nextPt).normalize();
        tmpPrev.add(tmpNext).normalize();

        normals[vtxIdx] = tmpPrev.x;
        normals[vtxIdx + 1] = tmpPrev.y;
        normals[vtxIdx + 2] = tmpPrev.z;
        innerPtIdx += VEC_SIZE;
      }
    }
  }
}

export default ExtrudedObjectsGeometry;
