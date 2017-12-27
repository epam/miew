

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
  var vA = new THREE.Vector3();
  var vB = new THREE.Vector3();
  var vC = new THREE.Vector3();

  var uvA = new THREE.Vector2();
  var uvB = new THREE.Vector2();
  var uvC = new THREE.Vector2();

  var barycoord = new THREE.Vector3();

  var intersectionPoint = new THREE.Vector3();

  function uvIntersection(point, p1, p2, p3, uv1, uv2, uv3) {
    THREE.Triangle.barycoordFromPoint(point, p1, p2, p3, barycoord);

    uv1.multiplyScalar(barycoord.x);
    uv2.multiplyScalar(barycoord.y);
    uv3.multiplyScalar(barycoord.z);

    uv1.add(uv2).add(uv3);
    return uv1.clone();
  }

  function checkIntersection(object, raycaster, ray, pA, pB, pC, point) {
    var intersect;
    intersect = ray.intersectTriangle(pA, pB, pC, false, point);

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

    var intersection = checkIntersection(object, raycaster, ray, vA, vB, vC, intersectionPoint);
    if (intersection) {
      if (uv) {
        uvA.fromBufferAttribute(uv, a);
        uvB.fromBufferAttribute(uv, b);
        uvC.fromBufferAttribute(uv, c);
        intersection.uv = uvIntersection(intersectionPoint, vA, vB, vC, uvA, uvB, uvC);
      }
      intersection.face = new THREE.Face3(a, b, c, THREE.Triangle.normal(vA, vB, vC));
      intersection.faceIndex = a;
    }

    return intersection;
  }

  return function(raycaster, intersects) {
    var ray = raycaster.ray;
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

    var a, b, c;
    var index = this.index;
    var position = this.attributes.position;
    var uv = this.attributes.uv;
    var i, l;

    if (index === null) {
      return;
    }
    // indexed buffer geometry
    for (i = 0, l = index.count; i < l; i += 3) {
      a = index.getX(i);
      b = index.getX(i + 1);
      c = index.getX(i + 2);

      var intersection = checkBufferGeometryIntersection(this, raycaster, ray, position, uv, a, b, c);

      if (intersection) {
        intersection.faceIndex = Math.floor(i / 3); // triangle number in indices buffer semantics
        intersects.push(intersection);
      }
    }
  };
}());

export default RaycastableBufferGeometry;

