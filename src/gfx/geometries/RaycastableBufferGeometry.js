

import * as THREE from 'three';

/**
 * This class adds raycasting interface to indexed
 * THREE.BufferGeometry.
 * @constructor
 */
function RaycastableBufferGeometry() {
  THREE.BufferGeometry.call(this);
}

RaycastableBufferGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
RaycastableBufferGeometry.prototype.constructor = RaycastableBufferGeometry;

RaycastableBufferGeometry.prototype.raycast = (function() {
  // This method was copied from three.js
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();

  const uvA = new THREE.Vector2();
  const uvB = new THREE.Vector2();
  const uvC = new THREE.Vector2();

  const barycoord = new THREE.Vector3();

  const intersectionPoint = new THREE.Vector3();

  function uvIntersection(point, p1, p2, p3, uv1, uv2, uv3) {
    THREE.Triangle.barycoordFromPoint(point, p1, p2, p3, barycoord);

    uv1.multiplyScalar(barycoord.x);
    uv2.multiplyScalar(barycoord.y);
    uv3.multiplyScalar(barycoord.z);

    uv1.add(uv2).add(uv3);
    return uv1.clone();
  }

  function checkIntersection(object, raycaster, ray, pA, pB, pC, point) {
    //let intersect;
    const intersect = ray.intersectTriangle(pA, pB, pC, false, point);

    if (intersect === null) {
      return null;
    }

    return {
      point: point.clone()
    };
  }

  function checkBufferGeometryIntersection(object, raycaster, ray, position, uv, a, b, c) {
    vA.fromBufferAttribute(position, a);
    vB.fromBufferAttribute(position, b);
    vC.fromBufferAttribute(position, c);

    const intersection = checkIntersection(object, raycaster, ray, vA, vB, vC, intersectionPoint);
    if (intersection) {
      if (uv) {
        uvA.fromBufferAttribute(uv, a);
        uvB.fromBufferAttribute(uv, b);
        uvC.fromBufferAttribute(uv, c);
        intersection.uv = uvIntersection(intersectionPoint, vA, vB, vC, uvA, uvB, uvC);
      }
      const normal = new THREE.Vector3();
      THREE.Triangle.getNormal(vA, vB, vC, normal);
      intersection.face = new THREE.Face3(a, b, c, normal);
      intersection.faceIndex = a;
    }

    return intersection;
  }

  return function(raycaster, intersects) {
    const ray = raycaster.ray;
    if (this.boundingSphere === null) {
      this.computeBoundingSphere();
    }

    if (raycaster.ray.intersectsSphere(this.boundingSphere) === false) {
      return;
    }

    if (this.boundingBox !== null) {
      if (ray.intersectsBox(this.boundingBox) === false) {
        return;
      }
    }

    let a, b, c;
    const index = this.index;
    const position = this.attributes.position;
    const uv = this.attributes.uv;
    let i, l;

    if (index === null) {
      return;
    }
    // indexed buffer geometry
    for (i = 0, l = index.count; i < l; i += 3) {
      a = index.getX(i);
      b = index.getX(i + 1);
      c = index.getX(i + 2);

      const intersection = checkBufferGeometryIntersection(this, raycaster, ray, position, uv, a, b, c);

      if (intersection) {
        intersection.faceIndex = Math.floor(i / 3); // triangle number in indices buffer semantics
        intersects.push(intersection);
      }
    }
  };
}());

export default RaycastableBufferGeometry;

