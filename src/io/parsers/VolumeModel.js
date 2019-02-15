import * as THREE from 'three';
import _ from 'lodash';
import Volume from '../../chem/Volume';

export const valueType = {
  singular: 0,
  vector: 1,
  array: 2,
  buffer: 3,
};

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

  _fillHeader(headerFormat, arrays) {
    for (const key in headerFormat) {
      if (headerFormat.hasOwnProperty(key)) {
        switch (headerFormat[key][0]) {
          case valueType.singular:
            this._header[key] = arrays[headerFormat[key][1]][headerFormat[key][2]];
            break;

          case valueType.array:
            this._parseArray(this._header[key], arrays[headerFormat[key][1]], headerFormat[key][2]);
            break;

          case valueType.vector:
            this._parseVector(this._header[key], arrays[headerFormat[key][1]], headerFormat[key][2]);
            break;

          case valueType.buffer:
            this._header[key] = new Uint8Array(
              arrays[headerFormat[key][1]],
              [headerFormat[key][2]] * 4,
              [headerFormat[key][3]] * 4,
            );
            break;

          default:
            break;
        }
      }
    }
  }

  _parseVector(vector, arr, pos) {
    [vector.x, vector.y, vector.z] = [arr[pos], arr[pos + 1], arr[pos + 2]];
  }

  _parseArray(vector, arr, pos) {
    vector[0] = arr[pos];
    vector[1] = arr[pos + 1];
    vector[2] = arr[pos + 2];
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
    const z2 = (Math.cos(header.angles.x) - Math.cos(header.angles.y)
      * Math.cos(header.angles.z)) / Math.sin(header.angles.z);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    const xaxis = new THREE.Vector3(xScale, 0, 0);
    const yaxis = new THREE.Vector3(Math.cos(header.angles.y) * yScale, Math.sin(header.angles.y) * yScale, 0);
    const zaxis = new THREE.Vector3(z1 * zScale, z2 * zScale, z3 * zScale);

    return [xaxis, yaxis, zaxis];
  }

  _getXYZdim() {
    return [this._header.extent[this._xyz2crs[0]],
      this._header.extent[this._xyz2crs[1]],
      this._header.extent[this._xyz2crs[2]]];
  }

  _getVolumeInfo() {
    return _.pick(this._header, ['dmean', 'dmin', 'dmax', 'sd']);
  }

  _getXYZbox() {
    return new THREE.Box3(this._origin.clone(), this._origin.clone().add(this._bboxSize));
  }

  _toXYZData() {}

  parse(data) {
    this._parseHeader(data);
    this._setOrigins();
    return new Volume(Float32Array, this._getXYZdim(), this._getXYZbox(), 1, this._toXYZData(), this._getVolumeInfo());
  }
}

export default VolumeModel;
