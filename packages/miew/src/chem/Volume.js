import * as THREE from 'three';
import utils from '../utils';

function pow2ceil(v) {
  let p = 2;
  v = (v - 1) >> 1;
  while (v) {
    p <<= 1;
    v >>= 1;
  }
  return p;
}

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
 * @param {Number} volumeInfo - volume info values to define threshold to filter the noise
 */

class Volume {
  constructor(type, dimensions, box, vecSize, data, volumeInfo) {
    this._box = box.clone();
    this._dimVec = Math.max(Math.floor(vecSize || 1), 1);
    this._volumeInfo = volumeInfo;

    if (dimensions instanceof Array) {
      [this._dimX, this._dimY, this._dimZ] = dimensions;
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
        this.getValue = function (x, y, z) {
          const idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
          return [this._data[idx], this._data[idx + 1]];
        };

        this.setValue = function (x, y, z, a, b) {
          const idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
          this._data[idx] = a;
          this._data[idx + 1] = b;
        };

        this.addValue = function (x, y, z, a, b) {
          const idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
          this._data[idx] += a;
          this._data[idx + 1] += b;
        };
        break;

      case 3:
        this.getValue = function (x, y, z) {
          const idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
          return [this._data[idx], this._data[idx + 1], this._data[idx + 2]];
        };

        this.setValue = function (x, y, z, a, b, c) {
          const idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
          this._data[idx] = a;
          this._data[idx + 1] = b;
          this._data[idx + 2] = c;
        };

        this.addValue = function (x, y, z, a, b, c) {
          const idx = x * this._dimVec + y * this._rowElements + z * this._planeElements;
          this._data[idx] += a;
          this._data[idx + 1] += b;
          this._data[idx + 2] += c;
        };
        break;

      default:
        throw new Error('Volume: invalid vector dimension');
    }
  }

  // default getter assumes it's a scalar field
  getValue(x, y, z) {
    return this._data[x + y * this._rowElements + z * this._planeElements];
  }

  // default setter assumes it's a scalar field
  setValue(x, y, z, val) {
    this._data[x + y * this._rowElements + z * this._planeElements] = val;
  }

  // default adder assumes it's a scalar field
  addValue(x, y, z, val) {
    this._data[x + y * this._rowElements + z * this._planeElements] += val;
  }

  getDimensions() {
    return [this._dimX, this._dimY, this._dimZ];
  }

  getBox() {
    return this._box;
  }

  getVolumeInfo() {
    return this._volumeInfo;
  }

  getCellSize() {
    const boxSize = new THREE.Vector3();
    this._box.getSize(boxSize);
    const res = new THREE.Vector3();
    res.x = this._dimX > 1 ? boxSize.x / (this._dimX - 1) : 0;
    res.y = this._dimY > 1 ? boxSize.y / (this._dimY - 1) : 0;
    res.z = this._dimZ > 1 ? boxSize.z / (this._dimZ - 1) : 0;
    return res;
  }

