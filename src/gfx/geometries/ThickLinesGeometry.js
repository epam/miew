

import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';

var MAX_IDC_16BIT = 65535;
var VERTEX_PER_SEGMENT = 4;
var POS_SIZE = 4;
var DIR_SIZE = 3;
var COL_SIZE = 3;
var tmpColor = new THREE.Color();
var direction = new THREE.Vector3();

function setArrayXYZ(arr, idx, x, y, z) {
  arr[idx]     = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
}

function setArrayXYZW(arr, idx, x, y, z, w) {
  arr[idx]     = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
  arr[idx + 3] = w;
}

function getSubset(arr, startSegmentIdx, segmentsCount, elemSize) {
  var start = startSegmentIdx * VERTEX_PER_SEGMENT;
  var end = start + segmentsCount * VERTEX_PER_SEGMENT;
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
function ThickLinesGeometry(segmentsCount) {
  THREE.BufferGeometry.call(this);
  this._initVertices(segmentsCount);
}

ThickLinesGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
ThickLinesGeometry.prototype.constructor = ThickLinesGeometry;

ThickLinesGeometry.prototype.startUpdate = function() {
  return true;
};

ThickLinesGeometry.prototype.finishUpdate = function() {
  this.getAttribute('position').needsUpdate = true;
  this.getAttribute('color').needsUpdate = true;
  this.getAttribute('alphaColor').needsUpdate = true;
  this.getAttribute('direction').needsUpdate = true;
};

ThickLinesGeometry.prototype.setColor = function(segmentIdx, colorVal) {
  tmpColor.set(colorVal);
  var idx = segmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
  setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
  idx += COL_SIZE;
  setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
  idx += COL_SIZE;
  setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
  idx += COL_SIZE;
  setArrayXYZ(this._colors, idx, tmpColor.r, tmpColor.g, tmpColor.b);
};

ThickLinesGeometry.prototype.setSegment = function(segmentIdx, pos1, pos2) {
  direction.subVectors(pos1, pos2);
  direction.normalize();
  var positions = this._positions;
  var directions = this._directions;
  var idx = segmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
  var dirIdx = segmentIdx * VERTEX_PER_SEGMENT * DIR_SIZE;
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

};

ThickLinesGeometry.prototype.setOpacity = function(startSegIdx, endSegIdx, value) {
  var start = startSegIdx * VERTEX_PER_SEGMENT;
  var end = endSegIdx * VERTEX_PER_SEGMENT;
  _.fill(this.alpha, value, end, start);
  this.getAttribute('alphaColor').needsUpdate = true;
};

ThickLinesGeometry.prototype.getSubsetSegments = function(startSegmentIdx, segmentsCount) {
  return [
    getSubset(this._positions, startSegmentIdx, segmentsCount, POS_SIZE),
    getSubset(this._directions, startSegmentIdx, segmentsCount, DIR_SIZE)
  ];
};

ThickLinesGeometry.prototype.getSubsetColors = function(startSegmentIdx, segmentsCount) {
  return getSubset(this._colors, startSegmentIdx, segmentsCount, COL_SIZE);
};

ThickLinesGeometry.prototype.getSubsetOpacities = function(startSegmentIdx, segmentsCount) {
  return getSubset(this._alpha, startSegmentIdx, segmentsCount, 1);
};

ThickLinesGeometry.prototype.getNumVertexPerSegment = function() {
  return VERTEX_PER_SEGMENT;
};

ThickLinesGeometry.prototype.getPositionSize = function() {
  return POS_SIZE;
};

ThickLinesGeometry.prototype.setSegments = function(startSegmentIdx, positions) {
  var startPos = startSegmentIdx * VERTEX_PER_SEGMENT * POS_SIZE;
  if (positions instanceof Array && positions.length === 2) {
    this._positions.set(positions[0], startPos);
    var startDir = startSegmentIdx * VERTEX_PER_SEGMENT * DIR_SIZE;
    this._directions.set(positions[1], startDir); // dirs are geo part of vertex
  } else {
    this._positions.set(positions, startPos);
  }
};

ThickLinesGeometry.prototype.setColors = function(startSegmentIdx, colors) {
  var start = startSegmentIdx * VERTEX_PER_SEGMENT * COL_SIZE;
  this._colors.set(colors, start);
};

ThickLinesGeometry.prototype._initVertices = function(segmentsCount) {
  this._buffersSize = segmentsCount * VERTEX_PER_SEGMENT;
  var pointsCount = this._buffersSize;
  var use32bitIndex = pointsCount > MAX_IDC_16BIT;
  this._index = utils.allocateTyped(use32bitIndex ? Uint32Array : Uint16Array, segmentsCount * 6);
  this._positions = utils.allocateTyped(Float32Array, pointsCount * POS_SIZE);
  this._colors = utils.allocateTyped(Float32Array, pointsCount * COL_SIZE);
  this._directions = utils.allocateTyped(Float32Array, pointsCount * DIR_SIZE);
  var alpha = this._alpha = utils.allocateTyped(Float32Array, pointsCount);
  _.fill(alpha, 1.0);

  var index = this._index;
  var indexOffset = 0;
  var pointOffset = 0;
  for (var j = 0; j < segmentsCount; j++, indexOffset += 6, pointOffset += VERTEX_PER_SEGMENT) {
    index[indexOffset] = pointOffset;
    index[indexOffset + 1] = pointOffset + 1;
    index[indexOffset + 2] = pointOffset + 3;
    index[indexOffset + 3] = pointOffset;
    index[indexOffset + 4] = pointOffset + 2;
    index[indexOffset + 5] = pointOffset + 3;
  }
  this.setIndex(new THREE.BufferAttribute(this._index, 1));

  this.addAttribute('position', new THREE.BufferAttribute(this._positions, POS_SIZE));
  this.addAttribute('color', new THREE.BufferAttribute(this._colors, COL_SIZE));
  this.addAttribute('alphaColor', new THREE.BufferAttribute(alpha, 1));
  this.addAttribute('direction', new THREE.BufferAttribute(this._directions, DIR_SIZE));
};

export default ThickLinesGeometry;

