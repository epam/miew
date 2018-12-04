import Parser from './Parser';
import * as THREE from 'three';
import VolumeModel from './VolumeModel';


class Ccp4Model extends VolumeModel {

  // read header (http://www.ccp4.ac.uk/html/maplib.html)
  _parseHeader(_buffer) {
    this._buff = _buffer;
    this._typedCheck();
    let [u32, i32, f32]  = [new Uint32Array(this._buff), new Int32Array(this._buff), new Float32Array(this._buff)];
    const header = this._header;

    let idx = {};
    idx.counter = 0;
    this._parseVector(header.extent, u32, idx);
    header.type = u32[idx.counter++];
    this._parseVector(header.nstart, i32, idx);
    this._parseVector(header.grid, u32, idx);
    this._parseVector(header.cellDims, f32, idx);
    this._parseVector(header.angles, f32, idx);
    this._parseVector(header.crs2xyz, i32, idx);
    [header.dmin, header.dmax, header.dmean] = this._parseVector(undefined, f32, idx);
    [header.ispg, header.nsymbt, header.lksflg] = this._parseVector(undefined, u32, idx);
    header.customData = new Uint8Array(this._buff, idx.counter * 4, 96);
    idx.counter += 24;
    this._parseVector(header.origin, f32, idx);
    header.map = new Uint8Array(this._buff, idx.counter * 4, 4);
    idx.counter++;
    header.machine = u32[idx.counter++];
    header.sd = f32[idx.counter++];
    header.nlabel = u32[idx.counter++];
    header.label = new Uint8Array(this._buff, idx.counter * 4, 800);
    // calculate non-orthogonal unit cell coordinates
    header.angles.multiplyScalar(Math.PI / 180.0);
  }

  _setAxisIndices() {
    const header = this._header;

    if (header.cellDims.x === 0.0 && header.cellDims.y === 0.0 && header.cellDims.z === 0.0) {
      header.cellDims.set(1.0, 1.0, 1.0);
    }
    // Apply header conversion
    // Mapping between CCP4 column, row, section and VMD x, y, z.
    const crs2xyz = this._header.crs2xyz;
    if (crs2xyz[0] === 0 && crs2xyz[1] === 0 && crs2xyz[2] === 0) {
      crs2xyz[0] = 1;
      crs2xyz[1] = 2;
      crs2xyz[2] = 3;
    }

    const xyz2crs = this._xyz2crs;
    xyz2crs[crs2xyz[0] - 1] = 0; // column
    xyz2crs[crs2xyz[1] - 1] = 1; // row
    xyz2crs[crs2xyz[2] - 1] = 2; // section
  }

  _setOrigins() {
    let [xaxis, yaxis, zaxis] = this._getAxis();
    this._setAxisIndices();

    const header = this._header;
    const xyz2crs = this._xyz2crs;
    // Handle both MRC-2000 and older format maps
    if (header.origin.x === 0.0 && header.origin.y === 0.0 && header.origin.z === 0.0) {
      this._origin.addScaledVector(xaxis, header.nstart[xyz2crs[0]]);
      this._origin.addScaledVector(yaxis, header.nstart[xyz2crs[1]]);
      this._origin.addScaledVector(zaxis, header.nstart[xyz2crs[2]]);
    } else {
      this._origin = header.origin;
      // Use ORIGIN records rather than old n[xyz]start records
      //   http://www2.mrc-lmb.cam.ac.uk/image2000.html
      // XXX the ORIGIN field is only used by the EM community, and
      // has undefined meaning for non-orthogonal maps and/or non-cubic voxels, etc.
    }
    xaxis.multiplyScalar(header.extent[xyz2crs[0]] - 1);
    yaxis.multiplyScalar(header.extent[xyz2crs[1]] - 1);
    zaxis.multiplyScalar(header.extent[xyz2crs[2]] - 1);

    if (header.type === 2) {
      this._data = new Float32Array(
        this._buff,
        1024 + header.nsymbt,
        header.extent[0] * header.extent[1] * header.extent[2]
      );
    } else {
      throw new Error('CCP4: Unsupported format ' + header.type);
    }

    this._bboxSize = new THREE.Vector3(xaxis.length(), yaxis.length(), zaxis.length());
  }

  _toXYZData() {
    const header = this._header;
    const data = this._data;
    const xyz2crs = this._xyz2crs;
    const xyzData = new Float32Array(data.length);

    const dim = this._getXYZdim();
    const xSize = dim[0];
    const ySize = dim[1];

    let crsIdx = 0;
    const coord = [];
    let x, y, z;
    for (coord[2] = 0; coord[2] < header.extent[2]; coord[2]++) { // Site
      for (coord[1] = 0; coord[1] < header.extent[1]; coord[1]++) { // Row
        for (coord[0] = 0; coord[0] < header.extent[0]; coord[0]++, crsIdx++) { // Column
          x = coord[xyz2crs[0]];
          y = coord[xyz2crs[1]];
          z = coord[xyz2crs[2]];
          xyzData[x + xSize * (y + ySize * z)] = data[crsIdx];
        }
      }
    }

    return xyzData;
  }
}

class CCP4Parser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._options.fileType = 'ccp4';
    this.model = new Ccp4Model();
  }

  ////////////////////////////////////////////////////////////////////////////
  // Class methods

  /** @deprecated */
  static canParse(data, options) {
    if (!data) {
      return false;
    }
    return data instanceof ArrayBuffer && Parser.checkDataTypeOptions(options, 'ccp4');
  }

  static canProbablyParse(_data) {
    return false; // Autodetection is not implemented yet
  }

  parseSync() {
    return this.model.parse(this._data);
  }
}

CCP4Parser.formats = ['ccp4'];
CCP4Parser.extensions = ['.ccp4', '.map', '.mrc'];
CCP4Parser.binary = true;

export default CCP4Parser;


