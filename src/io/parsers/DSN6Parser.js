import Parser from './Parser';
import * as THREE from 'three';
import Volume from '../../chem/Volume';

class DSN6Parser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._options.fileType = 'dsn6';
    this._header = {};
    this._header.start = new THREE.Vector3();
    this._header.extent = new THREE.Vector3();
    this._header.rate = new THREE.Vector3();
  }

  parseHeader() {
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

    this._header.scaleFactor = intBuff[17];

    this._header.start.x =  intBuff[0];
    this._header.start.y =  intBuff[1];
    this._header.start.z =  intBuff[2];

    this._header.extent.x = intBuff[3];
    this._header.extent.y = intBuff[4];
    this._header.extent.z = intBuff[5];

    // edges in angstroms
    this._header.edgeA = intBuff[9] / intBuff[6] / this._header.scaleFactor;
    this._header.edgeB = intBuff[10] / intBuff[7] / this._header.scaleFactor;
    this._header.edgeC = intBuff[11] /  intBuff[8] / this._header.scaleFactor;

    // angles in radians
    this._header.alpha = intBuff[12] * Math.PI / 180.0 / this._header.scaleFactor;
    this._header.beta = intBuff[13] * Math.PI / 180.0 / this._header.scaleFactor;
    this._header.gamma = intBuff[14] * Math.PI / 180.0 / this._header.scaleFactor;

    this._header._16 = intBuff[15] / 100;
    this._header._17 = intBuff[16];
  }

  setOrigins() {
    const header = this._header;
    const z1 = Math.cos(header.beta);
    const z2 = (Math.cos(header.alpha) - Math.cos(header.beta) *
      Math.cos(header.gamma)) / Math.sin(header.gamma);
    const z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
    let xaxis = new THREE.Vector3(header.edgeA, 0, 0);
    let yaxis = new THREE.Vector3(Math.cos(header.beta) * header.edgeB, Math.sin(header.beta) * header.edgeB, 0);
    let zaxis = new THREE.Vector3(z1 * header.edgeC, z2 * header.edgeC, z3 * header.edgeC);

    this._origin = new THREE.Vector3(0, 0, 0);
    this._origin.addScaledVector(xaxis, header.start.x);
    this._origin.addScaledVector(yaxis, header.start.y);
    this._origin.addScaledVector(zaxis, header.start.z);

    xaxis.multiplyScalar(header.extent.x);
    yaxis.multiplyScalar(header.extent.y);
    zaxis.multiplyScalar(header.extent.z);

    this._bboxSize = new THREE.Vector3(xaxis.length(), yaxis.length(), zaxis.length());
  }

  getXYZbox() {
    return new THREE.Box3(this._origin.clone(), this._origin.clone().add(this._bboxSize));
  }

  getXYZdim() {
    return [this._header.extent.x,
      this._header.extent.y,
      this._header.extent.z];
  }

  toXYZData() {
    const header = this._header;
    const byteBuffer = new Uint8Array(this._data);
    const xyzData = new Float32Array(header.extent.x * header.extent.y * header.extent.z);

    const blocks = new THREE.Vector3(header.extent.x / 8, header.extent.y / 8, header.extent.z / 8);

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

                // check if remaining slice-part contains data
                if (x < header.extent.x && y < header.extent.y && z < header.extent.z) {
                  let idx = (x * header.extent.y + y) * header.extent.z + z;
                  xyzData[idx] = (byteBuffer[pos] - header._17) / header._16;
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
