

//////////////////////////////////////////////////////////////////////////////
import * as THREE from 'three';
import selectors from './selectors';
import BioStructure from './BioStructure';
//////////////////////////////////////////////////////////////////////////////

/**
 * Biological assembly.
 *
 * @exports Assembly
 * @constructor
 */
function Assembly(complex) {
  BioStructure.call(this, complex);
  this.chains = [];
  this.matrices = [];
}

Assembly.prototype = Object.create(BioStructure.prototype);
Assembly.prototype.constructor = Assembly;

Assembly.prototype.computeBoundaries = function() {
  BioStructure.prototype.computeBoundaries.call(this);
  // fix up the boundaries
  var matrices = this.matrices;
  var oldCenter = this._boundaries.boundingSphere.center;
  var oldRad = this._boundaries.boundingSphere.radius;
  var boundingBox = this._boundaries.boundingBox = new THREE.Box3();
  boundingBox.makeEmpty();
  for (var i = 0, n = matrices.length; i < n; ++i) {
    boundingBox.expandByPoint(oldCenter.clone().applyMatrix4(matrices[i]));
  }

  var newRad = boundingBox.max.distanceTo(boundingBox.min) / 2 + oldRad;
  this._boundaries.boundingSphere = new THREE.Sphere().set(boundingBox.getCenter(), newRad);
  boundingBox.max.addScalar(oldRad);
  boundingBox.min.subScalar(oldRad);
};

/**
 * Mark a chain as belonging to this biological assembly.
 * @param {string} chain - chain identifier, usually a single letter
 */
Assembly.prototype.addChain = function(chain) {
  this.chains[this.chains.length] = chain;
};

/**
 * Add a transformation matrix.
 * @param {THREE.Matrix4} matrix - transformation matrix
 */
Assembly.prototype.addMatrix = function(matrix) {
  this.matrices[this.matrices.length] = matrix;
};

Assembly.prototype.getTransforms = function() {
  return this.matrices;
};

Assembly.prototype.finalize = function() {
  if (this.chains.length > 0) {
    this._selector = selectors.keyword('Chain')(this.chains);
  } else {
    this._selector = selectors.keyword('None')();
  }
};

export default Assembly;

