import Parser from './Parser';
import * as THREE from 'three';
import VolumeModel from './VolumeModel';

class DSN6Model extends VolumeModel {

  _parseHeader(_buffer) {
    this._buff = _buffer;
    this._typedCheck();
    const intBuff = new Int16Array(this._buff);

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

    let idx = {};
    idx.counter = 0;

    header.scaleFactor = 1.0 / intBuff[17];

    this._parseVector(header.nstart, intBuff, idx);
    this._parseVector(header.extent, intBuff, idx);
    this._parseVector(header.grid, intBuff, idx);
    this._parseVector(header.cellDims, intBuff, idx);
    header.cellDims.multiplyScalar(header.scaleFactor);
    this._parseVector(header.angles, intBuff, idx);
    // angles in radians
    header.angles.multiplyScalar(Math.PI / 180.0 * header.scaleFactor);

    header.div = intBuff[15] / 100;
    header.adder = intBuff[16];
  }

  _setAxisIndices() {
    this._xyz2crs[0] = 0;
    this._xyz2crs[1] = 1;
    this._xyz2crs[2] = 2;
  }

  _setOrigins() {
    const header = this._header;
    let [xaxis, yaxis, zaxis] = this._getAxis();
    this._setAxisIndices();

    this._origin.addScaledVector(xaxis, header.nstart[0]);
    this._origin.addScaledVector(yaxis, header.nstart[1]);
    this._origin.addScaledVector(zaxis, header.nstart[2]);

    xaxis.multiplyScalar(header.extent[0]);
    yaxis.multiplyScalar(header.extent[1]);
    zaxis.multiplyScalar(header.extent[2]);

    this._bboxSize = new THREE.Vector3(xaxis.length(), yaxis.length(), zaxis.length());
  }

  _pointCalculate(xyzData, byteBuffer, z, y, x, pos, i) {
    const header = this._header;

    if (x < header.extent[0] && y < header.extent[1] && z < header.extent[2]) {
      let idx = x + header.extent[0] * (y + header.extent[1] * z);
      xyzData[idx] = (byteBuffer[pos.counter] - header.adder) / header.div;
      ++pos.counter;
    } else {
      pos.counter += 8 - i;
      return false;
    }
    return true;
  }

  _blockCalculate(xyzData, byteBuffer, zBlock, yBlock, xBlock, pos) {

    for (let k = 0; k < 8; ++k) {
      const z = 8 * zBlock + k;
      for (let j = 0; j < 8; ++j) {
        const y = 8 * yBlock + j;
        let inRange = true;
        let i = 0;
        while (inRange && i < 8) {
          const x = 8 * xBlock + i;
          inRange = this._pointCalculate(xyzData, byteBuffer, z, y, x, pos, i);
          i++;
        }
      }
    }
  }

  _toXYZData() {
    const header = this._header;
    const byteBuffer = new Uint8Array(this._buff);
    const xyzData = new Float32Array(header.extent[0] * header.extent[1] * header.extent[2]);

    const blocks = new THREE.Vector3(header.extent[0] / 8, header.extent[1] / 8, header.extent[2] / 8);

    let pos = {};
    pos.counter = 512;

    for (let zBlock = 0; zBlock < blocks.z; ++zBlock) {
      for (let yBlock = 0; yBlock < blocks.y; ++yBlock) {
        for (let xBlock = 0; xBlock < blocks.x; ++xBlock) {
          this._blockCalculate(xyzData, byteBuffer,  zBlock, yBlock, xBlock, pos);
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

  static canParse(data, options) {
    if (!data) {
      return false;
    }
    return data instanceof ArrayBuffer && Parser.checkDataTypeOptions(options, 'dsn6');
  }

  static canProbablyParse(_data) {
    return false;
  }

  parseSync() {
    return this.model.parse(this._data);
  }
}

DSN6Parser.formats = ['dsn6'];
DSN6Parser.extensions = ['.dsn6'];
DSN6Parser.binary = true;

export default DSN6Parser;
