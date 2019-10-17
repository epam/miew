import * as THREE from 'three';
import utils from '../../utils';

const FBX_POS_SIZE = 3;
const FBX_NORM_SIZE = 3;
const FBX_COL_SIZE = 4;

function copyFbxPoint3(src, srcIdx, dst, dstIdx) { // FIXME make param order unified
  dst[dstIdx] = src[srcIdx];
  dst[dstIdx + 1] = src[srcIdx + 1];
  dst[dstIdx + 2] = src[srcIdx + 2];
}

function copyFbxPoint4(src, srcIdx, dst, dstIdx, value) {
  dst[dstIdx] = src[srcIdx];
  dst[dstIdx + 1] = src[srcIdx + 1];
  dst[dstIdx + 2] = src[srcIdx + 2];
  dst[dstIdx + 3] = value;
}

function copyFbxXYZW(dst, dstIdx, x, y, z, w) {
  dst[dstIdx] = x;
  dst[dstIdx + 1] = y;
  dst[dstIdx + 2] = z;
  dst[dstIdx + 3] = w;
}
const vector4 = new THREE.Vector4();
function copyTransformedPoint3(src, srcIdx, dst, dstIdx, opts) {
  vector4.set(src[srcIdx], src[srcIdx + 1], src[srcIdx + 2], opts.w);
  vector4.applyMatrix4(opts.matrix);
  dst[dstIdx] = vector4.x;
  dst[dstIdx + 1] = vector4.y;
  dst[dstIdx + 2] = vector4.z;
}

export default class FBXModel {
  constructor() {
    this.positions = null;
    this.normals = null;
    this.colors = null;
    this.indices = null;
    this.lastPos = 0;
    this.lastNorm = 0;
    this.lastCol = 0;
    this.lastIdx = 0;
    this.itemSize = {
      position: FBX_POS_SIZE,
      normal: FBX_NORM_SIZE,
      color: FBX_COL_SIZE,
    };
  }

  init(vertsCount, indsCount) {
    this.positions = new Float32Array(vertsCount * FBX_POS_SIZE);
    this.normals = new Float32Array(vertsCount * FBX_NORM_SIZE);
    this.colors = new Float32Array(vertsCount * FBX_COL_SIZE);
    this.indices = new Int32Array(indsCount);
  }

  setPositions(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.positions, this.lastPos, FBX_POS_SIZE, copyFbxPoint3);
    this.lastPos += count * FBX_POS_SIZE;
  }

  setTransformedPositions(array, start, count, stride, matrix) {
    let idx = this.lastPos;
    let arrIdx = start;
    const opts = { matrix, w: 1 };
    for (let i = 0; i < count; ++i, arrIdx += stride, idx += FBX_POS_SIZE) {
      copyTransformedPoint3(array, arrIdx, this.positions, idx, opts);
    }
    this.lastPos += count * FBX_POS_SIZE;
  }

  setNormals(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.normals, this.lastNorm, FBX_NORM_SIZE, copyFbxPoint3);
    this.lastNorm += count * FBX_NORM_SIZE;
  }

  setTransformedNormals(array, start, count, stride, matrix) {
    let idx = this.lastNorm;
    let arrIdx = start;
    const opts = { matrix, w: 0 };
    for (let i = 0; i < count; ++i, arrIdx += stride, idx += FBX_NORM_SIZE) {
      copyTransformedPoint3(array, arrIdx, this.normals, idx, opts);
    }
    this.lastNorm += count * FBX_NORM_SIZE;
  }

  setColors(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.colors, this.lastCol, FBX_COL_SIZE, copyFbxPoint4, 1);
    this.lastCol += count * FBX_COL_SIZE;
  }

  setColor(count, r, g, b) {
    for (let i = 0, colIdx = this.lastCol; i < count; i++, colIdx += FBX_COL_SIZE) {
      copyFbxXYZW(this.colors, colIdx, r, g, b, 1);
    }
    this.lastCol += count * FBX_COL_SIZE;
  }

  setIndices(array, start, count) {
    this.indices.set(array, this.lastIdx);
    this.lastIdx += count;
  }

  setShiftedIndices(array, count, shift) {
    const shifted = array.map((x) => x + shift);
    this.setIndices(shifted, 0, count);
  }

  _setSubArray(srcArray, srcStart, srcStride, count, dstArray, dstStart, dstStride, copyFunctor, opts) {
    if ((dstArray.length - dstStart) / dstStride < count
      || (srcArray.length - srcStart) / srcStride < count) {
      return; // we've got no space
    }
    if (srcStride === dstStride) { // stride is the same
      dstArray.set(srcArray, dstStart);
    } else {
      let idx = dstStart;
      let arridx = srcStart;
      for (let i = 0; i < count; ++i, idx += dstStride, arridx += srcStride) {
        copyFunctor(srcArray, arridx, dstArray, idx, opts);
      }
    }
  }

  getVerticesNumber() {
    return this.lastPos / FBX_POS_SIZE;
  }

  addInstance(matrix, geo) {
    // add indices at first to take old number of vertices for shift
    const currentCount = this.getVerticesNumber();
    this.setShiftedIndices(geo.indices, geo.indices.length, currentCount);
    // simply write vertices at empty space
    const size = geo.itemSize;
    this.setTransformedPositions(geo.positions, 0, geo.vertsCount, size.position, matrix);
    this.setTransformedNormals(geo.normals, 0, geo.vertsCount, size.normal, matrix);
    this.setColors(geo.colors, 0, geo.vertsCount, size.color);
  }

  concatenate(model) {
    // store number of vertices before addition
    const currentCount = this.getVerticesNumber();
    // add vertices by extending existed arrays
    this.positions = utils.ConcatTypedArraysUnsafe(this.positions, model.positions);
    this.normals = utils.ConcatTypedArraysUnsafe(this.normals, model.normals);
    this.colors = utils.ConcatTypedArraysUnsafe(this.colors, model.colors);
    // shift indices due to already existed verts in model and add them
    model.indices = model.indices.map((x) => x + currentCount);
    model.reworkIndices();
    this.indices = utils.ConcatTypedArraysUnsafe(this.indices, model.indices);
    // update lasts
    this.lastPos = this.positions.length;
    this.lastNorm = this.normals.length;
    this.lastCol = this.colors.length;
    this.lastIdx = this.indices.length;
  }

  /**
   * Reworking indices buffer, see https://banexdevblog.wordpress.com/2014/06/23/a-quick-tutorial-about-the-fbx-ascii-format/
   * basically, every triangle in Miew has been represented hat way (e.g.) : 0,1,7, but we must (for FBX) rework that
   * into: 0,1,-8.
   */
  reworkIndices() {
    const faceSize = 3;
    for (let i = faceSize - 1; i < this.indices.length; i += faceSize) {
      this.indices[i] *= -1;
      this.indices[i]--;
    }
  }
}
