

import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';

const VERTEX_PER_SEGMENT = 2;
const POS_SIZE = 3;
const COL_SIZE = 3;
const tmpColor = new THREE.Color();

// TODO move to utils
function setArrayXYZ(arr, idx, x, y, z) {
  arr[idx]     = x;
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
function ThinLinesGeometry(segmentsCount) {
  THREE.BufferGeometry.call(this);
  this._initVertices(segmentsCount);
}

ThinLinesGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
ThinLinesGeometry.prototype.constructor = ThinLinesGeometry;

ThinLinesGeometry.prototype.startUpdate = function() {
  return true;
};

ThinLinesGeometry.prototype.finishUpdate = function() {
  this.getAttribute('position').needsUpdate = true;
  this.getAttribute('color').needsUpdate = true;
  this.getAttribute('alphaColor').needsUpdate = true;
};

ThinLinesGeometry.prototype.setColor = function(segmentIdx, colorVal) {
  tmpColor.set(colorVal);
  const first = segmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
  const second = first + COL_SIZE;
  setArrayXYZ(this._colors, first, tmpColor.r, tmpColor.g, tmpColor.b);
  setArrayXYZ(this._colors, second, tmpColor.r, tmpColor.g, tmpColor.b);
};

ThinLinesGeometry.prototype.setSegment = function(segmentIdx, pos1, pos2) {
  const first = segmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
  const second = first + POS_SIZE;
  setArrayXYZ(this._positions, first, pos1.x, pos1.y, pos1.z);
  setArrayXYZ(this._positions, second, pos2.x, pos2.y, pos2.z);
};

ThinLinesGeometry.prototype.setOpacity = function(startSegIdx, endSegIdx, value) {
  const start = startSegIdx * VERTEX_PER_SEGMENT;
  const end = endSegIdx * VERTEX_PER_SEGMENT;
  _.fill(this.alpha, value, end, start);
  this.getAttribute('alphaColor').needsUpdate = true;
};

ThinLinesGeometry.prototype.getSubsetSegments = function(startSegmentIdx, segmentsCount) {
  return getSubset(this._positions, startSegmentIdx, segmentsCount, POS_SIZE);
};

ThinLinesGeometry.prototype.getSubsetColors = function(startSegmentIdx, segmentsCount) {
  return getSubset(this._colors, startSegmentIdx, segmentsCount, COL_SIZE);
};

ThinLinesGeometry.prototype.getSubsetOpacities = function(startSegmentIdx, segmentsCount) {
  return getSubset(this._alpha, startSegmentIdx, segmentsCount, 1);
};

ThinLinesGeometry.prototype.getNumVertexPerSegment = function() {
  return VERTEX_PER_SEGMENT;
};

ThinLinesGeometry.prototype.getPositionSize = function() {
  return POS_SIZE;
};

ThinLinesGeometry.prototype.setSegments = function(startSegmentIdx, positions) {
  const start = startSegmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
  this._positions.set(positions, start);
};

ThinLinesGeometry.prototype.setColors = function(startSegmentIdx, colors) {
  const start = startSegmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
  this._colors.set(colors, start);
};

ThinLinesGeometry.prototype._initVertices = function(segmentsCount) {
  this._buffersSize = segmentsCount * VERTEX_PER_SEGMENT;
  const pointsCount = this._buffersSize;
  this._positions = utils.allocateTyped(Float32Array, pointsCount * POS_SIZE);
  this._colors = utils.allocateTyped(Float32Array, pointsCount * COL_SIZE);
  const alpha = this._alpha = utils.allocateTyped(Float32Array, pointsCount);
  _.fill(alpha, 1.0);
  this.addAttribute('position', new THREE.BufferAttribute(this._positions, POS_SIZE));
  this.addAttribute('color', new THREE.BufferAttribute(this._colors, COL_SIZE));
  this.addAttribute('alphaColor', new THREE.BufferAttribute(alpha, 1));
};

export default ThinLinesGeometry;

