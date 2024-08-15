import * as THREE from 'three';
import AtomsGroup from './AtomsGroup';

function _slerp(omega, v1, v2, t) {
  const oSin = Math.sin(omega);
  return v1.clone().multiplyScalar(Math.sin((1 - t) * omega) / oSin).addScaledVector(v2, Math.sin(t * omega) / oSin);
}

class AromaticGroup extends AtomsGroup {
  _buildInner(radOffset, addChunk) {
    const chunksToIdx = this._selection.chunks;

    const prevVector = new THREE.Vector3();
    const currVector = new THREE.Vector3();
    const segmentsHeight = this._segmentsHeight;
    const leprStep = 1.0 / segmentsHeight;
    const colorer = this._colorer;

    const { cycles, parent } = this._selection;
    let chunkIdx = 0;
    let currAtomIdx = chunksToIdx[chunkIdx];

    for (let cIdx = 0, cCount = cycles.length; cIdx < cCount; ++cIdx) {
      const cycle = cycles[cIdx];
      const cycAtoms = cycle.atoms;
      const chunkPoints = [];
      const tmpDir = [];
      const { center } = cycle;
      const cycleRad = cycle.radius - radOffset;
      const n = cycAtoms.length;
      let i = 0;
      const prevPos = cycAtoms[n - 1].position;
      let currPos = cycAtoms[i].position;
      prevVector.subVectors(prevPos, center);
      currVector.subVectors(currPos, center);
      const upDir = currVector.clone().cross(prevVector).normalize();

      for (; i < n; ++i) {
        const omega = prevVector.angleTo(currVector);
        tmpDir[i] = _slerp(omega, prevVector, currVector, 0.5).normalize();
        currPos = cycAtoms[(i + 1) % n].position;
        prevVector.copy(currVector);
        currVector.subVectors(currPos, center);
      }

      for (i = 0; i < n; ++i) {
        if (cycAtoms[i].index !== currAtomIdx) {
          continue;
        }
        const start = tmpDir[i];
        const end = tmpDir[(i + 1) % n];
        const color = colorer.getAtomColor(cycAtoms[i], parent);
        const currAngle = start.angleTo(end);

        for (let j = 0; j <= segmentsHeight; ++j) {
          chunkPoints[j] = _slerp(currAngle, start, end, j * leprStep).multiplyScalar(cycleRad).add(center);
        }

        addChunk(chunkIdx++, color, chunkPoints, center, upDir);
        currAtomIdx = chunksToIdx[chunkIdx];
      }
    }
  }
}

export default AromaticGroup;
