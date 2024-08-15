import * as THREE from 'three';
import { Smooth } from '../../../../vendor/js/Smooth';
import gfxutils from '../../gfxutils';
import chem from '../../../chem';

const { ResidueType } = chem;

const calcMatrix = gfxutils.calcChunkMatrix;

function _buildStructureInterpolator(points, tension) {
  const path = Smooth(points, {
    method: Smooth.METHOD_CUBIC,
    clip: Smooth.CLIP_CLAMP,
    cubicTension: tension,
    scaleTo: 1,
  });

  return function (t, argTrans) {
    let transformT = argTrans;
    if (transformT === null) {
      // map our range to the [second .. last but one]
      transformT = function (tt) {
        return (tt * ((points.length - 1) - 2) + 1) / (points.length - 1);
      };
    }
    const newt = transformT(t);
    const ans = path(newt);
    return new THREE.Vector3(ans[0], ans[1], ans[2]);
  };
}

function _addPoints(centerPoints, topPoints, idx, residue) {
  if (!residue._isValid) {
    centerPoints[idx] = centerPoints[idx - 1];
    topPoints[idx] = topPoints[idx - 1];
    return;
  }
  const cp = residue._controlPoint;
  centerPoints[idx] = [cp.x, cp.y, cp.z];
  const tp = cp.clone().add(residue._wingVector);
  topPoints[idx] = [tp.x, tp.y, tp.z];
}

function _addPointsForLoneResidue(centerPoints, topPoints, idx, residue) {
  const nucleic = (residue._type.flags & ResidueType.Flags.NUCLEIC) !== 0;
  const nameFrom = nucleic ? 'C5\'' : 'N';
  const nameTo = nucleic ? 'C3\'' : 'C';

  let posFrom;
  let posTo;
  residue.forEachAtom((atom) => {
    const name = atom.getVisualName();
    if (!posFrom && name === nameFrom) {
      posFrom = atom.position;
    } else if (!posTo && name === nameTo) {
      posTo = atom.position;
    }
  });

  // provide a fallback for unknown residues
  if (!(posFrom && posTo)) {
    posFrom = residue._firstAtom.position;
    posTo = residue._lastAtom.position;
  }

  if (posFrom && posTo) {
    const shift = posTo.clone().sub(posFrom);

    const wing = residue._wingVector;
    const cp = residue._controlPoint;
    const tp = cp.clone().add(wing);

    const cpPrev = cp.clone().sub(shift);
    const tpPrev = cpPrev.clone().add(wing);
    centerPoints[idx] = [cpPrev.x, cpPrev.y, cpPrev.z];
    topPoints[idx] = [tpPrev.x, tpPrev.y, tpPrev.z];
    ++idx;
    centerPoints[idx] = [cpPrev.x, cpPrev.y, cpPrev.z];
    topPoints[idx] = [tpPrev.x, tpPrev.y, tpPrev.z];
    ++idx;

    centerPoints[idx] = [cp.x, cp.y, cp.z];
    topPoints[idx] = [tp.x, tp.y, tp.z];
    ++idx;

    const cpNext = cp.clone().add(shift);
    const tpNext = cpNext.clone().add(wing);
    centerPoints[idx] = [cpNext.x, cpNext.y, cpNext.z];
    topPoints[idx] = [tpNext.x, tpNext.y, tpNext.z];
    ++idx;
    centerPoints[idx] = [cpNext.x, cpNext.y, cpNext.z];
    topPoints[idx] = [tpNext.x, tpNext.y, tpNext.z];
  }
}

