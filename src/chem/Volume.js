

//////////////////////////////////////////////////////////////////////////////
import DataSource from './DataSource';
import * as THREE from 'three';
import utils from '../utils';
//////////////////////////////////////////////////////////////////////////////

/**
 * Volume constructor
 *
 * @param {Object} type - Float32Array, Int8Array, etc...
 * @param {Object|Array} dimensions - number of data points on each axis (x, y, z)
 * @param {Box3} box - bounding box defining data place in metric space,
 *                     it's corners correspond to extreme data points
 * @param {Number} vecSize - dimension of the field data point (1 = scalar, 3 = 3D vector)
 * @param {Object} data - typed array of the same type as specified by the 1st parameter,
 *                        layout: point by point along X,
 *                                row by row along Y,
 *                                plane by plane along Z
 */
function Volume(type, dimensions, box, vecSize, data) {
  this._box = box.clone();
  this._dimVec = Math.max(Math.floor(vecSize || 1), 1);

  if (dimensions instanceof Array) {
    this._dimX = dimensions[0];
    this._dimY = dimensions[1];
    this._dimZ = dimensions[2];
  } else {
    this._dimX = dimensions.x;
    this._dimY = dimensions.y;
    this._dimZ = dimensions.z;
  }
  this._dimX = Math.max(Math.floor(this._dimX), 1);
  this._dimY = Math.max(Math.floor(this._dimY), 1);
  this._dimZ = Math.max(Math.floor(this._dimZ), 1);

  this._rowElements = this._dimVec * this._dimX;
  this._planeElements = this._rowElements * this._dimY;
  this._totalElements = this._planeElements * this._dimZ;

  this._data = data || utils.allocateTyped(type, this._totalElements);

  // override getter/setter for vector fields
  switch (this._dimVec) {
  case 1:
    break;

  case 2:
    this.getValue = function(x, y, z) {
      var idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
      return [this._data[idx], this._data[idx + 1]];
    };

    this.setValue = function(x, y, z) {
      var idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
      this._data[idx] = arguments[3];
      this._data[idx + 1] = arguments[4];
    };

    this.addValue = function(x, y, z) {
      var idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
      this._data[idx] += arguments[3];
      this._data[idx + 1] += arguments[4];
    };
    break;

  case 3:
    this.getValue = function(x, y, z) {
      var idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
      return [this._data[idx], this._data[idx + 1], this._data[idx + 2]];
    };

    this.setValue = function(x, y, z) {
      var idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
      this._data[idx] = arguments[3];
      this._data[idx + 1] = arguments[4];
      this._data[idx + 2] = arguments[5];
    };

    this.addValue = function(x, y, z) {
      var idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
      this._data[idx] += arguments[3];
      this._data[idx + 1] += arguments[4];
      this._data[idx + 2] += arguments[5];
    };
    break;

  default:
    throw new Error('Volume: invalid vector dimension');
  }
}

utils.deriveClass(Volume, DataSource, {
  id: 'Volume'
});

// default getter assumes it's a scalar field
Volume.prototype.getValue = function(x, y, z) {
  return this._data[x + y * this._rowElements + z * this._planeElements];
};

// default setter assumes it's a scalar field
Volume.prototype.setValue = function(x, y, z, val) {
  this._data[x + y * this._rowElements + z * this._planeElements] = val;
};

// default adder assumes it's a scalar field
Volume.prototype.addValue = function(x, y, z, val) {
  this._data[x + y * this._rowElements + z * this._planeElements] += val;
};

Volume.prototype.getDimensions = function() {
  return [this._dimX, this._dimY, this._dimZ];
};

Volume.prototype.getBox = function() {
  return this._box;
};

Volume.prototype.getCellSize = function() {
  var boxSize = this._box.getSize();
  var res = new THREE.Vector3();
  res.x = this._dimX > 1 ? boxSize.x / (this._dimX - 1) : 0;
  res.y = this._dimY > 1 ? boxSize.y / (this._dimY - 1) : 0;
  res.z = this._dimZ > 1 ? boxSize.z / (this._dimZ - 1) : 0;
  return res;
};

