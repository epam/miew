import * as THREE from 'three';
import Atom from './Atom';
import Element from './Element';

const cNucleicControlNames = ['C3\'', 'C3*', 'P', 'H5T', 'H3T'];
const cNucleicWing1Names = ['OP1', 'O1P'];
const cNucleicWing2Names = ['OP2', 'O2P'];

const cCylinderSource = ['C3\'', 'C3*', 'C1', 'C1\'', 'C1*', 'P'];
const cCylinderTarget = [{
  types: ['A', 'DA', 'G', 'DG'],
  atoms: ['N1'],
}, {
  types: ['C', 'DC'],
  atoms: ['N3'],
}, {
  types: ['T', 'DT', 'U', 'DU'],
  atoms: ['O4'],
}];

/**
 * Residue instance.
 *
 * @param {Chain} chain      - Chain this residue belongs to.
 * @param {ResidueType} type - Generic residue instance type.
 * @param {number} sequence  - Sequence ID.
 * @param {string} icode     - One character insertion code (usually space or A-Z).
 *
 * @exports Residue
 * @constructor
 */
class Residue {
  constructor(chain, type, sequence, icode) {
    this._chain = chain;
    this._component = null;
    this._type = type;
    this._sequence = sequence;
    this._icode = icode;
    this._mask = 1 | 0;
    this._index = -1;

    this._atoms = [];
    this._secondary = null;
    this._firstAtom = null;
    this._leadAtom = null;
    this._wingAtom = null;
    this._lastAtom = null;
    this._controlPoint = null;
    this._midPoint = null;
    this._wingVector = null;
    this._cylinders = null;
    this._isValid = true;
    this._het = false;
    this._molecule = null;
    this.temperature = null;
    this.occupancy = null;
  }

  // Getters and setters
  getChain() {
    return this._chain;
  }

  getMolecule() {
    return this._molecule;
  }

  getType() {
    return this._type;
  }

  getSequence() {
    return this._sequence;
  }

  getSecondary() {
    return this._secondary;
  }

  getICode() {
    return this._icode;
  }

  // Other methods

  addAtom(name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge) {
    const atom = new Atom(this, name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge);
    const complex = this._chain.getComplex();
    complex.addAtom(atom);
    this._atoms.push(atom);
    this._het = this._het || het;
    return atom;
  }

  getAtomCount() {
    return this._atoms.length;
  }

  forEachAtom(process) {
    const atoms = this._atoms;
    for (let i = 0, n = atoms.length; i < n; ++i) {
      if (process(atoms[i])) {
        break;
      }
    }
  }

  _findAtomByName(name) {
    let res = null;
    this.forEachAtom((atom) => {
      if (atom.name === name) {
        res = atom;
        return true;
      }
      return false;
    });
    return res;
  }

  _findFirstAtomInList(names) {
    let res = null;
    for (let i = 0; i < names.length; ++i) {
      res = this._findAtomByName(names[i]);
      if (res !== null) {
        return res;
      }
    }
    return res;
  }

  collectMask() {
    let mask = 0xffffffff;
    const atoms = this._atoms;
    for (let i = 0, n = atoms.length; i < n; ++i) {
      mask &= atoms[i].mask;
    }
    this._mask = mask;
  }

  getCylinderTargetList() {
    const type = this._type._name;
    for (let i = 0, n = cCylinderTarget.length; i < n; ++i) {
      for (let j = 0, m = cCylinderTarget[i].types.length; j < m; ++j) {
        if (type === cCylinderTarget[i].types[j]) {
          return cCylinderTarget[i].atoms;
        }
      }
    }
    return null;
  }

  _detectLeadWing(dst, next, getAtomPosition) {
    const leadAtom = this._findFirstAtomInList(cNucleicControlNames);
    let wingStart = this._findFirstAtomInList(cNucleicWing1Names);
    let wingEnd = this._findFirstAtomInList(cNucleicWing2Names);

    if (wingStart === null && next !== null) {
      wingStart = next._findFirstAtomInList(cNucleicWing1Names);
    }

    if (wingEnd === null && next !== null) {
      wingEnd = next._findFirstAtomInList(cNucleicWing2Names);
    }

    if (leadAtom === null || wingStart === null || wingEnd === null) {
      return;
    }

    dst._leadAtom = leadAtom;
    dst._controlPoint = getAtomPosition(leadAtom);
    dst._wingVector = getAtomPosition(wingEnd).clone().sub(getAtomPosition(wingStart));
    dst._isValid = true;

    const cylSource = this._findFirstAtomInList(cCylinderSource);
    const targetList = this.getCylinderTargetList();
    const cylTarget = targetList !== null ? this._findFirstAtomInList(targetList) : null;
    if (cylSource === null || cylTarget === null) {
      return;
    }
    dst._cylinders = [getAtomPosition(cylSource), getAtomPosition(cylTarget)];
  }

