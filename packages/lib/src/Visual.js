import * as THREE from 'three';
import gfxutils from './gfx/gfxutils';

const _defaultBoundaries = {
  boundingBox: new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)),
  boundingSphere: new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1),
};

class Visual extends gfxutils.RCGroup {
  constructor(name, dataSource) {
    super(name, dataSource);
    this.name = name;
    this._dataSource = dataSource;
  }

  release() {
    if (this.parent) {
      this.parent.remove(this);
    }
  }

  getDataSource() {
    return this._dataSource;
  }

  getBoundaries() {
    return _defaultBoundaries;
  }
}

export default Visual;
