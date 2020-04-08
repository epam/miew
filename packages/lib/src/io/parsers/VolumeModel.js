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
    this._boxSize = new THREE.Vector3();
    this._boxStart = new THREE.Vector3();
    this._header.delta = {};
    this._header.extent = [];
    this._header.nstart = [];
    this._header.grid = [];
    this._header.crs2xyz = [];
    this._header.cellDims = new THREE.Vector3();
    this._header.angles = [];
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

    const [alpha, beta, gamma] = header.angles;

    const z1 = Math.cos(beta);
    const z2 = (Math.cos(alpha) - Math.cos(beta)
      * Math.cos(gamma)) / Math.sin(gamma);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);

    const xaxis = new THREE.Vector3(xScale, 0, 0);
    const yaxis = new THREE.Vector3(Math.cos(gamma) * yScale, Math.sin(gamma) * yScale, 0);
    const zaxis = new THREE.Vector3(z1 * zScale, z2 * zScale, z3 * zScale);

    return [xaxis, yaxis, zaxis];
  }

  _getXYZdim() {
    return [this._header.extent[this._xyz2crs[0]],
      this._header.extent[this._xyz2crs[1]],
      this._header.extent[this._xyz2crs[2]]];
  }

  _getVolumeInfo() {
    const volInfo = _.pick(this._header, ['dmean', 'dmin', 'dmax', 'sd', 'delta']);
    volInfo.obtuseAngle = this._header.angles.map((angle) => Number(angle >= (Math.PI / 2)));
    return volInfo;
  }

  _setBoxParams(xaxis, yaxis, zaxis) {
    // if axes are not orthogonal, the origins might not match with box coordinates - need to make shift
    let shiftX = 0;
    let shiftY = 0;
    const [alpha, beta, gamma] = this._header.angles;

    if (gamma >= Math.PI / 2) {
      shiftX += Math.abs(yaxis.x);
    }
    if (beta >= Math.PI / 2) {
      shiftX += Math.abs(zaxis.x);
    }
    if (alpha >= Math.PI / 2) {
      shiftY += Math.abs(zaxis.y);
    }

    this._boxStart = new THREE.Vector3(this._origin.x - shiftX, this._origin.y - shiftY, this._origin.z);
    this._boxSize = new THREE.Vector3(
      Math.abs(xaxis.x) + Math.abs(yaxis.x) + Math.abs(zaxis.x),
      Math.abs(yaxis.y) + Math.abs(zaxis.y),
      Math.abs(zaxis.z),
    );

    const delta = (axe, proj) => (Math.abs(axe[proj]) / this._boxSize[proj]);
    this._header.delta.x = delta(yaxis, 'x');
    this._header.delta.y = delta(zaxis, 'x');
    this._header.delta.z = delta(zaxis, 'y');
  }

  _getXYZbox() {
    return new THREE.Box3(this._boxStart.clone(), this._boxStart.clone().add(this._boxSize));
  }

  _toXYZData() {}

  parse(data) {
    this._parseHeader(data);
    this._setOrigins();
    return new Volume(Float32Array, this._getXYZdim(), this._getXYZbox(), 1, this._toXYZData(), this._getVolumeInfo());
  }
}

export default VolumeModel;
