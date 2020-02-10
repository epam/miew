const cBondTypes = {
  /** Was generated manually */
  UNKNOWN: 0,
  /** Simple covalent bond */
  COVALENT: 1,
  /** Aromatic bond */
  AROMATIC: 2,
};

function getAtomPos(atom) {
  return atom.position;
}

/**
 * Bond between atoms.
 *
 * @param {Atom} left     - The first atom.
 * @param {Atom} right    - The second atom.
 * @param {number} order - Order of current bond.
 * @param {number} type - Bond type.
 * @param {boolean} fixed - Indicator of a pre-specified connection (in contrast with guessed one).
 *
 * @exports Bond
 * @constructor
 */
class Bond {
  constructor(left, right, order, type, fixed) {
    this._left = left;
    this._right = right;
    this._fixed = fixed;
    this._index = -1;
    if (left > right) {
      throw new Error('In a bond atom indices must be in increasing order');
    }
    this._order = order;
    this._type = type;
  }

  getLeft() {
    return this._left;
  }

  getRight() {
    return this._right;
  }

  getOrder() {
    return this._order;
  }

  calcLength() {
    return this._left.position.distanceTo(this._right.position);
  }

  _forEachNeighbour(currAtom, process) {
    const { bonds } = currAtom;
    for (let i = 0, n = bonds.length; i < n; ++i) {
      process(bonds[i]._left !== currAtom ? bonds[i]._left : bonds[i]._right);
    }
  }

  forEachLevelOne(process) {
    const left = this._left;
    const right = this._right;
    this._forEachNeighbour(left, (atom) => {
      if (atom === right) {
        return;
      }
      process(atom);
    });
    this._forEachNeighbour(right, (atom) => {
      if (atom === left) {
        return;
      }
      process(atom);
    });
  }

  forEachLevelTwo(process) {
    // TODO refactor this piece of an art?
    const left = this._left;
    const right = this._right;
    const self = this;
    self._forEachNeighbour(left, (atom) => {
      if (atom === right) {
        return;
      }
      self._forEachNeighbour(atom, (l2Atom) => {
        if (l2Atom === left) {
          return;
        }
        process(l2Atom);
      });
    });
    self._forEachNeighbour(right, (atom) => {
      if (atom === left) {
        return;
      }
      self._forEachNeighbour(atom, (l2Atom) => {
        if (l2Atom === right) {
          return;
        }
        process(l2Atom);
      });
    });
  }

  _fixDir(refPoint, currDir, posGetter) {
    // count atoms to the right and to the left of the current plane
    let rightCount = 0;
    let leftCount = 0;
    const tmpVec = refPoint.clone();
    function checkDir(atom) {
      tmpVec.copy(posGetter(atom));
      tmpVec.sub(refPoint);
      const dotProd = currDir.dot(tmpVec);
      if (dotProd > 0) {
        ++rightCount;
      } else {
        ++leftCount;
      }
    }
    function checkCarbon(atom) {
      if (atom.element.name === 'C') {
        checkDir(atom);
      }
    }
    // count all atoms to the left and right of our plane, start from level 1 and carbons
    const stages = [
      [this.forEachLevelOne, checkCarbon],
      [this.forEachLevelOne, checkDir],
      [this.forEachLevelTwo, checkCarbon],
      [this.forEachLevelTwo, checkDir],
    ];

    for (let stageId = 0; stageId < stages.length; ++stageId) {
      stages[stageId][0].call(this, stages[stageId][1]);
      if (leftCount > rightCount) {
        return currDir.multiplyScalar(-1);
      }
      if (leftCount < rightCount) {
        return currDir;
      }
    }
    return currDir;
  }

  calcNormalDir(posGetter) {
    const left = this._left;
    const right = this._right;
    let first = left;
    let second = right;
    posGetter = posGetter === undefined ? getAtomPos : posGetter;
    if (left.bonds.length > right.bonds.length) {
      first = right;
      second = left;
    }
    let third = first;
    let maxNeibs = 0;
    const { bonds } = second;
    for (let i = 0, n = bonds.length; i < n; ++i) {
      let another = bonds[i]._left;
      if (bonds[i]._left === second) {
        another = bonds[i]._right;
      }
      if (another.bonds.length > maxNeibs && another !== first) {
        third = another;
        maxNeibs = another.bonds.length;
      }
    }
    const secondPos = posGetter(second);
    const firstV = posGetter(first).clone().sub(secondPos);
    const secondV = posGetter(third).clone().sub(secondPos);
    secondV.crossVectors(firstV, secondV);
    if (secondV.lengthSq() < 0.0001) {
      secondV.set(0, 1, 0);
    }
    firstV.normalize();
    secondV.normalize();
    firstV.crossVectors(secondV, firstV);
    if (firstV.lengthSq() < 0.0001) {
      firstV.set(0, 1, 0);
    }
    firstV.normalize();
    return this._fixDir(secondPos, firstV, posGetter);
  }

  static BondType = cBondTypes;
}

Bond.prototype.BondType = cBondTypes;

export default Bond;
