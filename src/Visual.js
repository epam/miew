

import utils from './utils';
import * as THREE from 'three';
import gfxutils from './gfx/gfxutils';

var _defaultBoundaries = {
  boundingBox: new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)),
  boundingSphere: new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1)
};

function Visual(name, dataSource) {
  gfxutils.RCGroup.call(this);

  this.name = name;

  this._dataSource = dataSource;
}

utils.deriveClass(Visual, gfxutils.RCGroup);

Visual.prototype.release = function() {
  if (this.parent) {
    this.parent.remove(this);
  }
};

Visual.prototype.getDataSource = function() {
  return this._dataSource;
};

Visual.prototype.getBoundaries = function() {
  return _defaultBoundaries;
};

export default Visual;

