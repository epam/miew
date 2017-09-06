

import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import SphereCollisionGeo from './SphereCollisionGeo';

var tmpColor = new THREE.Color();

var OFFSET_SIZE = 4;
var COLOR_SIZE = 3;
var copySubArrays = utils.copySubArrays;

function setArrayXYZ(arr, idx, x, y, z) {
  arr[idx]     = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
}

function setArrayXYZW(arr, idx, x, y, z, w) {
  arr[idx]     = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
  arr[idx + 3] = w;
}

function InstancedSpheresGeometry(spheresCount, sphereComplexity, useZSprites) {
  THREE.InstancedBufferGeometry.call(this);
  SphereCollisionGeo.call(this, spheresCount);
  this._sphGeometry = useZSprites ? new THREE.PlaneBufferGeometry(2, 2, 1, 1) :
    new THREE.SphereBufferGeometry(1, sphereComplexity * 2, sphereComplexity, 0, Math.PI * 2, 0, Math.PI);
  this._init(spheresCount, this._sphGeometry);
}

InstancedSpheresGeometry.prototype = Object.create(THREE.InstancedBufferGeometry.prototype);
_.mixin(InstancedSpheresGeometry.prototype, SphereCollisionGeo.prototype);
InstancedSpheresGeometry.prototype.constructor = InstancedSpheresGeometry;

InstancedSpheresGeometry.prototype.setItem = function(itemIdx, itemPos, itemRad) {
  setArrayXYZW(this._offsets, itemIdx * OFFSET_SIZE, itemPos.x, itemPos.y, itemPos.z, itemRad);
  this.setSphere(itemIdx, itemPos, itemRad);
};

InstancedSpheresGeometry.prototype.setColor = function(itemIdx, colorVal) {
  tmpColor.set(colorVal);
  setArrayXYZ(this._colors, itemIdx * COLOR_SIZE, tmpColor.r, tmpColor.g, tmpColor.b);
};

InstancedSpheresGeometry.prototype.startUpdate = function() {
  return true;
};

InstancedSpheresGeometry.prototype.finishUpdate = function() {
  this.getAttribute('offset').needsUpdate = true;
  this.getAttribute('color').needsUpdate = true;
};

InstancedSpheresGeometry.prototype.finalize = function() {
  this.finishUpdate();
  // TODO compute bounding box?
  this.computeBoundingSphere();
};

InstancedSpheresGeometry.prototype.setOpacity = function(chunkIndices, value) {
  var alphaArr = this._alpha;
  for (var i = 0, n = chunkIndices.length; i < n; ++i) {
    alphaArr[chunkIndices[i]] = value;
  }
  this.getAttribute('alphaColor').needsUpdate = true;
};

InstancedSpheresGeometry.prototype.getSubset = function(chunkIndices) {
  var instanceCount = chunkIndices.length;
  var geom = new THREE.InstancedBufferGeometry();
  this._init.call(geom, instanceCount, this._sphGeometry);

  copySubArrays(this._offsets, geom._offsets, chunkIndices, OFFSET_SIZE);
  copySubArrays(this._colors, geom._colors, chunkIndices, COLOR_SIZE);
  geom.boundingSphere = this.boundingSphere;
  geom.boundingBox = this.boundingBox;
  return [geom];
};

InstancedSpheresGeometry.prototype._init = function(spheresCount, sphereGeo) {
  this.copy(sphereGeo);

  this._offsets = utils.allocateTyped(Float32Array, spheresCount * OFFSET_SIZE);
  this._colors = utils.allocateTyped(Float32Array, spheresCount * COLOR_SIZE);
  var alpha = this._alpha = utils.allocateTyped(Float32Array, spheresCount);
  _.fill(alpha, 1.0);

  this.addAttribute('offset', new THREE.InstancedBufferAttribute(this._offsets, OFFSET_SIZE, 1));
  this.addAttribute('color', new THREE.InstancedBufferAttribute(this._colors, COLOR_SIZE, 1));
  this.addAttribute('alphaColor', new THREE.InstancedBufferAttribute(alpha, 1, 1));
};

export default InstancedSpheresGeometry;

