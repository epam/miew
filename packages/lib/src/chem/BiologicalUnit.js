import * as THREE from 'three';
import selectors from './selectors';

/**
 * Basic biological unit class.
 *
 * @exports BiologicalUnit
 * @constructor
 */
class BiologicalUnit {
  constructor(complex) {
    this._complex = complex;
    this._selector = selectors.keyword('All')();
    this._boundaries = {
      boundingBox: new THREE.Box3(),
      boundingSphere: new THREE.Sphere(),
    };
  }

  computeBoundaries() {
    const atoms = this._complex._atoms;
    const n = atoms.length;
    const selector = this._selector;

    const { boundingBox } = this._boundaries;
    boundingBox.makeEmpty();
    if (n === 1) {
      boundingBox.expandByPoint(atoms[0].position);
      const bbc = new THREE.Vector3();
      boundingBox.getCenter(bbc);
      const s = 2 * atoms[0].element.radius;
      boundingBox.setFromCenterAndSize(bbc, new THREE.Vector3(s, s, s));
    } else {
      for (let i = 0; i < n; ++i) {
        if (selector.includesAtom(atoms[i])) {
          boundingBox.expandByPoint(atoms[i].position);
        }
      }
    }

    // Build bounding sphere
    let radiusSquared = 0.0;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    if (n === 1) {
      this._boundaries.boundingSphere.set(center, atoms[0].element.radius);
    } else {
      for (let i = 0; i < n; ++i) {
        if (!selector.includesAtom(atoms[i])) {
          continue;
        }
        const pos = atoms[i].position;
        const lengthSquared = center.distanceToSquared(pos);
        if (radiusSquared < lengthSquared) {
          radiusSquared = lengthSquared;
        }
      }
      this._boundaries.boundingSphere.set(center, Math.sqrt(radiusSquared));
    }
  }

  getTransforms() {
    return [];
  }

  getSelector() {
    return this._selector;
  }

  getBoundaries() {
    return this._boundaries;
  }

  finalize() {
  }
}

export default BiologicalUnit;
