import Parser from './Parser';
import * as THREE from 'three';
import Volume from '../../chem/Volume';
import _ from 'lodash';

class DSN6Parser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._options.fileType = 'dsn6';
    this._header = {};
    this._header.nstart = [];
    this._header.extent = [];
    this._header.cellDims = [];
  }

  parseHeader() {
    if (_.isTypedArray(this._data)) {
      this._data = this._data.buffer;
    } else if (!_.isArrayBuffer(this._data)) {
      throw new TypeError('Expected ArrayBuffer or TypedArray');
    }
    const intBuff = new Uint16Array(this._data);

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

    header.cellDims.push(intBuff[9] / header.scaleFactor);
    header.cellDims.push(intBuff[10] / header.scaleFactor);
    header.cellDims.push(intBuff[11] / header.scaleFactor);

    // angles in radians
    header.alpha = intBuff[12] * Math.PI / 180.0 / header.scaleFactor;
    header.beta = intBuff[13] * Math.PI / 180.0 / header.scaleFactor;
    header.gamma = intBuff[14] * Math.PI / 180.0 / header.scaleFactor;

    header.div = intBuff[15] / 100;
    header.adder = intBuff[16];

    // edges in angstroms
    header.edgeA = header.cellDims[0] / header.gridX;
    header.edgeB = header.cellDims[1] / header.gridY;
    header.edgeC = header.cellDims[2] / header.gridZ;
  }

  setOrigins() {
    const header = this._header;
    const z1 = Math.cos(header.beta);
    const z2 = (Math.cos(header.alpha) - Math.cos(header.beta) *
      Math.cos(header.gamma)) / Math.sin(header.gamma);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    let xaxis = new THREE.Vector3(header.edgeA, 0, 0);
    let yaxis = new THREE.Vector3(Math.cos(header.gamma) * header.edgeB, Math.sin(header.gamma) * header.edgeB, 0);
    let zaxis = new THREE.Vector3(z1 * header.edgeC, z2 * header.edgeC, z3 * header.edgeC);

    this._origin = new THREE.Vector3(0, 0, 0);
    this._origin.addScaledVector(xaxis, header.nstart[0]);
    this._origin.addScaledVector(yaxis, header.nstart[1]);
    this._origin.addScaledVector(zaxis, header.nstart[2]);

    xaxis.multiplyScalar(header.extent[0]);
    yaxis.multiplyScalar(header.extent[1]);
    zaxis.multiplyScalar(header.extent[2]);

    this._bboxSize = new THREE.Vector3(xaxis.length(), yaxis.length(), zaxis.length());
  }

  getXYZbox() {
    return new THREE.Box3(this._origin.clone(), this._origin.clone().add(this._bboxSize));
  }

  getXYZdim() {
    return [this._header.extent[0],
      this._header.extent[1],
      this._header.extent[2]];
  }

  toXYZData() {
    const header = this._header;
    const byteBuffer = new Uint8Array(this._data);
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

  parseSync() {
    this.parseHeader();
    this.setOrigins();
    return new Volume(Float32Array, this.getXYZdim(), this.getXYZbox(), 1, this.toXYZData());
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
