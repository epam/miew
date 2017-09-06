import * as THREE from 'three';
import ChunkedLinesGeometry from './ChunkedLinesGeometry';
import SphereCollisionGeo from './SphereCollisionGeo';

var vectors = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];
var vecCount = vectors.length;
var tempPos1 = new THREE.Vector3();
var tempPos2 = new THREE.Vector3();
// var VEC_SIZE = 3;

function CrossGeometry(chunksCount) {
  ChunkedLinesGeometry.call(this, chunksCount, (vecCount / 2) | 0, false);

  this._collisionGeo = new SphereCollisionGeo(chunksCount);
}

CrossGeometry.prototype = Object.create(ChunkedLinesGeometry.prototype);
CrossGeometry.prototype.constructor = CrossGeometry;

CrossGeometry.prototype.computeBoundingSphere = function() {
  this._collisionGeo.computeBoundingSphere();
  //this.boundingSphere = this._collisionGeo.boundingSphere;
  this.boundingSphere = this._collisionGeo.boundingSphere;
};

CrossGeometry.prototype.computeBoundingBox = function() {
  this._collisionGeo.computeBoundingBox();
  //this.boundingBox = this._collisionGeo.boundingBox;
  this.boundingBox = this._collisionGeo.boundingBox;
};

CrossGeometry.prototype.raycast = function(raycaster, intersects) {
  this._collisionGeo.raycast(raycaster, intersects);
};

CrossGeometry.prototype.setItem = function(itemIdx, itemPos, itemRad) {
  this._collisionGeo.setSphere(itemIdx, itemPos, itemRad);

  var offset = itemIdx * this._chunkSize;
  for (var i = 0; i < vecCount / 2; ++i) {
    var first = i * 2;
    tempPos1.x = itemPos.x + vectors[first].x * itemRad;
    tempPos1.y = itemPos.y + vectors[first].y * itemRad;
    tempPos1.z = itemPos.z + vectors[first].z * itemRad;
    var second = first + 1;
    tempPos2.x = itemPos.x + vectors[second].x * itemRad;
    tempPos2.y = itemPos.y + vectors[second].y * itemRad;
    tempPos2.z = itemPos.z + vectors[second].z * itemRad;
    this.parent.setSegment.call(this, offset + i, tempPos1, tempPos2);
  }
};

export default CrossGeometry;

