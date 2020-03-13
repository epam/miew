import * as THREE from 'three';
import BondsGroup from './BondsGroup';

class BondsCylinderGroup extends BondsGroup {
  _build() {
    const bondsIdc = this._selection.chunks;
    const { bonds, parent } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    const drawMultiple = mode.drawMultiorderBonds();
    const showAromatic = mode.showAromaticLoops();

    const stickRad = mode.calcStickRadius();
    const emptyOffset = mode.calcSpaceFraction();
    let normDir;
    const leftPos = new THREE.Vector3();
    const rightPos = new THREE.Vector3();
    let currBondIdx = 0;
    const chunksToIdx = [];
    for (let i = 0, n = bondsIdc.length; i < n; ++i) {
      const bond = bonds[bondsIdc[i]];
      const atom1 = bond._left;
      const atom2 = bond._right;
      const a1Pos = atom1.position;
      const a2Pos = atom2.position;
      normDir = bond.calcNormalDir();
      const order = this.getBondOrder(bond, drawMultiple, showAromatic);
      const minRad = Math.min(mode.calcAtomRadius(atom1), mode.calcAtomRadius(atom2));
      const dist = 2 * minRad / order;
      const currStickRad = drawMultiple ? Math.min(stickRad, dist * 0.5 * (1.0 - emptyOffset)) : stickRad;

      for (let j = 0; j < order; ++j) {
        const scale = dist * (order % 2 === 0
          ? (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2))
          : (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
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
  }

  updateToFrame(frameData) {
    const bondsIdc = this._selection.chunks;
    const { bonds } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    const drawMultiple = mode.drawMultiorderBonds();
    const showAromatic = mode.showAromaticLoops();

    const stickRad = mode.calcStickRadius();
    const emptyOffset = mode.calcSpaceFraction();
    let normDir;
    const leftPos = new THREE.Vector3();
    const rightPos = new THREE.Vector3();
    let currBondIdx = 0;
    const updateColor = frameData.needsColorUpdate(colorer);
    for (let i = 0, n = bondsIdc.length; i < n; ++i) {
      const bond = bonds[bondsIdc[i]];
      const atom1 = bond._left;
      const atom2 = bond._right;
      const a1Pos = frameData.getAtomPos(atom1.index).clone();
      const a2Pos = frameData.getAtomPos(atom2.index);
      normDir = bond.calcNormalDir();
      const order = this.getBondOrder(bond, drawMultiple, showAromatic);
      const minRad = Math.min(mode.calcAtomRadius(atom1), mode.calcAtomRadius(atom2));
      const dist = 2 * minRad / order;
      const currStickRad = drawMultiple ? Math.min(stickRad, dist * 0.5 * (1.0 - emptyOffset)) : stickRad;

      for (let j = 0; j < order; ++j) {
        const scale = dist * (order % 2 === 0
          ? (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2))
          : (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
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
  }
}

export default BondsCylinderGroup;
