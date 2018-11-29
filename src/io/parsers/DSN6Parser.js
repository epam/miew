import Parser from './Parser';
import * as THREE from 'three';
import Volume from '../../chem/Volume';
import _ from 'lodash';
import VolumeModel from './VolumeModel';

class DSN6Model extends VolumeModel {

  parseHeader(_buffer) {
    if (_.isTypedArray(_buffer)) {
      _buffer = _buffer.buffer;
    } else if (!_.isArrayBuffer(_buffer)) {
      throw new TypeError('Expected ArrayBuffer or TypedArray');
    }
    const intBuff = new Int16Array(_buffer);
    this._buffer = _buffer;

    // check and reverse if big endian
    if (intBuff[18] !== 100) {
      for (let i = 0, n = intBuff.length; i < n; ++i) {
        const val = intBuff[i];
        intBuff[i] = ((val & 0xff) << 8) | ((val >> 8) & 0xff);
      }
    }
    if (intBuff[18] !== 100) {
      throw new Error('DSN6: Incorrect format ');
    }

    const header = this._header;
    header.extent = [];
    header.nstart = [];
    header.crs2xyz = [];
    header.cellDims = new THREE.Vector3();
    header.angles = new THREE.Vector3();

    header.scaleFactor = intBuff[17];

    header.nstart.push(intBuff[0]);
    header.nstart.push(intBuff[1]);
    header.nstart.push(intBuff[2]);

    header.extent.push(intBuff[3]);
    header.extent.push(intBuff[4]);
    header.extent.push(intBuff[5]);

    header.gridX = intBuff[6];
    header.gridY = intBuff[7];
    header.gridZ = intBuff[8];

    header.cellDims.x = intBuff[9] / header.scaleFactor;
    header.cellDims.y = intBuff[10] / header.scaleFactor;
    header.cellDims.z = intBuff[11] / header.scaleFactor;

    // angles in radians
    header.angles.x = intBuff[12] * Math.PI / 180.0 / header.scaleFactor;
    header.angles.y = intBuff[13] * Math.PI / 180.0 / header.scaleFactor;
    header.angles.z = intBuff[14] * Math.PI / 180.0 / header.scaleFactor;

    header.div = intBuff[15] / 100;
    header.adder = intBuff[16];
  }

  _setAxisIndices() {
    this._xyz2crs[0] = 0;
    this._xyz2crs[1] = 1;
    this._xyz2crs[2] = 2;
  }

  setOrigins() {
    const header = this._header;
    let [xaxis, yaxis, zaxis] = this._getAxis();
    this._setAxisIndices();

    this._origin = new THREE.Vector3(0, 0, 0);
    this._origin.addScaledVector(xaxis, header.nstart[0]);
    this._origin.addScaledVector(yaxis, header.nstart[1]);
    this._origin.addScaledVector(zaxis, header.nstart[2]);

    xaxis.multiplyScalar(header.extent[0]);
    yaxis.multiplyScalar(header.extent[1]);
    zaxis.multiplyScalar(header.extent[2]);

    this._bboxSize = new THREE.Vector3(xaxis.length(), yaxis.length(), zaxis.length());
  }

  toXYZData() {
    const header = this._header;
    const byteBuffer = new Uint8Array(this._buffer);
    const xyzData = new Float32Array(header.extent[0] * header.extent[1] * header.extent[2]);

    const blocks = new THREE.Vector3(header.extent[0] / 8, header.extent[1] / 8, header.extent[2] / 8);

    let pos = 512;

    for (let zBlock = 0; zBlock < blocks.z; ++zBlock) {
      for (let yBlock = 0; yBlock < blocks.y; ++yBlock) {
        for (let xBlock = 0; xBlock < blocks.x; ++xBlock) {
          for (let k = 0; k < 8; ++k) {
            const z = 8 * zBlock + k;
            for (let j = 0; j < 8; ++j) {
              const y = 8 * yBlock + j;
              for (let i = 0; i < 8; ++i) {
                const x = 8 * xBlock + i;

                if (x < header.extent[0] && y < header.extent[1] && z < header.extent[2]) {
                  let idx = x + header.extent[0] * (y + header.extent[1] * z);
                  xyzData[idx] = (byteBuffer[pos] - header.adder) / header.div;
                  ++pos;
                } else {
                  pos += 8 - i;
                  break;
                }
              }
            }
          }
        }
      }
    }
    return xyzData;
  }
}

class DSN6Parser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._options.fileType = 'dsn6';
    this.model = new DSN6Model();
  }

  parseSync() {
    const dsn6 = this.model;
    dsn6.parseHeader(this._data);
    dsn6.setOrigins();
    return new Volume(Float32Array, dsn6.getXYZdim(), dsn6.getXYZbox(), 1, dsn6.toXYZData());
  }

  static canParse(data, options) {
    if (!data) {
      return false;
    }
    return data instanceof ArrayBuffer && Parser.checkDataTypeOptions(options, 'dsn6');
  }

  canProbablyParse(_data) {
    return false;
  }
}

DSN6Parser.formats = ['dsn6'];
DSN6Parser.extensions = ['.dsn6'];
DSN6Parser.binary = true;

export default DSN6Parser;
