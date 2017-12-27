

import * as THREE from 'three';
import utils from '../../utils';
import ChunkedObjectsGeometry from './ChunkedObjectsGeometry';

var VEC_SIZE = 3;
var TRI_SIZE = 3;
var tmpPrev = new THREE.Vector3();
var tmpNext = new THREE.Vector3();

function _createExtrudedChunkGeometry(shape, ringsCount) {
  var geo = new THREE.BufferGeometry();
  var ptsCount = shape.length;
  var totalPts = ptsCount * ringsCount;
  var type = totalPts <= 65536 ? Uint16Array : Uint32Array;
  var facesPerChunk = (ringsCount - 1) * ptsCount * 2;
  var indices = new THREE.BufferAttribute(utils.allocateTyped(type, facesPerChunk * TRI_SIZE), 1);

  var currVtxIdx = 0;
  var currFaceIdx = 0;
  for (var y = 0; y < ringsCount; y++) {
    // faces
    if (y !== ringsCount - 1) {
      for (var i = 0; i < ptsCount; i++) {
        var v1 = currVtxIdx + i;
        var v2 = currVtxIdx + ptsCount + i;
        var v3 = currVtxIdx + ptsCount + (i + 1) % ptsCount;
        var v4 = currVtxIdx + (i + 1) % ptsCount;

        indices.setXYZ(currFaceIdx * TRI_SIZE, v1, v4, v2);
        currFaceIdx++;
        indices.setXYZ(currFaceIdx * TRI_SIZE, v2, v4, v3);
        currFaceIdx++;
      }
    }

    currVtxIdx += ptsCount;
  }

  geo.setIndex(indices);
  var pos = utils.allocateTyped(Float32Array, totalPts * VEC_SIZE);
  geo.addAttribute('position', new THREE.BufferAttribute(pos, VEC_SIZE));

  geo._positions = shape;

  return geo;
}

function ExtrudedObjectsGeometry(shape, ringsCount, chunksCount) {
  var chunkGeo = _createExtrudedChunkGeometry(shape, ringsCount);
  ChunkedObjectsGeometry.call(this, chunkGeo, chunksCount);
  this._ringsCount = ringsCount;

  var tmpShape = this._tmpShape = [];
  for (var i = 0; i < shape.length; ++i) {
    tmpShape[i] = new THREE.Vector3();
  }
}

ExtrudedObjectsGeometry.prototype = Object.create(ChunkedObjectsGeometry.prototype);
ExtrudedObjectsGeometry.prototype.constructor = ExtrudedObjectsGeometry;

ExtrudedObjectsGeometry.prototype.setItem = function(itemIdx, matrices) {
  var shape = this._chunkGeo._positions;
  var ptsCount = shape.length;
  var innerPtIdx = 0;
  var chunkStartIdx  = ptsCount * this._ringsCount * itemIdx * VEC_SIZE;

  var positions = this._positions;
  var normals = this._normals;

  var tmpShape = this._tmpShape;
  for (var i = 0, n = matrices.length; i < n; ++i) {
    var mtx = matrices[i];

    var j = 0;
    for (; j < ptsCount; ++j) {
      tmpShape[j].copy(shape[j]).applyMatrix4(mtx);
    }

    for (j = 0; j < ptsCount; ++j) {
      var point = tmpShape[j];
      var nextPt = tmpShape[(j + 1) % ptsCount];
      var prevPt = tmpShape[(j + ptsCount - 1) % ptsCount];

      var vtxIdx = chunkStartIdx + innerPtIdx;

      positions[vtxIdx] = point.x;
      positions[vtxIdx + 1] = point.y;
      positions[vtxIdx + 2] = point.z;

      tmpPrev.subVectors(point, prevPt).normalize();
      tmpNext.subVectors(point, nextPt).normalize();
      tmpPrev.add(tmpNext).normalize();

      normals[vtxIdx] = tmpPrev.x;
      normals[vtxIdx + 1] = tmpPrev.y;
      normals[vtxIdx + 2] = tmpPrev.z;
      innerPtIdx += VEC_SIZE;
    }
  }
};

export default ExtrudedObjectsGeometry;

