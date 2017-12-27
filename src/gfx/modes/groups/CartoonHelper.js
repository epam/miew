import * as THREE from 'three';
import {Smooth} from 'Smooth';
import gfxutils from '../../gfxutils';
import chem from '../../../chem';

const ResidueType = chem.ResidueType;

var calcMatrix = gfxutils.calcChunkMatrix;

function _buildStructureInterpolator(points, tension) {
  var path = Smooth(points, {
    method: Smooth.METHOD_CUBIC,
    clip: Smooth.CLIP_CLAMP,
    cubicTension: tension,
    scaleTo: 1
  });

  return function(t, argTrans) {
    var transformT = argTrans;
    if (transformT === null) {
      // map our range to the [second .. last but one]
      transformT = function(tt) {
        return (tt * ((points.length - 1) - 2) + 1) / (points.length - 1);
      };
    }
    var newt = transformT(t);
    var ans = path(newt);
    return new THREE.Vector3(ans[0], ans[1], ans[2]);
  };
}

function _addPoints(centerPoints, topPoints, idx, residue) {
  if (!residue._isValid) {
    centerPoints[idx] = centerPoints[idx - 1];
    topPoints[idx] = topPoints[idx - 1];
    return;
  }
  var cp = residue._controlPoint;
  centerPoints[idx] = [cp.x, cp.y, cp.z];
  var tp = cp.clone().add(residue._wingVector);
  topPoints[idx] = [tp.x, tp.y, tp.z];
}

function _addPointsForLoneResidue(centerPoints, topPoints, idx, residue) {
  const nucleic = (residue._type.flags & ResidueType.Flags.NUCLEIC) !== 0;
  const nameFrom = nucleic ? 'C5\'' : 'N';
  const nameTo = nucleic ? 'C3\'' : 'C';

  let posFrom, posTo;
  residue.forEachAtom((atom) => {
    const name = atom.getVisualName();
    if (!posFrom && name === nameFrom) {
      posFrom = atom._position;
    } else if (!posTo && name === nameTo) {
      posTo = atom._position;
    }
  });

  // provide a fallback for unknown residues
  if (!(posFrom && posTo)) {
    posFrom = residue._firstAtom._position;
    posTo = residue._lastAtom._position;
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
  var left = boundaries.start;
  var right = boundaries.end;
  function _prevIdx(idx) {
    return idx > left && residues[idx - 1]._isValid ? idx - 1 : idx;
  }
  function _nextIdx(idx) {
    return idx < right && residues[idx + 1]._isValid ? idx + 1 : idx;
  }

  var topPoints = []; // new Array(lastIdx - firstIdx + 5);
  var centerPoints = []; // new Array(lastIdx - firstIdx + 5);
  var arrIdx = 0;
  function _extrapolate2(currIdx, otherIdx) {
    var cp = residues[currIdx]._controlPoint.clone().lerp(residues[otherIdx]._controlPoint, -0.25);
    var tp = cp.clone().add(residues[currIdx]._wingVector);
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
    return {centerPoints : centerPoints, topPoints : topPoints};
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
  for (var idx = firstIdx; idx <= lastIdx; ++idx) {
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
  return {centerPoints : centerPoints, topPoints : topPoints};
}

function CartoonHelper(residues, startIdx, endIdx, segmentsCount, tension, boundaries) {
  var pointsArrays = _calcPoints(residues, startIdx, endIdx, boundaries);
  this._topInterp = _buildStructureInterpolator(pointsArrays.topPoints, tension);
  this._centerInterp = _buildStructureInterpolator(pointsArrays.centerPoints, tension);

  this._shift = 0.5 / (endIdx - startIdx + 2);
  this._valueStep = (1.0 - 2 * this._shift) / (2 * (endIdx - startIdx + 1) * (segmentsCount - 1));
  this._segmentsCount = segmentsCount;
}

CartoonHelper.prototype.prepareMatrices = function(idx, firstRad, secondRad) {
  var mtcCount = this._segmentsCount;
  var outMtc = new Array(mtcCount);
  var currRad  = new THREE.Vector2(0, 0);

  var topInterp = this._topInterp;
  var cenInterp = this._centerInterp;

  var currentValue = this._shift + this._valueStep * (mtcCount - 1) * idx;

  for (var mtxIdx = 0; mtxIdx < mtcCount; ++mtxIdx) {
    var lerpVal = Math.min(1.0, mtxIdx / (mtcCount - 1));
    currRad.lerpVectors(firstRad, secondRad, lerpVal);

    var currTop    = topInterp(currentValue, null);
    var currCenter = cenInterp(currentValue, null);
    currentValue += this._valueStep;
    var nextCenter = cenInterp(currentValue, null);

    outMtc[mtxIdx] = calcMatrix(currCenter.clone(), nextCenter.clone(), currTop.clone().sub(currCenter), currRad);
  }

  return outMtc;
};

export default CartoonHelper;

