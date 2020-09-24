import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';

const MAX_IDC_16BIT = 65535;
const VERTEX_PER_SEGMENT = 4;
const POS_SIZE = 4;
const DIR_SIZE = 3;
const COL_SIZE = 3;
const tmpColor = new THREE.Color();
const direction = new THREE.Vector3();

function setArrayXYZ(arr, idx, x, y, z) {
  arr[idx] = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
}

function setArrayXYZW(arr, idx, x, y, z, w) {
  arr[idx] = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
  arr[idx + 3] = w;
}

function getSubset(arr, startSegmentIdx, segmentsCount, elemSize) {
  const start = startSegmentIdx * VERTEX_PER_SEGMENT;
  const end = start + segmentsCount * VERTEX_PER_SEGMENT;
  return arr.subarray(start * elemSize, end * elemSize);
}

/**
 * This class represents lines geometry which consists of screen-aligned narrow quad of variable width.
 *
 * @constructor
 *
 * @param {number}  segmentsCount   Number of segments per chunk.
 * collision geometry.
 */

class ThickLinesGeometry extends THREE.BufferGeometry {
  constructor(segmentsCount) {
    super();
    this._initVertices(segmentsCount);
  }

  startUpdate() {
    return true;
  }

  finishUpdate() {
    this.getAttribute('position').needsUpdate = true;
    this.getAttribute('color').needsUpdate = true;
    this.getAttribute('alphaColor').needsUpdate = true;
    this.getAttribute('direction').needsUpdate = true;
  }

  setColor(segmentIdx, colorVal) {
    tmpColor.set(colorVal);
    let idx = segmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
    setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
    idx += COL_SIZE;
    setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
    idx += COL_SIZE;
    setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
    idx += COL_SIZE;
    setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
  }

  setSegment(segmentIdx, pos1, pos2) {
    direction.subVectors(pos1, pos2);
    direction.normalize();
    const positions = this._positions;
    const directions = this._directions;
    let idx = segmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
    let dirIdx = segmentIdx * VERTEX_PER_SEGMENT * DIR_SIZE;
    setArrayXYZW(positions, idx, pos1.x, pos1.y, pos1.z, 0.5);
    setArrayXYZ(directions, dirIdx, direction.x, direction.y, direction.z);
    idx += POS_SIZE;
    dirIdx += DIR_SIZE;
    setArrayXYZW(positions, idx, pos1.x, pos1.y, pos1.z, -0.5);
    setArrayXYZ(directions, dirIdx, direction.x, direction.y, direction.z);
    idx += POS_SIZE;
    dirIdx += DIR_SIZE;
    setArrayXYZW(positions, idx, pos2.x, pos2.y, pos2.z, 0.5);
    setArrayXYZ(directions, dirIdx, direction.x, direction.y, direction.z);
    idx += POS_SIZE;
    dirIdx += DIR_SIZE;
    setArrayXYZW(positions, idx, pos2.x, pos2.y, pos2.z, -0.5);
    setArrayXYZ(directions, dirIdx, direction.x, direction.y, direction.z);
  }

  setOpacity(startSegIdx, endSegIdx, value) {
    const start = startSegIdx * VERTEX_PER_SEGMENT;
    const end = endSegIdx * VERTEX_PER_SEGMENT;
    _.fill(this.alpha, value, end, start);
    this.getAttribute('alphaColor').needsUpdate = true;
  }

  getSubsetSegments(startSegmentIdx, segmentsCount) {
    return [
      getSubset(this._positions, startSegmentIdx, segmentsCount, POS_SIZE),
      getSubset(this._directions, startSegmentIdx, segmentsCount, DIR_SIZE),
    ];
  }

  getSubsetColors(startSegmentIdx, segmentsCount) {
    return getSubset(this._colors, startSegmentIdx, segmentsCount, COL_SIZE);
  }

  getSubsetOpacities(startSegmentIdx, segmentsCount) {
    return getSubset(this._alpha, startSegmentIdx, segmentsCount, 1);
  }

  getNumVertexPerSegment() {
    return VERTEX_PER_SEGMENT;
  }

  getPositionSize() {
    return POS_SIZE;
  }

  setSegments(startSegmentIdx, positions) {
    const startPos = startSegmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
    if (positions instanceof Array && positions.length === 2) {
      this._positions.set(positions[0], startPos);
      const startDir = startSegmentIdx * VERTEX_PER_SEGMENT * DIR_SIZE;
      this._directions.set(positions[1], startDir); // dirs are geo part of vertex
    } else {
      this._positions.set(positions, startPos);
    }
  }

  setColors(startSegmentIdx, colors) {
    const start = startSegmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
    this._colors.set(colors, start);
  }

  _initVertices(segmentsCount) {
    this._buffersSize = segmentsCount * VERTEX_PER_SEGMENT;
    const pointsCount = this._buffersSize;
    const use32bitIndex = pointsCount > MAX_IDC_16BIT;
    this._index = utils.allocateTyped(use32bitIndex ? Uint32Array : Uint16Array, segmentsCount * 6);
    this._positions = utils.allocateTyped(Float32Array, pointsCount * POS_SIZE);
    this._colors = utils.allocateTyped(Float32Array, pointsCount * COL_SIZE);
    this._directions = utils.allocateTyped(Float32Array, pointsCount * DIR_SIZE);
    const alpha = this._alpha = utils.allocateTyped(Float32Array, pointsCount);
    _.fill(alpha, 1.0);

    const index = this._index;
    let indexOffset = 0;
    let pointOffset = 0;
    for (let j = 0; j < segmentsCount; j++, indexOffset += 6, pointOffset += VERTEX_PER_SEGMENT) {
      index[indexOffset] = pointOffset;
      index[indexOffset + 1] = pointOffset + 1;
      index[indexOffset + 2] = pointOffset + 3;
      index[indexOffset + 3] = pointOffset;
      index[indexOffset + 4] = pointOffset + 2;
      index[indexOffset + 5] = pointOffset + 3;
    }
    this.setIndex(new THREE.BufferAttribute(this._index, 1));

    this.setAttribute('position', new THREE.BufferAttribute(this._positions, POS_SIZE));
    this.setAttribute('color', new THREE.BufferAttribute(this._colors, COL_SIZE));
    this.setAttribute('alphaColor', new THREE.BufferAttribute(alpha, 1));
    this.setAttribute('direction', new THREE.BufferAttribute(this._directions, DIR_SIZE));
  }
}

export default ThickLinesGeometry;
