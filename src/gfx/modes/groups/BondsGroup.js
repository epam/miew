

import ChemGroup from './ChemGroup';
import Bond from '../../../chem/Bond';

function getCylinderCount(bondOrder) {
  return bondOrder < 2 ? 1 : bondOrder;
}

function BondsGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  var drawMultiple = mode.drawMultiorderBonds();
  var showAromatic = mode.showAromaticLoops();
  var bondsIdc  = selection.chunks;
  var bonds = selection.bonds;
  var bondsCount = 1;
  for (var i = 0, n = bondsIdc.length; i < n; ++i) {
    bondsCount += this.getBondOrder(bonds[bondsIdc[i]], drawMultiple, showAromatic);
  }
  this._geoArgs = [bondsCount, polyComplexity];
  ChemGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

BondsGroup.prototype = Object.create(ChemGroup.prototype);
BondsGroup.prototype.constructor = BondsGroup;

BondsGroup.prototype.getBondOrder = function(bond, drawMultiple, showAromatic) {
  var bondOrder = 1;
  if (drawMultiple && (!showAromatic || bond._type !== Bond.BondType.AROMATIC)) {
    bondOrder = getCylinderCount(bond._order);
  }
  return bondOrder;
};

BondsGroup.prototype.raycast = function(raycaster, intersects) {
  var bonds = this._selection.bonds;
  var inters = [];
  this._mesh.raycast(raycaster, inters);
  var bondsIdc  = this._chunksIdc;
  // process inters array - arr object references
  for (var i = 0, n = inters.length; i < n; ++i) {
    if (!inters[i].hasOwnProperty('chunkIdx')) {
      continue;
    }
    var chunkIdx = inters[i].chunkIdx;
    var bondIdx = bondsIdc[Math.floor(chunkIdx / 2)];
    if (bondIdx < bonds.length) {
      var bond = bonds[bondIdx];
      inters[i].atom = chunkIdx % 2 === 0 ? bond._left : bond._right;
      intersects.push(inters[i]);
    }
  }
};

BondsGroup.prototype._calcChunksList = function(mask, innerOnly) {
  var chunksList = [];
  var bonds = this._selection.bonds;
  var chunksToIdx  = this._chunksIdc;
  for (var i = 0, n = chunksToIdx.length; i < n; ++i) {
    var bond = bonds[chunksToIdx[i]];
    if ((bond._left._mask & mask) && (!innerOnly || (bond._right._mask & mask))) {
      chunksList.push(2 * i);
    }
    if ((bond._right._mask & mask) && (!innerOnly || (bond._left._mask & mask))) {
      chunksList.push(2 * i + 1);
    }
  }
  return chunksList;
};

export default BondsGroup;