  calcWing(prevLeadPos, currLeadPos, prevWingPos, prevWing) {
    const vectorA = currLeadPos.clone().sub(prevLeadPos);
    const vectorB = prevLeadPos.clone().sub(prevWingPos);
    vectorB.crossVectors(vectorA, vectorB);
    vectorB.crossVectors(vectorA, vectorB).normalize();
    if (prevWing !== null && prevWing.length() > 0.0001) {
      const needToNegate = vectorB.length() > 0.0001 && Math.abs(prevWing.angleTo(vectorB)) > Math.PI / 2;
      if (needToNegate) {
        vectorB.negate();
      }
    }
    return vectorB;
  }

  _innerFinalize(prevRes, prev, nextRes, dst, chainAsNucleic, getAtomPosition) {
    const bFirstInChain = prev === null;

    const lp = getAtomPosition(this._leadAtom);
    const currLeadPos = new THREE.Vector3(lp.x, lp.y, lp.z);
    if (chainAsNucleic) {
      this._detectLeadWing(dst, nextRes, getAtomPosition);
      return;
    }

    if (bFirstInChain) { // for first one in chain
      dst._midPoint = getAtomPosition(this._firstAtom).clone();
    } else {
      const prevLeadPos = prev._controlPoint; // lead point of previous monomer
      dst._midPoint = prevLeadPos.clone().lerp(currLeadPos, 0.5);
      dst._wingVector = this.calcWing(prevLeadPos, currLeadPos, getAtomPosition(prevRes._wingAtom), prev._wingVector);
    }
    dst._controlPoint = currLeadPos;
  }

  _finalize2(prev, next, asNucleic) {
    // Should be called AFTER first finalize
    this._innerFinalize(prev, prev, next, this, asNucleic, (atom) => atom.position);
  }

  isConnected(anotherResidue) {
    if (this._chain !== anotherResidue._chain) {
      return false;
    }
    if (this === anotherResidue) {
      return true;
    }
    let res = false;
    this.forEachAtom((atom) => {
      const { bonds } = atom;
      for (let i = 0, n = bonds.length; i < n; ++i) {
        const bond = bonds[i];
        if (bond._left.residue === anotherResidue || bond._right.residue === anotherResidue) {
          res = true;
          return true;
        }
      }
      return false;
    });
    return res;
  }

  _finalize() {
    const self = this;
    [this._firstAtom] = this._atoms;
    this._lastAtom = this._atoms[this._atoms.length - 1];

    this._leadAtom = null;
    this._wingAtom = null;

    let tempCount = 0;
    let temperature = 0; // average temperature
    let occupCount = 0;
    let occupancy = 0; // average occupancy
    this.forEachAtom((a) => {
      if (self._leadAtom === null) {
        if (a.role === Element.Constants.Lead) {
          self._leadAtom = a;
        }
      }
      if (self._wingAtom === null) {
        if (a.role === Element.Constants.Wing) {
          self._wingAtom = a;
        }
      }
      if (a.temperature) {
        temperature += a.temperature;
        tempCount++;
      }
      if (a.occupancy) {
        occupancy += a.occupancy;
        occupCount++;
      }
      return (self._leadAtom !== null && self._wingAtom !== null);
    });

    if (tempCount > 0) {
      this.temperature = temperature / tempCount;
    }
    if (occupCount > 0) {
      this.occupancy = occupancy / occupCount;
    }

    // Still try to make monomer look valid
    if (this._leadAtom === null || this._wingAtom === null) {
      this._isValid = false;
    }
    if (this._leadAtom === null) {
      this._leadAtom = this._firstAtom;
    }
    if (this._wingAtom === null) {
      this._wingAtom = this._lastAtom;
    }
  }
}

export default Residue;
