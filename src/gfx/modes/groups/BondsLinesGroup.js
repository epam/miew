import * as THREE from 'three';
import BondsGroup from './BondsGroup';

const STEP_SIZE = 0.15;

class BondsLinesGroup extends BondsGroup {
  _build() {
    const bondsIdc = this._selection.chunks;
    const { bonds, parent } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    const drawMultiple = mode.drawMultiorderBonds();
    const showAromatic = mode.showAromaticLoops();

    const bondDir = new THREE.Vector3();

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
      const a1Hangs = atom1.bonds.length === 1;
      const a2Hangs = atom2.bonds.length === 1;
      bondDir.subVectors(a2Pos, a1Pos);
      const len = bondDir.length();
      const normDir = bond.calcNormalDir();

      const order = this.getBondOrder(bond, drawMultiple, showAromatic);

      for (let j = 0; j < order; ++j) {
        leftPos.copy(a1Pos);
        rightPos.copy(a2Pos);
        let scale = (order % 2 === 0
          ? (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2))
          : (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
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
  }

  updateToFrame(frameData) {
    // This method looks like a copy paste. However, it
    // was decided to postpone animation refactoring until GFX is fixed.
    const bondsIdc = this._selection.chunks;
    const { bonds } = this._selection;
    const mode = this._mode;
    const colorer = this._colorer;
    const geo = this._geo;
    const drawMultiple = mode.drawMultiorderBonds();
    const showAromatic = mode.showAromaticLoops();

    const bondDir = new THREE.Vector3();

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
      const a1Hangs = atom1.bonds.length === 1;
      const a2Hangs = atom2.bonds.length === 1;
      bondDir.subVectors(a2Pos, a1Pos);
      const len = bondDir.length();
      const normDir = bond.calcNormalDir();

      const order = this.getBondOrder(bond, drawMultiple, showAromatic);

      for (let j = 0; j < order; ++j) {
        leftPos.copy(a1Pos);
        rightPos.copy(a2Pos);
        let scale = (order % 2 === 0
          ? (((j / 2) | 0) + 0.5) * (1 - 2 * (j % 2))
          : (((j + 1) / 2) | 0) * (-1 + 2 * (j % 2)));
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
  }
}

export default BondsLinesGroup;
