import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';

const VERTEX_PER_SEGMENT = 2;
const POS_SIZE = 3;
const COL_SIZE = 3;
const tmpColor = new THREE.Color();

function setArrayXYZ(arr, idx, x, y, z) {
  arr[idx] = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
}

function getSubset(arr, startSegmentIdx, segmentsCount, elemSize) {
  const start = startSegmentIdx * VERTEX_PER_SEGMENT;
  const end = start + segmentsCount * VERTEX_PER_SEGMENT;
  return arr.subarray(start * elemSize, end * elemSize);
}

/**
 * This class represents geometry which consists of separate colored segments.
 *
 * @constructor
 *
 * @param {number}  segmentsCount   Number of segments per chunk.
 * collision geometry.
 */

class ThinLinesGeometry extends THREE.BufferGeometry {
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
  }

  setColor(segmentIdx, colorVal) {
    tmpColor.set(colorVal);
    const first = segmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
    const second = first + COL_SIZE;
    setArrayXYZ(this._colors, first, tmpColor.r, tmpColor.g, tmpColor.b);
    setArrayXYZ(this._colors, second, tmpColor.r, tmpColor.g, tmpColor.b);
  }

  setSegment(segmentIdx, pos1, pos2) {
    const first = segmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
    const second = first + POS_SIZE;
    setArrayXYZ(this._positions, first, pos1.x, pos1.y, pos1.z);
    setArrayXYZ(this._positions, second, pos2.x, pos2.y, pos2.z);
  }

  setOpacity(startSegIdx, endSegIdx, value) {
    const start = startSegIdx * VERTEX_PER_SEGMENT;
    const end = endSegIdx * VERTEX_PER_SEGMENT;
    _.fill(this.alpha, value, end, start);
    this.getAttribute('alphaColor').needsUpdate = true;
  }

  getSubsetSegments(startSegmentIdx, segmentsCount) {
    return getSubset(this._positions, startSegmentIdx, segmentsCount, POS_SIZE);
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
    const start = startSegmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
    this._positions.set(positions, start);
  }

  setColors(startSegmentIdx, colors) {
    const start = startSegmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
    this._colors.set(colors, start);
  }

  _initVertices(segmentsCount) {
    this._buffersSize = segmentsCount * VERTEX_PER_SEGMENT;
    const pointsCount = this._buffersSize;
    this._positions = utils.allocateTyped(Float32Array, pointsCount * POS_SIZE);
    this._colors = utils.allocateTyped(Float32Array, pointsCount * COL_SIZE);
    const alpha = this._alpha = utils.allocateTyped(Float32Array, pointsCount);
    _.fill(alpha, 1.0);
    this.setAttribute('position', new THREE.BufferAttribute(this._positions, POS_SIZE));
    this.setAttribute('color', new THREE.BufferAttribute(this._colors, COL_SIZE));
    this.setAttribute('alphaColor', new THREE.BufferAttribute(alpha, 1));
  }
}

export default ThinLinesGeometry;
