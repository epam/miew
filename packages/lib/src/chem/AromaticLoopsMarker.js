import * as THREE from 'three';
import Bond from './Bond';
import Element from './Element';

const cCrossThresh = 0.1;
const cAromaticType = Bond.BondType.AROMATIC;
const cAromaticAtoms = [
  Element.ByName.C.number,
  Element.ByName.N.number,
  // Element.ByName.O.number,
  // Element.ByName.S.number,
];

/** Conditions for bonds:
   *   - Cross product with each subsequent bond to add is collinear and point to the same direction
   *   - Each pair of a adjacent bonds belong to not more than one cycle
   *   - If there is more than one candidates we try them in ascending order of angle values
   */

const _coDirVectors = (function () {
  const v1Tmp = new THREE.Vector3();
  const v2Tmp = new THREE.Vector3();
  const cp = new THREE.Vector3();
  return function (v1, v2) {
    v1Tmp.copy(v1).normalize();
    v2Tmp.copy(v2).normalize();
    cp.crossVectors(v1Tmp, v2Tmp);
    if (cp.length() > cCrossThresh) {
      return false;
    }
    // zero vector in out terms must be collinear to any
    return v1Tmp.dot(v2Tmp) >= 0;
  };
}());

function _insertAscending(arr, val) {
  let idx = 0;
  while (idx < arr.length && arr[idx] < val) {
    ++idx;
  }
  arr.splice(idx, 0, val);
}

function _anotherAtom(bond, currAtom) {
  return bond._left === currAtom ? bond._right : bond._left;
}

function _cosBetween(v1, v2) {
  const theta = v1.dot(v2) / (Math.sqrt(v1.lengthSq() * v2.lengthSq()));
  return THREE.MathUtils.clamp(theta, -1, 1);
}

function _markAromatic(bond) {
  bond._type = cAromaticType;
}

class Cycle {
  constructor(atomsList) {
    this.atoms = atomsList;
    this.update();
  }

  update() {
    const { atoms } = this;
    const center = new THREE.Vector3();
    const nA = atoms.length;
    for (let j = 0; j < nA; ++j) {
      center.add(atoms[j].position);
    }
    center.multiplyScalar(1.0 / nA);
    this.center = center;
    this.radius = center.distanceTo(atoms[0].position.clone().lerp(atoms[1].position, 0.5));
  }

  forEachBond(process) {
    const { atoms } = this;
    const nA = atoms.length;
    let currAtom = atoms[0];
    let nextAtom;

    function checkBond(bond) {
      if (bond._left === nextAtom || bond._right === nextAtom) {
        process(bond);
      }
    }

    for (let i = 0; i < nA; ++i) {
      nextAtom = atoms[(i + 1) % nA];
      currAtom.forEachBond(checkBond);
      currAtom = nextAtom;
    }
  }
}

function _isAromatic(bond) {
  return bond._type === cAromaticType;
}

function _isPossibleAromatic(bond) {
  if (bond.type === cAromaticType) {
    return true;
  }
  const rightIdx = cAromaticAtoms.indexOf(bond._right.element.number);
  const leftIdx = cAromaticAtoms.indexOf(bond._left.element.number);
  return rightIdx !== -1 && leftIdx !== -1;
}

function _checkCycleSimple(cycle) {
  return cycle.length > 3;
}

function _checkCycleComplex(cycle) {
  console.assert(cycle.length > 2);
  return true;
}

class AromaticLoopsMarker {
  constructor(complex) {
    this._complex = complex;
    const bondsData = new Array(complex._bonds.length);
    const bondMarks = new Array(complex._bonds.length);
    for (let i = 0, n = bondsData.length; i < n; ++i) {
      bondsData[i] = [];
      bondMarks[i] = false;
    }
    this._bondsData = bondsData;
    this._bondMarks = bondMarks;
    this._resetCycles();
  }

