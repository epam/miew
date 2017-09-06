import * as THREE from 'three';
import BaseLinesGeometry from './ThickLinesGeometry';

/**
 * This class represents geometry which consists lines. This can build bounding volumes
 * @constructor
 *
 * @param {number}  segmentsCount   Number of segments per chunk.
 */
function LinesGeometry(segmentsCount) {
  BaseLinesGeometry.call(this, segmentsCount);
}

LinesGeometry.prototype = Object.create(BaseLinesGeometry.prototype);
LinesGeometry.prototype.constructor = LinesGeometry;

LinesGeometry.prototype.startUpdate = function() {
  return true;
};

LinesGeometry.prototype.computeBoundingSphere = function() {
  var boundingBox = this.boundingBox;
  // Build bounding sphere
  var radiusSquared = 0.0;
  var center = !boundingBox ? new THREE.Vector3() : boundingBox.getCenter();
  var positions = this._positions;
  var sphere = this.boundingSphere || new THREE.Sphere();
  var size = this._positions.length;
  var pos = new THREE.Vector3();
  var posSize = this.getPositionSize();
  for (var i = 0; i < size; i += posSize) {
    pos.set(positions[i], positions[i + 1], positions[i + 2]);
    var lengthSquared = center.distanceToSquared(pos);
    if (radiusSquared < lengthSquared) {
      radiusSquared = lengthSquared;
    }
  }
  sphere.set(center, Math.sqrt(radiusSquared));
  this.boundingSphere = sphere;
};

LinesGeometry.prototype.computeBoundingBox = function() {
  var positions = this._positions;
  var box = new THREE.Box3();
  var size = this._positions.length;
  var tmpVec = new THREE.Vector3();
  var posSize = this.getPositionSize();
  for (var i = 0; i < size; i += posSize) {
    tmpVec.set(positions[i], positions[i + 1], positions[i + 2]);
    box.expandByPoint(tmpVec);
  }
  this.boundingBox = box;
};

LinesGeometry.prototype.finalize = function() {
  this.finishUpdate();
  // TODO compute bounding box?
  this.computeBoundingSphere();
};

export default LinesGeometry;

