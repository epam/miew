import * as THREE from 'three';
import utils from '../../utils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';

const VEC_SIZE = 3;
const TRI_SIZE = 3;
const tmpPrev = new THREE.Vector3();
const tmpNext = new THREE.Vector3();
const tmpRes = new THREE.Vector3();
const simpleNormal = new THREE.Vector3(1.0, 0.0, 0.0);
const normalOnCut = new THREE.Vector3();
const nearRingPt = new THREE.Vector3();

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
        const v3 = currVtxIdx + ptsCount + ((i + 1) % ptsCount);
        const v4 = currVtxIdx + ((i + 1) % ptsCount);

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
  geo.setAttribute('position', new THREE.BufferAttribute(pos, VEC_SIZE));

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

  setItem(itemIdx, matrices, hasSlope = false, hasCut = false) {
    const ptsCount = this._chunkGeo._positions.length;
    const ringsCount = this._ringsCount;
    const chunkStartIdx = ptsCount * this._ringsCount * itemIdx * VEC_SIZE;

    this._setPoints(matrices, ptsCount, ringsCount, chunkStartIdx);

    if (hasSlope) {
      this._setSlopeNormals(ptsCount, ringsCount, chunkStartIdx);
    } else {
      this._setBaseNormals(ptsCount, ringsCount, chunkStartIdx);
    }

    if (hasCut) {
      this._addCut(ptsCount, ringsCount, chunkStartIdx);
    }
  }

  _setPoints(matrices, ptsCount, ringsCount, chunkStartIdx) {
    const tmpShape = this._tmpShape;
    const positions = this._positions;
    const shape = this._chunkGeo._positions;

    for (let i = 0, vtxIdx = chunkStartIdx; i < ringsCount; ++i) {
      const mtx = matrices[i];

      for (let j = 0; j < ptsCount; ++j, vtxIdx += VEC_SIZE) {
        tmpShape[j].copy(shape[j]).applyMatrix4(mtx).toArray(positions, vtxIdx);
      }
    }
  }

  _setBaseNormals(ptsCount, ringsCount, chunkStartIdx) {
    const nPtsInRing = ptsCount * VEC_SIZE;

    for (let i = 0, vtxIdx = chunkStartIdx; i < ringsCount; ++i, vtxIdx += nPtsInRing) {
      this._countNormalsInRing(ptsCount, vtxIdx, false);
    }
  }

  _setSlopeNormals(ptsCount, ringsCount, chunkStartIdx) {
    const normals = this._normals;
    const nPtsInRing = ptsCount * VEC_SIZE;

    let vtxIdx = chunkStartIdx;
    // First ring
    // In all cases, besides cut, second ring is coincident to first. So values of first ring's normals doesn't
    // matter (In the cut case special handler will be applied later and will set them to correct values)
    for (let j = 0; j < ptsCount; ++j, vtxIdx += VEC_SIZE) {
      simpleNormal.toArray(normals, vtxIdx);
    }
    // second ring
    // If it isn't first Item we take normals' values from the last ring of the previous item (these rings are coincident)
    // else we count normals' values based on next ring information
    if (vtxIdx - 2 * nPtsInRing > 0) {
      for (let j = 0; j < ptsCount; ++j, vtxIdx += VEC_SIZE) {
        tmpRes.fromArray(normals, vtxIdx - 2 * nPtsInRing).toArray(normals, vtxIdx);
      }
    } else {
      this._countNormalsInRing(ptsCount, vtxIdx, true, +nPtsInRing);
      vtxIdx += nPtsInRing;
    }
    // other rings
    // we count normals' values based on previous ring information
    for (let i = 2; i < ringsCount; ++i, vtxIdx += nPtsInRing) {
      this._countNormalsInRing(ptsCount, vtxIdx, true, -nPtsInRing);
    }
  }

  // Counting normals:
  // - Slope
  //   Radius changes throught part => normals aren't parallel with the plane contains section points
  //   normal = vTangentInSectionPlane x vToSuchPointInPrevSection (all vectors are scaled for being 1 in length)
  // - No slope
  //   Radius doesn't change throught part => normals are parallel with the plane contains section points
  //   normal = vToPrevPointInSection + vToNextPointInSection (all vectors are scaled for being 1 in length)
  _countNormalsInRing(ptsCount, vtxIdx, isSlope, shiftToExtraPt) {
    const tmpShape = this._tmpShape;
    const normals = this._normals;

    tmpShape[0].fromArray(this._positions, vtxIdx);
    tmpShape[ptsCount - 1].fromArray(this._positions, vtxIdx + (ptsCount - 1) * VEC_SIZE);

    for (let j = 0; j < ptsCount; ++j, vtxIdx += VEC_SIZE) {
      if (j < ptsCount - 1) {
        tmpShape[j + 1].fromArray(this._positions, vtxIdx + VEC_SIZE);
      }

      if (isSlope) {
        nearRingPt.fromArray(this._positions, vtxIdx + shiftToExtraPt);

        tmpPrev.subVectors(tmpShape[(j + ptsCount - 1) % ptsCount], tmpShape[(j + 1) % ptsCount]).normalize();
        tmpNext.subVectors(tmpShape[j], nearRingPt).normalize();
        tmpRes.crossVectors(tmpNext, tmpPrev).normalize().toArray(normals, vtxIdx);
      } else {
        tmpPrev.subVectors(tmpShape[j], tmpShape[(j + ptsCount - 1) % ptsCount]).normalize();
        tmpNext.subVectors(tmpShape[j], tmpShape[(j + 1) % ptsCount]).normalize();
        tmpRes.addVectors(tmpPrev, tmpNext).normalize().toArray(normals, vtxIdx);
      }
    }
  }

  _addCut(ptsCount, ringsCount, chunkStartIdx) {
    // Nothing to do if item is flat or only line
    if (ptsCount < 3 || ringsCount < 2) {
      return;
    }
    const positions = this._positions;
    const normals = this._normals;
    const tmpShape = this._tmpShape;
    const nPtsInRing = ptsCount * VEC_SIZE;

    // Normal to the cut plane is equal to cross product of two vectors which are lying in it
    tmpShape[0].fromArray(positions, chunkStartIdx);
    tmpShape[1].fromArray(positions, chunkStartIdx + VEC_SIZE);
    tmpShape[2].fromArray(positions, chunkStartIdx + 2 * VEC_SIZE);

    tmpPrev.subVectors(tmpShape[1], tmpShape[0]).normalize();
    tmpNext.subVectors(tmpShape[1], tmpShape[2]).normalize();
    normalOnCut.crossVectors(tmpPrev, tmpNext).normalize();

    let vtxIdx = chunkStartIdx;
    // First and second rings normals' values are equal to value of normal to the cutting plane
    for (let j = 0; j < ptsCount * 2; ++j, vtxIdx += VEC_SIZE) {
      normalOnCut.toArray(normals, vtxIdx);
    }
    if (ringsCount > 2) {
      // Third ring points are coincident to first ring points, but have different normals. It makes sharp angle near cut
      for (let j = 0; j < ptsCount; ++j, vtxIdx += VEC_SIZE) {
        tmpRes.fromArray(positions, vtxIdx - nPtsInRing).toArray(positions, vtxIdx);
      }
    }
  }
}

export default ExtrudedObjectsGeometry;
