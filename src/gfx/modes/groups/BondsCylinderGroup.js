

import * as THREE from 'three';
import BondsGroup from './BondsGroup';

function BondsCylinderGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  BondsGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

BondsCylinderGroup.prototype = Object.create(BondsGroup.prototype);
BondsCylinderGroup.prototype.constructor = BondsCylinderGroup;

BondsCylinderGroup.prototype._build = function() {
  var bondsIdc  = this._selection.chunks;
  var bonds = this._selection.bonds;
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  var drawMultiple = mode.drawMultiorderBonds();
  var showAromatic = mode.showAromaticLoops();

  var stickRad = mode.calcStickRadius();
  var emptyOffset = mode.calcSpaceFraction();
  var normDir;
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
    normDir = bond.calcNormalDir();
    var order = this.getBondOrder(bond, drawMultiple, showAromatic);
    var minRad = Math.min(mode.calcAtomRadius(atom1), mode.calcAtomRadius(atom2));
    var dist = 2 * minRad / order;
    var currStickRad = drawMultiple ? Math.min(stickRad, dist * 0.5 * (1.0 - emptyOffset)) : stickRad;

    for (var j = 0; j < order; ++j) {
      var scale = dist * (order % 2 === 0 ?
        (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2)) :
        (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
      chunksToIdx[currBondIdx] = bond._index;
      leftPos.copy(a1Pos);
      leftPos.addScaledVector(normDir, scale);
      rightPos.copy(a2Pos);
      rightPos.addScaledVector(normDir, scale);
      geo.setItem(currBondIdx, leftPos, rightPos, currStickRad);
      geo.setColor(currBondIdx++, colorer.getAtomColor(atom1, parent), colorer.getAtomColor(atom2, parent));
    }
  }

  geo.finalize();
  this._chunksIdc = chunksToIdx;
};


BondsCylinderGroup.prototype.updateToFrame = function(frameData) {
  var bondsIdc  = this._selection.chunks;
  var bonds = this._selection.bonds;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  var drawMultiple = mode.drawMultiorderBonds();
  var showAromatic = mode.showAromaticLoops();

  var stickRad = mode.calcStickRadius();
  var emptyOffset = mode.calcSpaceFraction();
  var normDir;
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
    normDir = bond.calcNormalDir();
    var order = this.getBondOrder(bond, drawMultiple, showAromatic);
    var minRad = Math.min(mode.calcAtomRadius(atom1), mode.calcAtomRadius(atom2));
    var dist = 2 * minRad / order;
    var currStickRad = drawMultiple ? Math.min(stickRad, dist * 0.5 * (1.0 - emptyOffset)) : stickRad;

    for (var j = 0; j < order; ++j) {
      var scale = dist * (order % 2 === 0 ?
        (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2)) :
        (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
      leftPos.copy(a1Pos);
      leftPos.addScaledVector(normDir, scale);
      rightPos.copy(a2Pos);
      rightPos.addScaledVector(normDir, scale);
      geo.setItem(currBondIdx, leftPos, rightPos, currStickRad);
      if (updateColor) {
        geo.setColor(currBondIdx, frameData.getAtomColor(colorer, atom1), frameData.getAtomColor(colorer, atom2));
      }
      currBondIdx++;
    }
  }

  geo.finalize();
};

export default BondsCylinderGroup;