  _resetCycles() {
    this._cycles = [];
    this._currIdx = -1;
  }

  _haveSameCycle(bondsData, bond1, bond2) {
    const arr1 = bondsData[bond1._index];
    const arr2 = bondsData[bond2._index];
    const n1 = arr1.length;
    const n2 = arr2.length;
    let i1 = 0;
    let i2 = 0;
    while (i1 < n1 && i2 < n2) {
      if (arr1[i1] === arr2[i2]) {
        return true;
      }
      if (arr1[i1] > arr2[i2]) {
        ++i2;
      } else {
        ++i1;
      }
    }
    return false;
  }

  _tryBond(prevBond, currRight, currDir) {
    const bondsOrder = [];
    const bondsData = this._bondsData;
    const currLeft = _anotherAtom(prevBond, currRight);
    const currVec = currRight.position.clone().sub(currLeft.position);
    const startAtomRef = this._currStart;
    const self = this;
    const bondMarks = this._bondMarks;
    let checkAromatic = this._checkBond;
    bondMarks[prevBond._index] = true;
    checkAromatic = checkAromatic === undefined ? _isAromatic : checkAromatic;
    currRight.forEachBond((newBond) => {
      if (!checkAromatic(newBond)
        || newBond === prevBond
        || bondMarks[newBond._index]
        || self._haveSameCycle(bondsData, prevBond, newBond)) {
        return;
      }
      const anotherAtom = _anotherAtom(newBond, currRight);
      const anotherVec = anotherAtom.position.clone().sub(currRight.position);
      const val = anotherAtom === startAtomRef ? -2.0 : 1 - _cosBetween(currVec, anotherVec);
      const newDir = anotherVec.cross(currVec);
      if (!_coDirVectors(newDir, currDir)) {
        return;
      }
      let idx = 0;
      while (idx < bondsOrder.length && bondsOrder[idx].val < val) {
        ++idx;
      }
      bondsOrder.splice(idx, 0, { bond: newBond, val, dir: newDir });
    });

    for (let i = 0, n = bondsOrder.length; i < n; ++i) {
      const { bond } = bondsOrder[i];
      const newRight = bond._left === currRight ? bond._right : bond._left;
      if (newRight === startAtomRef) {
        ++this._currIdx;
        this._cycles.push([currRight]);
        bondMarks[prevBond._index] = false;
        return true;
      }
      if (this._tryBond(bond, newRight, bondsOrder[i].dir)) {
        _insertAscending(bondsData[bond._index], this._currIdx);
        this._cycles[this._currIdx].push(currRight);
        bondMarks[prevBond._index] = false;
        return true;
      }
    }
    bondMarks[prevBond._index] = false;
    return false;
  }

  _startCycle(bond) {
    // start from left to right
    this._currStart = bond._left;
    if (this._tryBond(bond, bond._right, new THREE.Vector3())) {
      _insertAscending(this._bondsData[bond._index], this._currIdx);
      this._cycles[this._currIdx].push(bond._left);
    }
  }

  _findLoops(checkBond, checkCycle) {
    this._checkBond = checkBond;
    const complex = this._complex;
    const self = this;

    complex.forEachComponent((component) => {
      self._resetCycles();
      component.forEachBond((bond) => {
        if (checkBond(bond)) {
          self._startCycle(bond);
        }
      });
      const cycles = self._cycles;
      for (let i = 0, n = cycles.length; i < n; ++i) {
        const cycle = cycles[i];
        if (!checkCycle(cycle)) {
          continue;
        }
        const newCycle = new Cycle(cycle);
        newCycle.forEachBond(_markAromatic);
        component.addCycle(newCycle);
      }
    });
  }

  markCycles() {
    this._findLoops(_isAromatic, _checkCycleSimple);
  }

  detectCycles() {
    this._findLoops(_isPossibleAromatic, _checkCycleComplex);
  }
}

export default AromaticLoopsMarker;
