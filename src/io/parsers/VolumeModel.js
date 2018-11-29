import * as THREE from 'three';

class VolumeModel {
  constructor() {
    this._header = {};
    this._xyz2crs = [];
    this._bboxSize = new THREE.Vector3();
    this._origin = new THREE.Vector3(0, 0, 0);
  }

  parseHeader(_buffer) {}

  _setAxisIndices() {}

  setOrigins() {}

  _getAxis() {
    const header = this._header;

    const xScale = header.cellDims.x / header.gridX;
    const yScale = header.cellDims.y / header.gridY;
    const zScale = header.cellDims.z / header.gridZ;

    const z1 = Math.cos(header.angles.y);
    const z2 = (Math.cos(header.angles.x) - Math.cos(header.angles.y) *
      Math.cos(header.angles.z)) / Math.sin(header.angles.z);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    let xaxis = new THREE.Vector3(xScale, 0, 0);
    let yaxis = new THREE.Vector3(Math.cos(header.angles.y) * yScale, Math.sin(header.angles.y) * yScale, 0);
    let zaxis = new THREE.Vector3(z1 * zScale, z2 * zScale, z3 * zScale);

    return [xaxis, yaxis, zaxis];
  }

  getXYZdim() {
    return [this._header.extent[this._xyz2crs[0]],
      this._header.extent[this._xyz2crs[1]],
      this._header.extent[this._xyz2crs[2]]];
  }

  getXYZbox() {
    return new THREE.Box3(this._origin.clone(), this._origin.clone().add(this._bboxSize));
  }

  toXYZData() {}
}

export default VolumeModel;