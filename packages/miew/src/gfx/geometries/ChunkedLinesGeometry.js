import LinesGeometry from './LinesGeometry';
import CylinderCollisionGeo from './CylinderCollisionGeo';

const COLLISION_RAD = 0.1;

/**
 * This class represents geometry which consists of separate chunks.
 * Each chunk has same index and similar geometry with equal points and faces count.
 * Each chunk has by default only one color.
 * @constructor
 *
 * @param {number}  chunksCount     Total chunks count.
 * @param {number}  segmentsCount   Number of segments per chunk.
 * @param {boolean} enableCollision Enable or disable collision where each segment is
 *                                  a collidable cylinder.
 * collision geometry.
 */
class ChunkedLinesGeometry extends LinesGeometry {
  constructor(chunksCount, segmentsCount, enableCollision) {
    super(chunksCount * segmentsCount);
    this._init(segmentsCount);
    this._collisionGeo = enableCollision ? new CylinderCollisionGeo(chunksCount * segmentsCount, 3) : null;
  }

  startUpdate() {
    return true;
  }

  computeBoundingSphere() {
    const collisionGeo = this._collisionGeo;
    if (collisionGeo) {
      collisionGeo.computeBoundingSphere();
      this.boundingSphere = collisionGeo.boundingSphere;
      return;
    }
    super.computeBoundingSphere();
  }

  computeBoundingBox() {
    const collisionGeo = this._collisionGeo;
    if (collisionGeo) {
      collisionGeo.computeBoundingBox();
      this.boundingBox = collisionGeo.boundingBox;
      return;
    }
    super.computeBoundingBox();
  }

  raycast(raycaster, intersects) {
    const collisionGeo = this._collisionGeo;
    if (!collisionGeo) {
      return;
    }
    const segCount = this._chunkSize;
    this._collisionGeo.raycast(raycaster, intersects);
    for (let i = 0, n = intersects.length; i < n; ++i) {
      let { chunkIdx } = intersects[i];
      if (chunkIdx === undefined) {
        continue;
      }
      chunkIdx = (chunkIdx / segCount) | 0;
      intersects[i].chunkIdx = chunkIdx;
    }
  }

  setColor(chunkIdx, colorVal) {
    const chunkSize = this._chunkSize;
    for (let i = chunkIdx * chunkSize, end = i + chunkSize; i < end; ++i) {
      super.setColor(i, colorVal);
    }
  }

  setSegment(chunkIdx, segIdx, pos1, pos2) {
    const chunkSize = this._chunkSize;
    const idx = chunkIdx * chunkSize + segIdx;
    super.setSegment(idx, pos1, pos2);
    if (this._collisionGeo) {
      this._collisionGeo.setItem(chunkIdx * chunkSize + segIdx, pos1, pos2, COLLISION_RAD);
    }
  }

  finalize() {
    this.finishUpdate();
    this.computeBoundingSphere();
  }

  setOpacity(chunkIndices, value) {
    const chunkSize = this._chunkSize;
    for (let i = 0, n = chunkIndices.length; i < n; ++i) {
      const left = chunkIndices[i] * chunkSize;
      super.setOpacity(left, left + chunkSize - 1, value);
    }
  }

  getSubset(chunkIndices) {
    const instanceCount = chunkIndices.length;
    const chunkSize = this._chunkSize;
    const subset = new ChunkedLinesGeometry(instanceCount, chunkSize, false);
    for (let i = 0, n = chunkIndices.length; i < n; ++i) {
      const dstPtOffset = i * chunkSize;
      const startSegIdx = chunkIndices[i] * chunkSize;
      subset.setSegments(dstPtOffset, this.getSubsetSegments(startSegIdx, chunkSize));
      subset.setColors(dstPtOffset, this.getSubsetColors(startSegIdx, chunkSize));
    }

    subset.boundingSphere = this.boundingSphere;
    subset.boundingBox = this.boundingBox;
    return [subset];
  }

  _init(chunkSize) {
    this._chunkSize = chunkSize;
  }
}

export default ChunkedLinesGeometry;
