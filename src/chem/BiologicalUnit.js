import * as THREE from 'three';
import selectors from './selectors';

/**
 * Basic biological unit class.
 *
 * @exports BiologicalUnit
 * @constructor
 */
function BiologicalUnit(complex) {
  this._complex = complex;
  this._selector = selectors.keyword('All')();
  this._boundaries = {
    boundingBox: new THREE.Box3(),
    boundingSphere: new THREE.Sphere()
  };
}

BiologicalUnit.prototype.constructor = BiologicalUnit;

BiologicalUnit.prototype.computeBoundaries = function() {
  const atoms = this._complex._atoms;
  const n = atoms.length;
  const selector = this._selector;

  const boundingBox = this._boundaries.boundingBox;
  boundingBox.makeEmpty();
  if (n === 1) {
    boundingBox.expandByPoint(atoms[0]._position);
    const bbc = new THREE.Vector3();
    boundingBox.getCenter(bbc);
    const s = 2 * atoms[0].element.radius; //*settings.now.modes.BS.atom; FIXME N: hack commented
    boundingBox.setFromCenterAndSize(bbc, new THREE.Vector3(s, s, s));
  } else {
    for (let i = 0; i < n; ++i) {
      if (selector.includesAtom(atoms[i])) {
        boundingBox.expandByPoint(atoms[i]._position);
      }
    }
  }

  // Build bounding sphere
  let radiusSquared = 0.0;
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  if (n === 1) {
    // * settings.now.modes.BS.atom); FIXME N: hack commented
    this._boundaries.boundingSphere.set(center, atoms[0].element.radius);
  } else {
    for (let i = 0; i < n; ++i) {
      if (!selector.includesAtom(atoms[i])) {
        continue;
      }
      const pos = atoms[i]._position;
      const lengthSquared = center.distanceToSquared(pos);
      if (radiusSquared < lengthSquared) {
        radiusSquared = lengthSquared;
      }
    }
    this._boundaries.boundingSphere.set(center, Math.sqrt(radiusSquared));
  }
};

BiologicalUnit.prototype.getTransforms = function() {
  return [];
};

BiologicalUnit.prototype.getSelector = function() {
  return this._selector;
};

BiologicalUnit.prototype.getBoundaries = function() {
  return this._boundaries;
};

BiologicalUnit.prototype.finalize = function() {
};

export default BiologicalUnit;

