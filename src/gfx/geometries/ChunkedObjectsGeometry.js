

import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import RaycastableBufferGeometry from './RaycastableBufferGeometry';

var MAX_IDC_16BIT = 65535;
var VEC_SIZE = 3;
var tmpColor = new THREE.Color();

/**
 * This class represents geometry which consists of separate chunks.
 * Each chunk has same index and similar geometry with equal points and faces count.
 * Each chunk has by default only one color.
 * @constructor
 */
function ChunkedObjectsGeometry(chunkGeo, chunksCount) {
  RaycastableBufferGeometry.call(this);

  if (this.constructor === ChunkedObjectsGeometry) {
    throw new Error('Can not instantiate abstract class!');
  }

  this._chunkGeo = chunkGeo;

  this._init(chunkGeo, chunksCount);
}

ChunkedObjectsGeometry.prototype = Object.create(RaycastableBufferGeometry.prototype);
ChunkedObjectsGeometry.prototype.constructor = ChunkedObjectsGeometry;

ChunkedObjectsGeometry.prototype.startUpdate = function() {
  return true;
};

ChunkedObjectsGeometry.prototype.finishUpdate = function() {
  this.getAttribute('position').needsUpdate = true;
  this.getAttribute('normal').needsUpdate = true;
  this.getAttribute('color').needsUpdate = true;
};

ChunkedObjectsGeometry.prototype.setColor = function(chunkIdx, colorVal) {
  tmpColor.set(colorVal);
  var colors = this._colors;
  var chunkSize = this._chunkSize;
  for (var i = chunkIdx * chunkSize, end = i + chunkSize; i < end; ++i) {
    var idx = i * VEC_SIZE;
    colors[idx] = tmpColor.r;
    colors[idx + 1] = tmpColor.g;
    colors[idx + 2] = tmpColor.b;
  }
};

ChunkedObjectsGeometry.prototype.finalize = function() {
  this.finishUpdate();
  // TODO compute bounding box?
  this.computeBoundingSphere();
};

ChunkedObjectsGeometry.prototype.setOpacity = function(chunkIndices, value) {
  var alphaArr = this._alpha;
  var chunkSize = this._chunkSize;
  for (var i = 0, n = chunkIndices.length; i < n; ++i) {
    var left = chunkIndices[i] * chunkSize;
    _.fill(alphaArr, value, left, left + chunkSize);
  }
  this.getAttribute('alphaColor').needsUpdate = true;
};

ChunkedObjectsGeometry.prototype.raycast = function(raycaster, intersects) {
  var inters = [];
  RaycastableBufferGeometry.prototype.raycast.call(this, raycaster, inters);
  // TODO faceIdx to chunkIdx
  var facesPerChunk = this._chunkGeo.index.count / 3;
  for (var i = 0, n = inters.length; i < n; ++i) {
    if (!inters[i].hasOwnProperty('faceIndex')) {
      continue;
    }
    inters[i].chunkIdx = Math.floor(inters[i].faceIndex / facesPerChunk);
    intersects.push(inters[i]);
  }
};

ChunkedObjectsGeometry.prototype.getSubset = function(chunkIndices) {
  var instanceCount = chunkIndices.length;
  var geom = new THREE.BufferGeometry();
  this._init.call(geom, this._chunkGeo, instanceCount);

  var srcPos = this._positions;
  var srcNorm = this._normals;
  var srcColor = this._colors;

  var dstPos = geom._positions;
  var dstNorm = geom._normals;
  var dstColor = geom._colors;

  var chunkSize = this._chunkSize * VEC_SIZE;

  for (var i = 0, n = chunkIndices.length; i < n; ++i) {
    var dstPtOffset = i * chunkSize;
    var ptIdxBegin = chunkIndices[i] * chunkSize;
    var ptIdxEnd = ptIdxBegin + chunkSize;
    dstPos.set(srcPos.subarray(ptIdxBegin, ptIdxEnd), dstPtOffset);
    dstNorm.set(srcNorm.subarray(ptIdxBegin, ptIdxEnd), dstPtOffset);
    dstColor.set(srcColor.subarray(ptIdxBegin, ptIdxEnd), dstPtOffset);
  }

  geom.boundingSphere = this.boundingSphere;
  geom.boundingBox = this.boundingBox;
  return [geom];
};

ChunkedObjectsGeometry.prototype._init = function(chunkGeo, chunksCount) {
  var chunkSize = this._chunkSize = chunkGeo.attributes.position.count;
  var chunkIndex = chunkGeo.index.array;
  var chunkIndexSize = chunkIndex.length;
  var pointsCount = this._chunkSize * chunksCount;
  var use32bitIndex = pointsCount > MAX_IDC_16BIT;
  var indexSize = chunkIndexSize * chunksCount;
  var index = this._index = utils.allocateTyped(use32bitIndex ? Uint32Array : Uint16Array, indexSize);
  this._positions = utils.allocateTyped(Float32Array, pointsCount * VEC_SIZE);
  this._normals = utils.allocateTyped(Float32Array, pointsCount * VEC_SIZE);
  this._colors = utils.allocateTyped(Float32Array, pointsCount * VEC_SIZE);
  var alpha = this._alpha = utils.allocateTyped(Float32Array, pointsCount);
  _.fill(alpha, 1.0);

  for (var i = 0; i < chunksCount; ++i) {
    var offset = i * chunkIndexSize;
    var posOffset = i * chunkSize;
    index.set(chunkIndex, offset);
    for (var j = 0; j < chunkIndexSize; ++j) {
      index[offset + j] += posOffset;
    }
  }

  this.setIndex(new THREE.BufferAttribute(this._index, 1));
  this.addAttribute('position', new THREE.BufferAttribute(this._positions, VEC_SIZE));
  this.addAttribute('normal', new THREE.BufferAttribute(this._normals, VEC_SIZE));
  this.addAttribute('color', new THREE.BufferAttribute(this._colors, VEC_SIZE));
  this.addAttribute('alphaColor', new THREE.BufferAttribute(alpha, 1));
};

export default ChunkedObjectsGeometry;

