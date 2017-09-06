import * as THREE from 'three';
import utils from '../../utils';
import RaycastableBufferGeometry from './RaycastableBufferGeometry';

var POS_RAD_SIZE = 4;
var COLOR_SIZE = 3;
var tmpColor = new THREE.Color();

/**
 * This is a base class for isosurface algorithms.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */
function IsoSurfaceGeometry(spheresCount, opts) {
  RaycastableBufferGeometry.call(this);

  this._opts = opts;
  this.zClip = this._opts.zClip;
  this._posRad = utils.allocateTyped(Float32Array, spheresCount * POS_RAD_SIZE);
  this._colors = utils.allocateTyped(Float32Array, spheresCount * COLOR_SIZE);
}

IsoSurfaceGeometry.prototype = Object.create(RaycastableBufferGeometry.prototype);
IsoSurfaceGeometry.prototype.constructor = IsoSurfaceGeometry;

IsoSurfaceGeometry.prototype.setItem = function(chunkIdx, pos, radius) {
  var posRad = this._posRad;
  var idx = POS_RAD_SIZE * chunkIdx;
  posRad[idx++] = pos.x;
  posRad[idx++] = pos.y;
  posRad[idx++] = pos.z;
  posRad[idx] = radius;
};

IsoSurfaceGeometry.prototype.setColor = function(chunkIdx, colorVal) {
  tmpColor.set(colorVal);
  var colors = this._colors;
  var idx = COLOR_SIZE * chunkIdx;
  colors[idx++] = tmpColor.r;
  colors[idx++] = tmpColor.g;
  colors[idx] = tmpColor.b;
};

IsoSurfaceGeometry.prototype.finalize = function() {
  this.finishUpdate();
  // TODO compute bounding box?
  this.computeBoundingSphere();
};

IsoSurfaceGeometry.prototype.finishUpdate = function() {
  this._build();
};

IsoSurfaceGeometry.prototype.setOpacity = function() {
  // not implemented
};

IsoSurfaceGeometry.prototype.raycast = function() {
};

IsoSurfaceGeometry.prototype.getSubset = function() {
  return [];
};
export default IsoSurfaceGeometry;

