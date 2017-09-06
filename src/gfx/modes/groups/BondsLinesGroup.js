

import * as THREE from 'three';
import BondsGroup from './BondsGroup';

var STEP_SIZE = 0.15;

function BondsLinesGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  BondsGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

BondsLinesGroup.prototype = Object.create(BondsGroup.prototype);
BondsLinesGroup.prototype.constructor = BondsLinesGroup;

BondsLinesGroup.prototype._build = function() {
  var bondsIdc  = this._selection.chunks;
  var bonds = this._selection.bonds;
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  var drawMultiple = mode.drawMultiorderBonds();
  var showAromatic = mode.showAromaticLoops();

  var bondDir = new THREE.Vector3();

  var leftPos = new THREE.Vector3();
  var rightPos = new THREE.Vector3();
  var currBondIdx = 0;
  var chunksToIdx = [];
  for (var i = 0, n = bondsIdc.length; i < n; ++i) {
    var bond = bonds[bondsIdc[i]];
    var atom1 = bond._left;
    var atom2 = bond._right;
    var a1Pos = atom1._position;
    var a2Pos = atom2._position;
    var a1Hangs = atom1._bonds.length === 1;
    var a2Hangs = atom2._bonds.length === 1;
    bondDir.subVectors(a2Pos, a1Pos);
    var len = bondDir.length();
    var normDir = bond.calcNormalDir();

    var order = this.getBondOrder(bond, drawMultiple, showAromatic);

    for (var j = 0; j < order; ++j) {
      leftPos.copy(a1Pos);
      rightPos.copy(a2Pos);
      var scale = (order % 2 === 0 ?
        (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2)) :
        (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
      chunksToIdx[currBondIdx] = bond._index;
      if (order === 2 && (!a1Hangs && !a2Hangs)) {
        scale -= 0.5;
        scale *= -1;
      }

      if (!a1Hangs && !a2Hangs && order > 1 && scale !== 0) {
        leftPos.lerpVectors(a1Pos, a2Pos, STEP_SIZE / (len));
        rightPos.lerpVectors(a1Pos, a2Pos, 1.0 - STEP_SIZE / (len));
      }

      scale *= STEP_SIZE;

      leftPos.addScaledVector(normDir, scale);
      rightPos.addScaledVector(normDir, scale);
      geo.setItem(currBondIdx, leftPos, rightPos);
      geo.setColor(currBondIdx++, colorer.getAtomColor(atom1, parent), colorer.getAtomColor(atom2, parent));
    }
  }
  geo.finalize();
  this._chunksIdc = chunksToIdx;
};

BondsLinesGroup.prototype.updateToFrame = function(frameData) {
  // TODO This method looks like a copy paste. However, it
  // was decided to postpone animation refactoring until GFX is fixed.
  var bondsIdc  = this._selection.chunks;
  var bonds = this._selection.bonds;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  var drawMultiple = mode.drawMultiorderBonds();
  var showAromatic = mode.showAromaticLoops();

  var bondDir = new THREE.Vector3();

  var leftPos = new THREE.Vector3();
  var rightPos = new THREE.Vector3();
  var currBondIdx = 0;
  var updateColor = frameData.needsColorUpdate(colorer);
  for (var i = 0, n = bondsIdc.length; i < n; ++i) {
    var bond = bonds[bondsIdc[i]];
    var atom1 = bond._left;
    var atom2 = bond._right;
    var a1Pos = frameData.getAtomPos(atom1._index).clone();
    var a2Pos = frameData.getAtomPos(atom2._index);
    var a1Hangs = atom1._bonds.length === 1;
    var a2Hangs = atom2._bonds.length === 1;
    bondDir.subVectors(a2Pos, a1Pos);
    var len = bondDir.length();
    var normDir = bond.calcNormalDir();

    var order = this.getBondOrder(bond, drawMultiple, showAromatic);

    for (var j = 0; j < order; ++j) {
      leftPos.copy(a1Pos);
      rightPos.copy(a2Pos);
      var scale = (order % 2 === 0 ?
        (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2)) :
        (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
      if (order === 2 && (!a1Hangs && !a2Hangs)) {
        scale -= 0.5;
        scale *= -1;
      }

      if (!a1Hangs && !a2Hangs && order > 1 && scale !== 0) {
        leftPos.lerpVectors(a1Pos, a2Pos, STEP_SIZE / (len));
        rightPos.lerpVectors(a1Pos, a2Pos, 1.0 - STEP_SIZE / (len));
      }

      scale *= STEP_SIZE;

      leftPos.addScaledVector(normDir, scale);
      rightPos.addScaledVector(normDir, scale);
      geo.setItem(currBondIdx, leftPos, rightPos);
      if (updateColor) {
        geo.setColor(currBondIdx, frameData.getAtomColor(colorer, atom1), frameData.getAtomColor(colorer, atom2));
      }
      currBondIdx++;
    }
  }
  geo.finalize();
};

export default BondsLinesGroup;

