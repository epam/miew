import * as THREE from 'three';
import Volume from '../../chem/Volume';
import _ from 'lodash';

export const valueType = {
  singular: 0,
  vector: 1,
  array: 2,
  buffer: 3
};

class VolumeModel {
  _xyz2crs = [];

  _origin = new THREE.Vector3(0, 0, 0);

  constructor() {
    this._header = {};
    this._boxSize = new THREE.Vector3();
    this._boxStart = new THREE.Vector3();
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
    for (let key in headerFormat) {
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
            [headerFormat[key][3]] * 4
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
    const z2 = (Math.cos(header.angles.x) - Math.cos(header.angles.y) *
      Math.cos(header.angles.z)) / Math.sin(header.angles.z);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    let xaxis = new THREE.Vector3(xScale, 0, 0);
    let yaxis = new THREE.Vector3(Math.cos(header.angles.z) * yScale, Math.sin(header.angles.z) * yScale, 0);
    let zaxis = new THREE.Vector3(z1 * zScale, z2 * zScale, z3 * zScale);

    return [xaxis, yaxis, zaxis];
  }

  _getXYZdim() {
    return [this._header.extent[this._xyz2crs[0]],
      this._header.extent[this._xyz2crs[1]],
      this._header.extent[this._xyz2crs[2]]];
  }

  _getVolumeInfo() {
    return _.pick(this._header, ['dmean', 'dmin', 'dmax', 'sd', 'angles']);
  }

  _setBoxParams(xaxis, yaxis, zaxis) {
    // if axes are not orthogonal, the origins might not match with box coordinates - need to make shift
    let shiftX = 0, shiftY = 0;
    // depending on angles ratio, there could  be different box sizes (the things are in projections)
    let Xprojection = Math.abs(xaxis.x), Yprojection =  Math.abs(yaxis.y), Zprojection =  Math.abs(zaxis.z);

    const bettaSharp = (this._header.angles.y <= Math.PI / 2);
    const gammaSharp = (this._header.angles.z <= Math.PI / 2);
    const alphaSharp = (this._header.angles.x <= Math.PI / 2);

    if (bettaSharp && gammaSharp) {
      Xprojection += shiftX = Math.abs(yaxis.x) + Math.abs(zaxis.x);
    } else if (!bettaSharp && !gammaSharp) {
      Xprojection += Math.abs(yaxis.x) + Math.abs(zaxis.x);
    } else if (bettaSharp && !gammaSharp) {
      Xprojection += Math.max(Math.abs(yaxis.x), Math.abs(zaxis.x));
      shiftX =  Math.abs(yaxis.x) - Math.abs(zaxis.x);
    } else if (!bettaSharp && gammaSharp) {
      Xprojection += Math.max(Math.abs(yaxis.x), Math.abs(zaxis.x));
      shiftX =  Math.abs(zaxis.x) - Math.abs(yaxis.x);
    }

    if (!alphaSharp) {
      Yprojection += shiftY = Math.abs(zaxis.y);
    }
    this._boxStart = new THREE.Vector3(this._origin.x - shiftX, this._origin.y - shiftY, this._origin.z);
    this._boxSize = new THREE.Vector3(Xprojection, Yprojection, Zprojection);
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
