

import * as THREE from 'three';
import AtomsGroup from './AtomsGroup';

function _slerp(omega, v1, v2, t) {
  var oSin = Math.sin(omega);
  return v1.clone().multiplyScalar(Math.sin((1 - t) * omega) / oSin).addScaledVector(v2, Math.sin(t * omega) / oSin);
}

function AromaticGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  AtomsGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

AromaticGroup.prototype = Object.create(AtomsGroup.prototype);
AromaticGroup.prototype.constructor = AromaticGroup;

AromaticGroup.prototype._buildInner = function(radOffset, addChunk) {
  var chunksToIdx = this._selection.chunks;

  var prevVector = new THREE.Vector3();
  var currVector = new THREE.Vector3();
  var segmentsHeight = this._segmentsHeight;
  var leprStep = 1.0 / segmentsHeight;
  var colorer = this._colorer;

  var cycles  = this._selection.cycles;
  var parent = this._selection.parent;
  var chunkIdx = 0;
  var currAtomIdx = chunksToIdx[chunkIdx];

  for (var cIdx = 0, cCount = cycles.length; cIdx < cCount; ++cIdx) {
    var cycle = cycles[cIdx];
    var cycAtoms = cycle.atoms;
    var chunkPoints = [];
    var tmpDir = [];
    var center = cycle.center;
    var cycleRad = cycle.radius - radOffset;
    var n = cycAtoms.length;
    var i = 0;
    var prevPos = cycAtoms[n - 1]._position;
    var currPos = cycAtoms[i]._position;
    prevVector.subVectors(prevPos, center);
    currVector.subVectors(currPos, center);
    var upDir = currVector.clone().cross(prevVector).normalize();

    for (; i < n; ++i) {
      var omega = prevVector.angleTo(currVector);
      tmpDir[i] = _slerp(omega, prevVector, currVector, 0.5).normalize();
      currPos = cycAtoms[(i + 1) % n]._position;
      prevVector.copy(currVector);
      currVector.subVectors(currPos, center);
    }

    for (i = 0; i < n; ++i) {
      if (cycAtoms[i]._index !== currAtomIdx) {
        continue;
      }
      var start = tmpDir[i];
      var end = tmpDir[(i + 1) % n];
      var color = colorer.getAtomColor(cycAtoms[i], parent);
      var currAngle = start.angleTo(end);

      for (var j = 0; j <= segmentsHeight; ++j) {
        chunkPoints[j] = _slerp(currAngle, start, end, j * leprStep).multiplyScalar(cycleRad).add(center);
      }

      addChunk(chunkIdx++, color, chunkPoints, center, upDir);
      currAtomIdx = chunksToIdx[chunkIdx];
    }
  }

};

export default AromaticGroup;

