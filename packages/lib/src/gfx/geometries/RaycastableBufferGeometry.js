import * as THREE from 'three';

/**
 * This class adds raycasting interface to indexed
 * THREE.BufferGeometry.
 * @constructor
 */

class RaycastableBufferGeometry extends THREE.BufferGeometry {
  // This method was copied from three.js

  static _vA = new THREE.Vector3();

  static _vB = new THREE.Vector3();

  static _vC = new THREE.Vector3();

  static _uvA = new THREE.Vector2();

  static _uvB = new THREE.Vector2();

  static _uvC = new THREE.Vector2();

  static _barycoord = new THREE.Vector3();

  static _intersectionPoint = new THREE.Vector3();

  uvIntersection(point, p1, p2, p3, uv1, uv2, uv3) {
    const barycoord = RaycastableBufferGeometry._barycoord;
    THREE.Triangle.barycoordFromPoint(point, p1, p2, p3, barycoord);

    uv1.multiplyScalar(barycoord.x);
    uv2.multiplyScalar(barycoord.y);
    uv3.multiplyScalar(barycoord.z);

    uv1.add(uv2).add(uv3);
    return uv1.clone();
  }

  checkIntersection(object, raycaster, ray, pA, pB, pC, point) {
    const intersect = ray.intersectTriangle(pA, pB, pC, false, point);

    if (intersect === null) {
      return null;
    }

    return {
      point: point.clone(),
    };
  }

  checkBufferGeometryIntersection(object, raycaster, ray, position, uv, a, b, c) {
    const vA = RaycastableBufferGeometry._vA;
    const vB = RaycastableBufferGeometry._vB;
    const vC = RaycastableBufferGeometry._vC;
    const intersectionPoint = RaycastableBufferGeometry._intersectionPoint;

    vA.fromBufferAttribute(position, a);
    vB.fromBufferAttribute(position, b);
    vC.fromBufferAttribute(position, c);

    const intersection = this.checkIntersection(object, raycaster, ray, vA, vB, vC, intersectionPoint);
    if (intersection) {
      if (uv) {
        const uvA = RaycastableBufferGeometry._uvA;
        const uvB = RaycastableBufferGeometry._uvB;
        const uvC = RaycastableBufferGeometry._uvC;

        uvA.fromBufferAttribute(uv, a);
        uvB.fromBufferAttribute(uv, b);
        uvC.fromBufferAttribute(uv, c);
        intersection.uv = this.uvIntersection(intersectionPoint, vA, vB, vC, uvA, uvB, uvC);
      }
      const normal = new THREE.Vector3();
      THREE.Triangle.getNormal(vA, vB, vC, normal);
      intersection.face = new THREE.Face3(a, b, c, normal);
      intersection.faceIndex = a;
    }

    return intersection;
  }

  raycast(raycaster, intersects) {
    const { ray } = raycaster;
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

    let a;
    let b;
    let c;
    const {
      index,
      attributes: { position, uv },
    } = this;

    if (index === null) {
      return;
    }
    // indexed buffer geometry
    for (let i = 0, l = index.count; i < l; i += 3) {
      a = index.getX(i);
      b = index.getX(i + 1);
      c = index.getX(i + 2);

      const intersection = this.checkBufferGeometryIntersection(this, raycaster, ray, position, uv, a, b, c);

      if (intersection) {
        intersection.faceIndex = Math.floor(i / 3); // triangle number in indices buffer semantics
        intersects.push(intersection);
      }
    }
  }
}

export default RaycastableBufferGeometry;
