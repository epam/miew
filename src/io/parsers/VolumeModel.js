import * as THREE from 'three';
import Volume from '../../chem/Volume';
import _ from 'lodash';

class VolumeModel {
  _xyz2crs = [];

  _origin = new THREE.Vector3(0, 0, 0);

  constructor() {
    this._header = {};
    this._bboxSize = new THREE.Vector3();
    this._header.extent = [];
    this._header.nstart = [];
    this._header.grid = [];
    this._header.crs2xyz = [];
    this._header.cellDims = new THREE.Vector3();
    this._header.angles = new THREE.Vector3();
    this._header.origin = new THREE.Vector3(0, 0, 0);
    this._header.dmin = 0;
    this._header.dmean = 0;
    this._header.dmax = 0;
  }

  _typedCheck() {
    if (_.isTypedArray(this._buff)) {
      this._buff = this._buff.buffer;
    } else if (!_.isArrayBuffer(this._buff)) {
      throw new TypeError('Expected ArrayBuffer or TypedArray');
    }
  }

  _parseVector(vector, arr, idx) {
    if (vector === undefined) {
      return [arr[idx.counter++], arr[idx.counter++], arr[idx.counter++]];
    }
    if (Array.isArray(vector)) {
      vector[0] = arr[idx.counter++];
      vector[1] = arr[idx.counter++];
      vector[2] = arr[idx.counter++];
    } else {
      [vector.x, vector.y, vector.z] = [arr[idx.counter++], arr[idx.counter++], arr[idx.counter++]];
    }
    return 0;
  }

  _parseHeader(_buffer) {}

  _setAxisIndices() {}

  _setOrigins() {}

  _getAxis() {
    const header = this._header;

    const xScale = header.cellDims.x / header.grid[0];
    const yScale = header.cellDims.y / header.grid[1];
    const zScale = header.cellDims.z / header.grid[2];

    const z1 = Math.cos(header.angles.y);
    const z2 = (Math.cos(header.angles.x) - Math.cos(header.angles.y) *
      Math.cos(header.angles.z)) / Math.sin(header.angles.z);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    let xaxis = new THREE.Vector3(xScale, 0, 0);
    let yaxis = new THREE.Vector3(Math.cos(header.angles.y) * yScale, Math.sin(header.angles.y) * yScale, 0);
    let zaxis = new THREE.Vector3(z1 * zScale, z2 * zScale, z3 * zScale);

    return [xaxis, yaxis, zaxis];
  }

  _getXYZdim() {
    return [this._header.extent[this._xyz2crs[0]],
      this._header.extent[this._xyz2crs[1]],
      this._header.extent[this._xyz2crs[2]]];
  }

  _getXYZbox() {
    return new THREE.Box3(this._origin.clone(), this._origin.clone().add(this._bboxSize));
  }

  _toXYZData() {}

  parse(data) {
    this._parseHeader(data);
    this._setOrigins();
    return new Volume(Float32Array, this._getXYZdim(), this._getXYZbox(), 1, this._toXYZData());
  }
}

export default VolumeModel;
