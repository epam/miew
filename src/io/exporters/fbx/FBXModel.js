import * as THREE from 'three';

const FBX_POS_SIZE = 3;
const FBX_NORM_SIZE = 3;
const FBX_COL_SIZE = 4;

function copyFbxPoint3(src, srcIdx, dst, dstIdx) {
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

const vector4 = new THREE.Vector4();
function copyTransformedPoint3(src, srcIdx, dst, dstIdx, opts) {
  vector4.set(src[srcIdx], src[srcIdx + 1], src[srcIdx + 2], opts.w);
  vector4.applyMatrix4(opts.matrix);
  dst[dstIdx] = vector4.x;
  dst[dstIdx + 1] = vector4.y;
  dst[dstIdx + 2] = vector4.z;
}

function setSubArray(src, dst, count, copyFunctor, functorOpts) {
  if ((dst.array.length - dst.start) / dst.stride < count
    || (src.array.length - src.start) / src.stride < count) {
    return; // we've got no space
  }
  if (src.stride === dst.stride) { // stride is the same
    dst.array.set(src.array, dst.start);
  } else {
    let idx = dst.start;
    let arridx = src.start;
    for (let i = 0; i < count; ++i, idx += dst.stride, arridx += src.stride) {
      copyFunctor(src.array, arridx, dst.array, idx, functorOpts);
    }
  }
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
  }

  init(vertsCount, indsCount) {
    this.positions = new Float32Array(vertsCount * FBX_POS_SIZE);
    this.normals = new Float32Array(vertsCount * FBX_NORM_SIZE);
    this.colors = new Float32Array(vertsCount * FBX_COL_SIZE);
    this.indices = new Int32Array(indsCount);
  }

  setPositions(array, start, count, stride) {
    const src = {
      array,
      start,
      stride,
    };
    const dst = {
      array: this.positions,
      start: this.lastPos,
      stride: FBX_POS_SIZE,
    };
    setSubArray(src, dst, count, copyFbxPoint3);
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
    const src = {
      array,
      start,
      stride,
    };
    const dst = {
      array: this.normals,
      start: this.lastNorm,
      stride: FBX_NORM_SIZE,
    };
    setSubArray(src, dst, count, copyFbxPoint3);
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
    const src = {
      array,
      start,
      stride,
    };
    const dst = {
      array: this.colors,
      start: this.lastCol,
      stride: FBX_COL_SIZE,
    };
    setSubArray(src, dst, count, copyFbxPoint4, 1);
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
}