Volume.prototype.computeGradient = function() {
  if (this._dimVec !== 1) {
    // gradient can only be computed for scalar fields
    return null;
  }

  // create a 3D vector field of gradients
  var gradient = new Volume(Float32Array, [this._dimX, this._dimY, this._dimZ], this._box, 3);

  // calculate cell side lengths
  var vl = this.getCellSize();

  // gradient axis scaling values and averaging factors, to correctly
  // calculate the gradient for volumes with irregular cell spacing
  var vs = new THREE.Vector3(-0.5 / vl.x, -0.5 / vl.y, -0.5 / vl.z);

  // TODO Check for intended bug in VMD (min is zero)
  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  var xSize = this._dimX;
  var ySize = this._dimY;
  var zSize = this._dimZ;
  var volMap = this._data;

  function _voxelValue(x, y, z) {
    return volMap[z * xSize * ySize + y * xSize + x];
  }

  for (var zi = 0; zi < zSize; ++zi) {
    var zm = clamp(zi - 1, 0, zSize - 1);
    var zp = clamp(zi + 1, 0, zSize - 1);

    for (var yi = 0; yi < ySize; ++yi) {
      var ym = clamp(yi - 1, 0, ySize - 1);
      var yp = clamp(yi + 1, 0, ySize - 1);

      for (var xi = 0; xi < xSize; ++xi) {
        var xm = clamp(xi - 1, 0, xSize - 1);
        var xp = clamp(xi + 1, 0, xSize - 1);

        // Calculate the volume gradient at each grid cell.
        // Gradients are now stored unnormalized, since we need them in pure
        // form in order to draw field lines etc.  Shading code will now have
        // to do renormalization for itself on-the-fly.

        // XXX this gradient is only correct for orthogonal grids, since
        // we're using the array index offsets rather to calculate the gradient
        // rather than voxel coordinate offsets.  This will have to be
        // re-worked for non-orthogonal datasets.

        gradient.setValue(
          xi, yi, zi,
          (_voxelValue(xp, yi, zi) - _voxelValue(xm, yi, zi)) * vs.x,
          (_voxelValue(xi, yp, zi) - _voxelValue(xi, ym, zi)) * vs.y,
          (_voxelValue(xi, yi, zp) - _voxelValue(xi, yi, zm)) * vs.z
        );
      }
    }
  }

  return gradient;
};

Volume.prototype.normalize = function() {
  var data = this._data;
  var i;

  // get min/max
  var min = data[0];
  var max = data[0];
  for (i = 1; i < data.length; ++i) {
    min = Math.min(min, data[i]);
    max = Math.max(max, data[i]);
  }

  var d = 1.0 / (max - min);
  if (d === 0) {
    return;
  }

  // normalize
  for (i = 0; i < data.length; ++i) {
    data[i] = d * (data[i] - min);
  }
};

function pow2ceil(v) {
  var p = 2;
  v = (v - 1) >> 1;
  while (v) {
    p <<= 1;
    v >>= 1;
  }
  return p;
}

Volume.prototype.getTiledTextureStride = function() {
  return [this._dimX + 2, this._dimY + 2];
};

Volume.prototype.buildTiledTexture = function() {
  var tilesX = Math.ceil(Math.sqrt(this._dimZ * this._dimY / this._dimX));

  var width = tilesX * (this._dimX + 2) - 1;
  width = pow2ceil(width);
  tilesX = Math.floor(width / (this._dimX + 2));

  var tilesY = Math.ceil(this._dimZ / tilesX);
  var height = tilesY * (this._dimY + 2) - 1;
  height = pow2ceil(height);

  var data = new Uint8Array(width * height);

  var src, dst, tileRow, row, t, x;
  for (tileRow = 0; tileRow < tilesY; ++tileRow) {
    // process each pixel row of this tile row
    for (row = 0; row < this._dimY; ++row) {
      src = tileRow * tilesX * this._planeElements + row * this._rowElements;
      dst = width * (tileRow * (this._dimY + 2) + row);
      // copy a series of rows through several XY planes
      for (t = 0; t < tilesX; ++t) {
        // copy one row of one XY plane
        for (x = 0; x < this._dimX; ++x) {
          data[dst++] = 255.0 * this._data[src++];
        }

        // repeat last pixel of previous tile
        data[dst++] = 255.0 * this._data[src - 1];

        if (t < tilesX - 1) {
          // skip to the same row of next XY plane
          src += this._planeElements - this._rowElements;
          // repeat first pixel of next tile
          data[dst++] = 255.0 * this._data[src];
        }
      }
    }
  }

  // fill pixels between tile rows with copy of edge pixels
  for (tileRow = 0; tileRow < tilesY; ++tileRow) {
    // copy last pixel row of this tile row to the following pixel row of the texture
    src = width * (tileRow * (this._dimY + 2) + this._dimY - 1);
    dst = src + width;
    for (x = 0; x < width; ++x) {
      data[dst++] = data[src++];
    }
    if (tileRow < tilesY - 1) {
      // copy first pixel row of next tile row to the preceding pixel row of the texture
      src = width * (tileRow + 1) * (this._dimY + 2);
      dst = src - width;
      for (x = 0; x < width; ++x) {
        data[dst++] = data[src++];
      }
    }
  }

  var texture = new THREE.DataTexture(
    data, width, height, THREE.LuminanceFormat, THREE.UnsignedByteType,
    THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearFilter, THREE.LinearFilter
  );
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

/**********************************************************************************
   *
   * Methods that provide direct access to internal array (for better performance)
   *
   *********************************************************************************/

Volume.prototype.getData = function() {
  return this._data;
};

Volume.prototype.getDirectIdx = function(x, y, z) {
  return x * this._dimVec + y * this._rowElements + z * this._planeElements;
};

Volume.prototype.getStrideX = function() {
  return this._dimVec;
};

Volume.prototype.getStrideY = function() {
  return this._rowElements;
};

Volume.prototype.getStrideZ = function() {
  return this._planeElements;
};

export default Volume;

