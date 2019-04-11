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

  setItem(itemIdx, matrices, hasSlope = false, hasCut = false) {
    const shape = this._chunkGeo._positions;
    const ptsCount = shape.length;
    let innerPtIdx = 0;
    const chunkStartIdx = ptsCount * this._ringsCount * itemIdx * VEC_SIZE;

    const positions = this._positions;
    const normals = this._normals;
    const nPtsInRing = ptsCount * VEC_SIZE;


    const tmpShape = this._tmpShape;
    for (let i = 0, n = matrices.length; i < n; ++i) {
      const mtx = matrices[i];

      for (let j = 0; j < ptsCount; ++j) {
        tmpShape[j].copy(shape[j]).applyMatrix4(mtx);
      }

      for (let j = 0; j < ptsCount; ++j, innerPtIdx += VEC_SIZE) {
        const point = tmpShape[j];
        const nxPt = tmpShape[(j + 1) % ptsCount];
        const prPt = tmpShape[(j + ptsCount - 1) % ptsCount];

        const vtxIdx = chunkStartIdx + innerPtIdx;
        const prRingPt = new THREE.Vector3().fromArray(positions, vtxIdx - nPtsInRing);
        const normInPrevRingPt = new THREE.Vector3().fromArray(normals, vtxIdx - nPtsInRing);
        const prPrRingNormal = new THREE.Vector3().fromArray(normals, vtxIdx - 2 * nPtsInRing);

        point.toArray(positions, vtxIdx);
        this._countNormals(point, nxPt, prPt, prRingPt, prPrRingNormal, (i === 1), hasSlope).toArray(normals, vtxIdx);

        if (!hasCut) {
          continue;
        }

        // zero and first sections lies in one plane and normals for all their points are orthogonal with this plane
        // second section points are shifted into first section points for having sharp angle on the end of cut
        switch (i) {
          case 0:
            tmpPrev.subVectors(point, prPt).normalize();
            tmpNext.subVectors(point, nxPt).normalize();
            tmpPrev.crossVectors(tmpNext, tmpPrev).normalize();

            tmpPrev.toArray(normals, vtxIdx);
            break;
          case 1:
            normInPrevRingPt.toArray(normals, vtxIdx);
            break;
          case 2:
            prRingPt.toArray(positions, vtxIdx);
            break;
          default:
            break;
        }
      }
    }
  }

  // Counting normals:
  // - No slope
  //   Radius doesn't change throught part => normals are parallel with the plane contains section points
  //   normal = vToPrevPointInSection + vToNextPointInSection (all vectors are scaled for being 1 in length)
  // - Slope
  //   Radius changes throught part => normals aren't parallel with the plane contains section points
  //   normal = vTangentInSectionPlane x vToSuchPointInPrevSection (all vectors are scaled for being 1 in length)

  _countNormals(point, nextPt, prevPt, prevRingPt, prevPrevRingNormal, isFirstRing, hasSlope) {
    if (hasSlope) {
      if (isFirstRing) {
        // first section is equal to last section of previous part so we takes normals from it
        return prevPrevRingNormal;
      }
      // zero and first sections are equal so we will have tmpNext = 0 for the first section
      // so we count normals with another way for it
      tmpPrev.subVectors(prevPt, nextPt).normalize();
      tmpNext.subVectors(point, prevRingPt).normalize();
      return new THREE.Vector3().crossVectors(tmpPrev, tmpNext).normalize();
    }

    tmpPrev.subVectors(point, prevPt).normalize();
    tmpNext.subVectors(point, nextPt).normalize();
    return new THREE.Vector3().addVectors(tmpPrev, tmpNext).normalize();
  }
}

export default ExtrudedObjectsGeometry;
