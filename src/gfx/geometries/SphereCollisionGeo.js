

import * as THREE from 'three';

//////////////////////////////////////////////////////////////////////////////

function CollisionSphere(position, radius) {
  this._position = position;
  this._radius = radius;
}

CollisionSphere.prototype.raycast = (function() {

  var sphere = new THREE.Sphere();

  return function raycast(raycaster) {

    sphere.set(this._position, this._radius);

    var p = raycaster.ray.intersectSphere(sphere);
    if (p) {
      return {
        distance: raycaster.ray.origin.distanceTo(p),
        point: p
      };
    }
    return null;
  };
}());

//////////////////////////////////////////////////////////////////////////////

function CollisionSpheresGeo(count) {
  this._objects = new Array(count);
  this.boundingSphere = null;
  this.boundingBox = null;
}

CollisionSpheresGeo.constructor = CollisionSpheresGeo;

CollisionSpheresGeo.prototype.setSphere = function(idx, position, radius) {
  this._objects[idx] = new CollisionSphere(position, radius);
};

CollisionSpheresGeo.prototype.raycast = function(raycaster, intersects) {
  // TODO raycast with bounding sphere? How to deal with updates?
  for (var i = 0, n = this._objects.length; i < n; ++i) {
    var inters = this._objects[i].raycast(raycaster);
    if (inters) {
      inters.chunkIdx = i;
      intersects.push(inters);
    }
  }
};

CollisionSpheresGeo.prototype.computeBoundingBox = function() {
  var objects = this._objects;
  var boundingBox = this.boundingBox;
  if (boundingBox === null) {
    this.boundingBox = boundingBox = new THREE.Box3();
  }
  boundingBox.makeEmpty();
  for (var i = 0, n = objects.length; i < n; ++i) {
    boundingBox.expandByPoint(objects[i]._position);
  }
};

CollisionSpheresGeo.prototype.computeBoundingSphere = function() {
  this.computeBoundingBox();
  var objects = this._objects;
  var boundingBox = this.boundingBox;
  // Build bounding sphere
  var radiusSquared = 0.0;
  var center = boundingBox.isEmpty() ? new THREE.Vector3() : boundingBox.getCenter();
  for (var i = 0, n = objects.length; i < n; ++i) {
    var pos = objects[i]._position;
    var lengthSquared = center.distanceToSquared(pos);
    if (radiusSquared < lengthSquared) {
      radiusSquared = lengthSquared;
    }
  }
  if (this.boundingSphere === null) {
    this.boundingSphere = new THREE.Sphere();
  }
  this.boundingSphere.set(center, Math.sqrt(radiusSquared));
};

export default CollisionSpheresGeo;