  computeGradient() {
    if (this._dimVec !== 1) {
      // gradient can only be computed for scalar fields
      return null;
    }

    // create a 3D vector field of gradients
    const gradient = new Volume(Float32Array, [this._dimX, this._dimY, this._dimZ], this._box, 3);

    // calculate cell side lengths
    const vl = this.getCellSize();

    // gradient axis scaling values and averaging factors, to correctly
    // calculate the gradient for volumes with irregular cell spacing
    const vs = new THREE.Vector3(-0.5 / vl.x, -0.5 / vl.y, -0.5 / vl.z);

    // TODO Check for intended bug in VMD (min is zero)
    function clamp(val, min, max) {
      return Math.min(max, Math.max(min, val));
    }

    const xSize = this._dimX;
    const ySize = this._dimY;
    const zSize = this._dimZ;
    const volMap = this._data;

    function _voxelValue(x, y, z) {
      return volMap[z * xSize * ySize + y * xSize + x];
    }

    for (let zi = 0; zi < zSize; ++zi) {
      const zm = clamp(zi - 1, 0, zSize - 1);
      const zp = clamp(zi + 1, 0, zSize - 1);

      for (let yi = 0; yi < ySize; ++yi) {
        const ym = clamp(yi - 1, 0, ySize - 1);
        const yp = clamp(yi + 1, 0, ySize - 1);

        for (let xi = 0; xi < xSize; ++xi) {
          const xm = clamp(xi - 1, 0, xSize - 1);
          const xp = clamp(xi + 1, 0, xSize - 1);

          // Calculate the volume gradient at each grid cell.
          // Gradients are now stored unnormalized, since we need them in pure
          // form in order to draw field lines etc.  Shading code will now have
          // to do renormalization for itself on-the-fly.

          // XXX this gradient is only correct for orthogonal grids, since
          // we're using the array index offsets rather to calculate the gradient
          // rather than voxel coordinate offsets.  This will have to be
          // re-worked for non-orthogonal datasets.

          gradient.setValue(
            xi,
            yi,
            zi,
            (_voxelValue(xp, yi, zi) - _voxelValue(xm, yi, zi)) * vs.x,
            (_voxelValue(xi, yp, zi) - _voxelValue(xi, ym, zi)) * vs.y,
            (_voxelValue(xi, yi, zp) - _voxelValue(xi, yi, zm)) * vs.z,
          );
        }
      }
    }

    return gradient;
  }

  normalize() {
    const data = this._data;

    // get min/max
    let min = data[0];
    let max = data[0];
    for (let i = 1; i < data.length; ++i) {
      min = Math.min(min, data[i]);
      max = Math.max(max, data[i]);
    }

    const d = 1.0 / (max - min);
    if (d === 0) {
      return;
    }

    // normalize
    for (let i = 0; i < data.length; ++i) {
      data[i] = d * (data[i] - min);
    }
  }

  getTiledTextureStride() {
    return [this._dimX + 2, this._dimY + 2];
  }

  buildTiledTexture() {
    let tilesX = Math.ceil(Math.sqrt(this._dimZ * this._dimY / this._dimX));

    let width = tilesX * (this._dimX + 2) - 1;
    width = pow2ceil(width);
    tilesX = Math.floor(width / (this._dimX + 2));

    const tilesY = Math.ceil(this._dimZ / tilesX);
    let height = tilesY * (this._dimY + 2) - 1;
    height = pow2ceil(height);

    const data = new Uint8Array(width * height);

    let src;
    let dst;
    for (let tileRow = 0; tileRow < tilesY; ++tileRow) {
      // process each pixel row of this tile row
      for (let row = 0; row < this._dimY; ++row) {
        src = tileRow * tilesX * this._planeElements + row * this._rowElements;
        dst = width * (tileRow * (this._dimY + 2) + row);
        // copy a series of rows through several XY planes
        for (let t = 0; t < tilesX; ++t) {
          // copy one row of one XY plane
          for (let x = 0; x < this._dimX; ++x) {
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
    for (let tileRow = 0; tileRow < tilesY; ++tileRow) {
      // copy last pixel row of this tile row to the following pixel row of the texture
      src = width * (tileRow * (this._dimY + 2) + this._dimY - 1);
      dst = src + width;
      for (let x = 0; x < width; ++x) {
        data[dst++] = data[src++];
      }
      if (tileRow < tilesY - 1) {
        // copy first pixel row of next tile row to the preceding pixel row of the texture
        src = width * (tileRow + 1) * (this._dimY + 2);
        dst = src - width;
        for (let x = 0; x < width; ++x) {
          data[dst++] = data[src++];
        }
      }
    }

    const texture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.LuminanceFormat,
      THREE.UnsignedByteType,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter,
    );
    texture.needsUpdate = true;
    return texture;
  }

  /* ********************************************************************************
   *
   * Methods that provide direct access to internal array (for better performance)
   *
   ******************************************************************************** */

  getData() {
    return this._data;
  }

  getDirectIdx(x, y, z) {
    return x * this._dimVec + y * this._rowElements + z * this._planeElements;
  }

  getStrideX() {
    return this._dimVec;
  }

  getStrideY() {
    return this._rowElements;
  }

  getStrideZ() {
    return this._planeElements;
  }
}

Volume.prototype.id = 'Volume';

export default Volume;
