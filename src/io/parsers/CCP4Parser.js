import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import utils from '../../utils';

var Volume = chem.Volume;

function Ccp4Model() {
}

Ccp4Model.prototype.load = function(buffer) {
  if (_.isTypedArray(buffer)) {
    buffer = buffer.buffer;
  } else if (!_.isArrayBuffer(buffer)) {
    throw new TypeError('Expected ArrayBuffer or TypedArray');
  }

  var u32 = new Uint32Array(buffer);
  var i32 = new Int32Array(buffer);
  var f32 = new Float32Array(buffer);

  var header = this._header = {};
  header.extent = [];
  header.nstart = [];
  header.crs2xyz = [];
  header.cellDims = new THREE.Vector3();
  header.angles = new THREE.Vector3();
  header.origin = new THREE.Vector3();

  // read header (http://www.ccp4.ac.uk/html/maplib.html)
  var idx = 0;
  header.extent.push(u32[idx++]);
  header.extent.push(u32[idx++]);
  header.extent.push(u32[idx++]);
  header.type = u32[idx++];
  header.nstart.push(i32[idx++]);
  header.nstart.push(i32[idx++]);
  header.nstart.push(i32[idx++]);
  header.gridX = u32[idx++];
  header.gridY = u32[idx++];
  header.gridZ = u32[idx++];
  header.cellDims.x = f32[idx++];
  header.cellDims.y = f32[idx++];
  header.cellDims.z = f32[idx++];
  header.angles.x = f32[idx++];
  header.angles.y = f32[idx++];
  header.angles.z = f32[idx++];
  header.crs2xyz.push(i32[idx++]);
  header.crs2xyz.push(i32[idx++]);
  header.crs2xyz.push(i32[idx++]);
  header.dmin = f32[idx++];
  header.dmax = f32[idx++];
  header.dmean = f32[idx++];
  header.ispg = u32[idx++];
  header.nsymbt = u32[idx++];
  header.lksflg = u32[idx++];
  header.customData = new Uint8Array(buffer, idx * 4, 96);
  idx += 24;
  header.origin.x = f32[idx++];
  header.origin.y = f32[idx++];
  header.origin.z = f32[idx++];
  header.map = new Uint8Array(buffer, idx * 4, 4);
  idx++;
  header.machine = u32[idx++];
  header.arms = f32[idx++];
  header.nlabel = u32[idx++];
  header.label = new Uint8Array(buffer, idx * 4, 800);

  // Apply header conversion
  // Mapping between CCP4 column, row, section and VMD x, y, z.
  var crs2xyz = header.crs2xyz;
  if (crs2xyz[0] === 0 && crs2xyz[1] === 0 && crs2xyz[2] === 0) {
    crs2xyz[0] = 1;
    crs2xyz[1] = 2;
    crs2xyz[2] = 3;
  }

  var xyz2crs = this._xyz2crs = [];
  xyz2crs[crs2xyz[0] - 1] = 0; // column
  xyz2crs[crs2xyz[1] - 1] = 1; // row
  xyz2crs[crs2xyz[2] - 1] = 2; // section

  var xIndex = xyz2crs[0];
  var yIndex = xyz2crs[1];
  var zIndex = xyz2crs[2];

  // calculate non-orthogonal unit cell coordinates
  header.angles.multiplyScalar(Math.PI / 180.0);

  if (header.cellDims.x === 0.0 && header.cellDims.y === 0.0 && header.cellDims.z === 0.0) {
    header.cellDims.set(1.0, 1.0, 1.0);
  }

  var xScale = header.cellDims.x / header.gridX;
  var yScale = header.cellDims.y / header.gridY;
  var zScale = header.cellDims.z / header.gridZ;

  var z1 = Math.cos(header.angles.y);
  var z2 = (Math.cos(header.angles.x) - Math.cos(header.angles.y) *
      Math.cos(header.angles.z)) / Math.sin(header.angles.z);
  var z3 = Math.sqrt(1.0 - z1 * z1 - z2 * z2);
  var xaxis = new THREE.Vector3(xScale, 0, 0);
  var yaxis = new THREE.Vector3(Math.cos(header.angles.y) * yScale, Math.sin(header.angles.y) * yScale, 0);
  var zaxis = new THREE.Vector3(z1 * zScale, z2 * zScale, z3 * zScale);

  // Handle both MRC-2000 and older format maps
  if (header.origin.x === 0.0 && header.origin.y === 0.0 && header.origin.z === 0.0) {
    this._origin = new THREE.Vector3(0, 0, 0);
    this._origin.addScaledVector(xaxis, header.nstart[xIndex]);
    this._origin.addScaledVector(yaxis, header.nstart[yIndex]);
    this._origin.addScaledVector(zaxis, header.nstart[zIndex]);
  } else {
    this._origin = header.origin;
    // Use ORIGIN records rather than old n[xyz]start records
    //   http://www2.mrc-lmb.cam.ac.uk/image2000.html
    // XXX the ORIGIN field is only used by the EM community, and
    //     has undefined meaning for non-orthogonal maps and/or
    //     non-cubic voxels, etc.
  }

  xaxis.multiplyScalar(header.extent[xIndex] - 1);
  yaxis.multiplyScalar(header.extent[yIndex] - 1);
  zaxis.multiplyScalar(header.extent[zIndex] - 1);

  if (header.type === 2) {
    this._data = new Float32Array(buffer, 1024 + header.nsymbt, header.extent[0] * header.extent[1] * header.extent[2]);
  } else {
    throw new Error('CCP4: Unsupported format ' + header.type);
  }

  this._bboxSize = new THREE.Vector3(xaxis.length(), yaxis.length(), zaxis.length());
};

Ccp4Model.prototype.getXYZdim = function() {
  return [this._header.extent[this._xyz2crs[0]],
    this._header.extent[this._xyz2crs[1]],
    this._header.extent[this._xyz2crs[2]]];
};

Ccp4Model.prototype.getXYZbox = function() {
  return new THREE.Box3(this._origin.clone(), this._origin.clone().add(this._bboxSize));
};

Ccp4Model.prototype.getXYZcellSize = function() {
  var dim = this.getXYZdim();
  var res = this._bboxSize.clone();
  res.x /= dim[0];
  res.y /= dim[1];
  res.z /= dim[2];
  return res;
};

Ccp4Model.prototype.toXYZData = function() {
  var header = this._header;
  var data = this._data;
  var xyz2crs = this._xyz2crs;
  var xyzData = new Float32Array(data.length);

  var dim = this.getXYZdim();
  var xSize = dim[0];
  var ySize = dim[1];

  var crsIdx = 0;
  var coord = [];
  var x, y, z;
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
};

function CCP4Parser(data, options) {
  Parser.call(this, data, options);

  this._options.fileType = 'ccp4';
}

////////////////////////////////////////////////////////////////////////////
// Inheritance

utils.deriveClass(CCP4Parser, Parser);

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
CCP4Parser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  return data instanceof ArrayBuffer && Parser.checkDataTypeOptions(options, 'ccp4');
};

CCP4Parser.canProbablyParse = function(_data) {
  return false; // Autodetection is not implemented yet
};

CCP4Parser.prototype.parseSync = function() {
  const ccp4 = new Ccp4Model();
  ccp4.load(this._data);
  return new Volume(Float32Array, ccp4.getXYZdim(), ccp4.getXYZbox(), 1, ccp4.toXYZData());
};

CCP4Parser.formats = ['ccp4'];
CCP4Parser.extensions = ['.ccp4'];
CCP4Parser.binary = true;

export default CCP4Parser;