function _calcPoints(residues, firstIdx, lastIdx, boundaries) {
  const left = boundaries.start;
  const right = boundaries.end;
  function _prevIdx(idx) {
    return idx > left && residues[idx - 1]._isValid ? idx - 1 : idx;
  }
  function _nextIdx(idx) {
    return idx < right && residues[idx + 1]._isValid ? idx + 1 : idx;
  }

  const topPoints = [];
  const centerPoints = [];
  let arrIdx = 0;
  function _extrapolate2(currIdx, otherIdx) {
    const cp = residues[currIdx]._controlPoint.clone().lerp(residues[otherIdx]._controlPoint, -0.25);
    const tp = cp.clone().add(residues[currIdx]._wingVector);
    centerPoints[arrIdx] = [cp.x, cp.y, cp.z];
    topPoints[arrIdx++] = [tp.x, tp.y, tp.z];
    centerPoints[arrIdx] = [cp.x, cp.y, cp.z];
    topPoints[arrIdx++] = [tp.x, tp.y, tp.z];
  }

  // a single disconnected residue
  const prevIdx = _prevIdx(firstIdx);
  const nextIdx = _nextIdx(lastIdx);
  if (prevIdx === nextIdx) {
    _addPointsForLoneResidue(centerPoints, topPoints, arrIdx, residues[firstIdx]);
    return { centerPoints, topPoints };
  }

  // Two points (prev-prev and next-next) are added to support edge conditions for cubic splines, they are ignored
  // Another two (prev and next) were added to support the outside of the sub chain

  // prev and prev-prev
  if (firstIdx === prevIdx) {
    // do the extrapolation
    _extrapolate2(firstIdx, _nextIdx(firstIdx));
  } else {
    _addPoints(centerPoints, topPoints, arrIdx++, residues[_prevIdx(prevIdx)]);
    _addPoints(centerPoints, topPoints, arrIdx++, residues[prevIdx]);
  }

  // main loop
  for (let idx = firstIdx; idx <= lastIdx; ++idx) {
    _addPoints(centerPoints, topPoints, arrIdx++, residues[idx]);
  }

  // next and next-next
  if (nextIdx === _nextIdx(nextIdx)) {
    // do the extrapolation
    _extrapolate2(lastIdx, _prevIdx(lastIdx));
  } else {
    _addPoints(centerPoints, topPoints, arrIdx++, residues[nextIdx]);
    _addPoints(centerPoints, topPoints, arrIdx, residues[_nextIdx(nextIdx)]);
  }
  return { centerPoints, topPoints };
}

class CartoonHelper {
  constructor(residues, startIdx, endIdx, segmentsCount, tension, boundaries) {
    const pointsArrays = _calcPoints(residues, startIdx, endIdx, boundaries);
    this._topInterp = _buildStructureInterpolator(pointsArrays.topPoints, tension);
    this._centerInterp = _buildStructureInterpolator(pointsArrays.centerPoints, tension);

    this._shift = 0.5 / (endIdx - startIdx + 2);
    this._valueStep = (1.0 - 2 * this._shift) / (2 * (endIdx - startIdx + 1) * (segmentsCount - 1));
    this._segmentsCount = segmentsCount;
  }

  prepareMatrices(idx, firstRad, secondRad) {
    const mtcCount = this._segmentsCount;
    const outMtc = new Array(mtcCount);
    const currRad = new THREE.Vector2(0, 0);

    const topInterp = this._topInterp;
    const cenInterp = this._centerInterp;

    let currentValue = this._shift + this._valueStep * (mtcCount - 1) * idx;

    for (let mtxIdx = 0; mtxIdx < mtcCount; ++mtxIdx) {
      const lerpVal = Math.min(1.0, mtxIdx / (mtcCount - 1));
      currRad.lerpVectors(firstRad, secondRad, lerpVal);

      const currTop = topInterp(currentValue, null);
      const currCenter = cenInterp(currentValue, null);
      currentValue += this._valueStep;
      const nextCenter = cenInterp(currentValue, null);

      outMtc[mtxIdx] = calcMatrix(currCenter.clone(), nextCenter.clone(), currTop.clone().sub(currCenter), currRad);
    }

    return outMtc;
  }
}

export default CartoonHelper;
