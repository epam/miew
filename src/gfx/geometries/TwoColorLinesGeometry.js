import * as THREE from 'three';
import LinesGeometry from './LinesGeometry';
import Simple2CCylindersGeometry from './Simple2CCylindersGeometry';

const COLLISION_RAD = 0.3;
const tmpVector = new THREE.Vector3();

function TwoColorLinesGeometry(segmentsCount) {
  LinesGeometry.call(this, segmentsCount * 2);
  this._init(segmentsCount);
  this._collisionGeo = new Simple2CCylindersGeometry(segmentsCount, 3);
}

TwoColorLinesGeometry.prototype = Object.create(LinesGeometry.prototype);
TwoColorLinesGeometry.prototype.constructor = TwoColorLinesGeometry;
TwoColorLinesGeometry.prototype.parent = LinesGeometry.prototype;

TwoColorLinesGeometry.prototype.raycast = function(raycaster, intersects) {
  this._collisionGeo.raycast(raycaster, intersects);
};

TwoColorLinesGeometry.prototype.setItem = function(itemIdx, botPos, topPos) {
  this._collisionGeo.setItem(itemIdx, botPos, topPos, COLLISION_RAD);
  const offset = 2 * itemIdx;// there are two points per segment
  tmpVector.lerpVectors(botPos, topPos, 0.5);
  this.parent.setSegment.call(this, offset, botPos, tmpVector);
  this.parent.setSegment.call(this, offset + 1, tmpVector, topPos);
};

TwoColorLinesGeometry.prototype.setColor = function(itemIdx, colorVal1, colorVal2) {
  const offset = 2 * itemIdx;// there are two points per segment
  this.parent.setColor.call(this, offset, colorVal1);
  this.parent.setColor.call(this, offset + 1, colorVal2);
};

TwoColorLinesGeometry.prototype.raycast = function(raycaster, intersects) {
  const collisionGeo = this._collisionGeo;
  if (!collisionGeo)  {
    return;
  }
  this._collisionGeo.raycast(raycaster, intersects);
};

TwoColorLinesGeometry.prototype.getSubset = function(segmentIndices) {
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
};

TwoColorLinesGeometry.prototype._init = function(segmentsCount) {
  this._segCounts = segmentsCount * 2;
};

export default TwoColorLinesGeometry;

