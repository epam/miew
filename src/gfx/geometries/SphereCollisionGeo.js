import * as THREE from 'three';

class CollisionSphere {
  constructor(position, radius) {
    this._position = position;
    this._radius = radius;
  }

  static _sphere = new THREE.Sphere();

  raycast(raycaster) {
    const sphere = CollisionSphere._sphere;
    sphere.set(this._position, this._radius);

    const p = new THREE.Vector3();
    if (raycaster.ray.intersectSphere(sphere, p)) {
      return {
        distance: raycaster.ray.origin.distanceTo(p),
        point: p,
      };
    }
    return null;
  }
}

const SphereCollisionGeo = (base) => class extends base {
  constructor(count, ...args) {
    super(...args);
    this._objects = new Array(count);
    this.boundingSphere = null;
    this.boundingBox = null;
  }

  setSphere(idx, position, radius) {
    this._objects[idx] = new CollisionSphere(position, radius);
  }

  raycast(raycaster, intersects) {
    // TODO raycast with bounding sphere? How to deal with updates?
    for (let i = 0, n = this._objects.length; i < n; ++i) {
      const inters = this._objects[i].raycast(raycaster);
      if (inters) {
        inters.chunkIdx = i;
        intersects.push(inters);
      }
    }
  }

  computeBoundingBox() {
    const objects = this._objects;
    let { boundingBox } = this;
    if (boundingBox === null) {
      this.boundingBox = boundingBox = new THREE.Box3();
    }
    boundingBox.makeEmpty();
    for (let i = 0, n = objects.length; i < n; ++i) {
      boundingBox.expandByPoint(objects[i]._position);
    }
  }

  computeBoundingSphere() {
    this.computeBoundingBox();
    const objects = this._objects;
    const { boundingBox } = this;
    // Build bounding sphere
    let radiusSquared = 0.0;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    for (let i = 0, n = objects.length; i < n; ++i) {
      const pos = objects[i]._position;
      const lengthSquared = center.distanceToSquared(pos);
      if (radiusSquared < lengthSquared) {
        radiusSquared = lengthSquared;
      }
    }
    if (this.boundingSphere === null) {
      this.boundingSphere = new THREE.Sphere();
    }
    this.boundingSphere.set(center, Math.sqrt(radiusSquared));
  }
};
export default SphereCollisionGeo;
