import * as THREE from 'three';
import selectors from './selectors';
import BiologicalUnit from './BiologicalUnit';

/**
 * Biological assembly.
 *
 * @exports Assembly
 * @constructor
 */

class Assembly extends BiologicalUnit {
  constructor(complex) {
    super(complex);
    this.chains = [];
    this.matrices = [];
  }

  computeBoundaries() {
    super.computeBoundaries();
    // fix up the boundaries
    const { matrices } = this;
    const oldCenter = this._boundaries.boundingSphere.center;
    const oldRad = this._boundaries.boundingSphere.radius;
    const boundingBox = this._boundaries.boundingBox = new THREE.Box3();
    boundingBox.makeEmpty();
    for (let i = 0, n = matrices.length; i < n; ++i) {
      boundingBox.expandByPoint(oldCenter.clone().applyMatrix4(matrices[i]));
    }

    const newRad = boundingBox.max.distanceTo(boundingBox.min) / 2 + oldRad;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    this._boundaries.boundingSphere = new THREE.Sphere().set(center, newRad);
    boundingBox.max.addScalar(oldRad);
    boundingBox.min.subScalar(oldRad);
  }

  /**
   * Mark a chain as belonging to this biological assembly.
   * @param {string} chain - chain identifier, usually a single letter
   */
  addChain(chain) {
    this.chains[this.chains.length] = chain;
  }

  /**
   * Add a transformation matrix.
   * @param {THREE.Matrix4} matrix - transformation matrix
   */
  addMatrix(matrix) {
    this.matrices[this.matrices.length] = matrix;
  }

  getTransforms() {
    return this.matrices;
  }

  finalize() {
    if (this.chains.length > 0) {
      this._selector = selectors.keyword('Chain')(this.chains);
    } else {
      this._selector = selectors.keyword('None')();
    }
  }
}

export default Assembly;
