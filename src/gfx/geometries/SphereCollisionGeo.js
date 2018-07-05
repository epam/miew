

import * as THREE from 'three';

//////////////////////////////////////////////////////////////////////////////


class CollisionSphere {
  constructor(position, radius) {
    this._position = position;
    this._radius = radius;
  }

  static _sphere = new THREE.Sphere();

  raycast(raycaster) {

    CollisionSphere._sphere.set(this._position, this._radius);

    const p = raycaster.ray.intersectSphere(CollisionSphere._sphere);
    if (p) {
      return {
        distance: raycaster.ray.origin.distanceTo(p),
        point: p
      };
    }
    return null;
  }
}

//////////////////////////////////////////////////////////////////////////////

function SphereCollisionGeo(count) {
  this._objects = new Array(count);
  this.boundingSphere = null;
  this.boundingBox = null;
}

SphereCollisionGeo.constructor = SphereCollisionGeo;

SphereCollisionGeo.prototype.setSphere = function(idx, position, radius) {
  this._objects[idx] = new CollisionSphere(position, radius);
};

SphereCollisionGeo.prototype.raycast = function(raycaster, intersects) {
  // TODO raycast with bounding sphere? How to deal with updates?
  for (var i = 0, n = this._objects.length; i < n; ++i) {
    var inters = this._objects[i].raycast(raycaster);
    if (inters) {
      inters.chunkIdx = i;
      intersects.push(inters);
    }
  }
};

SphereCollisionGeo.prototype.computeBoundingBox = function() {
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

SphereCollisionGeo.prototype.computeBoundingSphere = function() {
  this.computeBoundingBox();
  var objects = this._objects;
  var boundingBox = this.boundingBox;
  // Build bounding sphere
  var radiusSquared = 0.0;
  var center = new THREE.Vector3();
  boundingBox.getCenter(center);
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

export default SphereCollisionGeo;
