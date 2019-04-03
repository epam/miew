import * as THREE from 'three';
import Parser from './Parser';
import VolumeModel, { valueType } from './VolumeModel';

// http://www.uoxray.uoregon.edu/tnt/manual/node104.html
const DSN6Header = {
  nstart: [valueType.array, 'i16', 0],
  extent: [valueType.array, 'i16', 3],
  grid: [valueType.array, 'i16', 6],
  cellDims: [valueType.vector, 'i16', 9],
  angles: [valueType.array, 'i16', 12],
  div: [valueType.singular, 'i16', 15],
  adder: [valueType.singular, 'i16', 16],
  scaleFactor: [valueType.singular, 'i16', 17],
};

class DSN6Model extends VolumeModel {
  _parseHeader(_buffer) {
    this._buff = _buffer;
    this._typedCheck();

    const arrays = {};
    arrays.i16 = new Int16Array(this._buff);

    // check and reverse if big endian
    if (arrays.i16[18] !== 100) {
      for (let i = 0, n = arrays.i16.length; i < n; ++i) {
        const val = arrays.i16[i];
        arrays.i16[i] = ((val & 0xff) << 8) | ((val >> 8) & 0xff);
      }
    }
    if (arrays.i16[18] !== 100) {
      throw new Error('DSN6: Incorrect format ');
    }

    const header = this._header;

    this._fillHeader(DSN6Header, arrays);
    header.cellDims.multiplyScalar(1.0 / header.scaleFactor);
    header.angles.forEach((angle, i, a) => { a[i] *= (Math.PI / 180.0) / header.scaleFactor; });
    header.div /= 100;
  }

  _setAxisIndices() {
    this._xyz2crs[0] = 0;
    this._xyz2crs[1] = 1;
    this._xyz2crs[2] = 2;
  }

  _setOrigins() {
    const header = this._header;
    const [xaxis, yaxis, zaxis] = this._getAxis();
    this._setAxisIndices();

    this._origin.addScaledVector(xaxis, header.nstart[0]);
    this._origin.addScaledVector(yaxis, header.nstart[1]);
    this._origin.addScaledVector(zaxis, header.nstart[2]);

    xaxis.multiplyScalar(header.extent[0]);
    yaxis.multiplyScalar(header.extent[1]);
    zaxis.multiplyScalar(header.extent[2]);

    this._setBoxParams(xaxis, yaxis, zaxis);
  }

  _pointCalculate(xyzData, byteBuffer, z, y, x, pos, i) {
    const header = this._header;

    if (x < header.extent[0] && y < header.extent[1] && z < header.extent[2]) {
      const idx = x + header.extent[0] * (y + header.extent[1] * z);
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

    const pos = {};
    pos.counter = 512;

    for (let zBlock = 0; zBlock < blocks.z; ++zBlock) {
      for (let yBlock = 0; yBlock < blocks.y; ++yBlock) {
        for (let xBlock = 0; xBlock < blocks.x; ++xBlock) {
          this._blockCalculate(xyzData, byteBuffer, zBlock, yBlock, xBlock, pos);
        }
      }
    }
    this._calculateInfoParams(xyzData);
    return xyzData;
  }

  _calculateInfoParams(xyzData) {
    this._header.dmean /= xyzData.length;
    let dispersion = 0;
    let minDensity = xyzData[0];
    let maxDensity = xyzData[0];
    for (let j = 0; j < xyzData.length; j++) {
      dispersion += (this._header.dmean - xyzData[j]) ** 2;

      if (xyzData[j] < minDensity) {
        minDensity = xyzData[j];
      }
      if (xyzData[j] > maxDensity) {
        maxDensity = xyzData[j];
      }
    }
    this._header.sd = Math.sqrt(dispersion / xyzData.length);
    this._header.dmax = maxDensity;
    this._header.dmin = minDensity;
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
DSN6Parser.extensions = ['.dsn6', '.omap'];
DSN6Parser.binary = true;

export default DSN6Parser;
