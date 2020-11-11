import Parser from './Parser';
import VolumeModel, { valueType } from './VolumeModel';

const CCP4Header = {
  extent: [valueType.array, 'u32', 0],
  type: [valueType.singular, 'u32', 3],
  nstart: [valueType.array, 'i32', 4],
  grid: [valueType.array, 'u32', 7],
  cellDims: [valueType.vector, 'f32', 10],
  angles: [valueType.array, 'f32', 13],
  crs2xyz: [valueType.array, 'i32', 16],
  dmin: [valueType.singular, 'f32', 19],
  dmax: [valueType.singular, 'f32', 20],
  dmean: [valueType.singular, 'f32', 21],
  ispg: [valueType.singular, 'u32', 22],
  nsymbt: [valueType.singular, 'u32', 23],
  lksflg: [valueType.singular, 'u32', 24],
  customData: [valueType.buffer, 'buffer', 25, 9],
  origin: [valueType.vector, 'f32', 34],
  map: [valueType.buffer, 'buffer', 52, 1],
  machine: [valueType.singular, 'u32', 53],
  sd: [valueType.singular, 'f32', 54],
  nlabel: [valueType.singular, 'f32', 55],
  label: [valueType.buffer, 'buffer', 56, 200],
};

class Ccp4Model extends VolumeModel {
  // read header (http://www.ccp4.ac.uk/html/maplib.html)
  _parseHeader(_buffer) {
    this._buff = _buffer;
    this._typedCheck();
    const arrays = {};
    arrays.u32 = new Uint32Array(this._buff, 0, 56);
    arrays.i32 = new Int32Array(this._buff, 0, 56);
    arrays.f32 = new Float32Array(this._buff, 0, 56);
    arrays.buffer = this._buff;
    const header = this._header;

    this._fillHeader(CCP4Header, arrays);

    // calculate non-orthogonal unit cell coordinates
    header.angles.forEach((angle, i, a) => { a[i] *= Math.PI / 180.0; });
  }

  _setAxisIndices() {
    const header = this._header;

    if (header.cellDims.x === 0.0 && header.cellDims.y === 0.0 && header.cellDims.z === 0.0) {
      header.cellDims.set(1.0, 1.0, 1.0);
    }
    // Apply header conversion
    // Mapping between CCP4 column, row, section and VMD x, y, z.
    const { crs2xyz } = this._header;
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
    const [xaxis, yaxis, zaxis] = this._getAxis();
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
        header.extent[0] * header.extent[1] * header.extent[2],
      );
    } else {
      throw new Error(`CCP4: Unsupported format ${header.type}`);
    }

    this._setBoxParams(xaxis, yaxis, zaxis);
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
    let x;
    let y;
    let z;
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
