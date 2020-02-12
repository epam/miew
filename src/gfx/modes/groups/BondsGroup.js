import ChemGroup from './ChemGroup';
import Bond from '../../../chem/Bond';

function getCylinderCount(bondOrder) {
  return bondOrder < 2 ? 1 : bondOrder;
}

class BondsGroup extends ChemGroup {
  _makeGeoArgs() {
    const drawMultiple = this._mode.drawMultiorderBonds();
    const showAromatic = this._mode.showAromaticLoops();
    const bondsIdc = this._selection.chunks;
    const { bonds } = this._selection;
    let bondsCount = 0;
    for (let i = 0, n = bondsIdc.length; i < n; ++i) {
      bondsCount += this.getBondOrder(bonds[bondsIdc[i]], drawMultiple, showAromatic);
    }
    return [bondsCount, this._polyComplexity];
  }

  getBondOrder(bond, drawMultiple, showAromatic) {
    let bondOrder = 1;
    if (drawMultiple && (!showAromatic || bond._type !== Bond.BondType.AROMATIC)) {
      bondOrder = getCylinderCount(bond._order);
    }
    return bondOrder;
  }

  raycast(raycaster, intersects) {
    const { bonds } = this._selection;
    const inters = [];
    this._mesh.raycast(raycaster, inters);
    const bondsIdc = this._chunksIdc;
    // process inters array - arr object references
    for (let i = 0, n = inters.length; i < n; ++i) {
      if (!inters[i].hasOwnProperty('chunkIdx')) {
        continue;
      }
      const { chunkIdx } = inters[i];
      const bondIdx = bondsIdc[Math.floor(chunkIdx / 2)];
      if (bondIdx < bonds.length) {
        const bond = bonds[bondIdx];
        inters[i].atom = chunkIdx % 2 === 0 ? bond._left : bond._right;
        intersects.push(inters[i]);
      }
    }
  }

  _calcChunksList(mask, innerOnly) {
    const chunksList = [];
    const { bonds } = this._selection;
    const chunksToIdx = this._chunksIdc;
    for (let i = 0, n = chunksToIdx.length; i < n; ++i) {
      const bond = bonds[chunksToIdx[i]];
      if ((bond._left.mask & mask) && (!innerOnly || (bond._right.mask & mask))) {
        chunksList.push(2 * i);
      }
      if ((bond._right.mask & mask) && (!innerOnly || (bond._left.mask & mask))) {
        chunksList.push(2 * i + 1);
      }
    }
    return chunksList;
  }
}

export default BondsGroup;
