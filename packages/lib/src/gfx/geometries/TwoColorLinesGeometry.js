import * as THREE from 'three';
import LinesGeometry from './LinesGeometry';
import Simple2CCylindersGeometry from './Simple2CCylindersGeometry';

const COLLISION_RAD = 0.3;
const tmpVector = new THREE.Vector3();

class TwoColorLinesGeometry extends LinesGeometry {
  constructor(segmentsCount) {
    super(segmentsCount * 2);
    this._init(segmentsCount);
    this._collisionGeo = new Simple2CCylindersGeometry(segmentsCount, 3);
  }

  setItem(itemIdx, botPos, topPos) {
    this._collisionGeo.setItem(itemIdx, botPos, topPos, COLLISION_RAD);
    const offset = 2 * itemIdx;// there are two points per segment
    tmpVector.lerpVectors(botPos, topPos, 0.5);
    super.setSegment(offset, botPos, tmpVector);
    super.setSegment(offset + 1, tmpVector, topPos);
  }

  setColor(itemIdx, colorVal1, colorVal2) {
    const offset = 2 * itemIdx;// there are two points per segment
    super.setColor(offset, colorVal1);
    super.setColor(offset + 1, colorVal2);
  }

  raycast(raycaster, intersects) {
    if (this._collisionGeo) {
      this._collisionGeo.raycast(raycaster, intersects);
    }
  }

  getSubset(segmentIndices) {
    const instanceCount = segmentIndices.length;
    const subset = new TwoColorLinesGeometry(instanceCount, false);
    for (let i = 0, n = instanceCount; i < n; ++i) {
      const startSegIdx = segmentIndices[i];
      subset.setSegments(i, this.getSubsetSegments(startSegIdx, 1));
      subset.setColors(i, this.getSubsetColors(startSegIdx, 1));
    }

    subset.boundingSphere = this.boundingSphere;
    subset.boundingBox = this.boundingBox;
    return [subset];
  }

  _init(segmentsCount) {
    this._segCounts = segmentsCount * 2;
  }
}
// (???)parent = LinesGeometry.prototype;

export default TwoColorLinesGeometry;
