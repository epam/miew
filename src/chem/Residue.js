

//////////////////////////////////////////////////////////////////////////////
import Atom from './Atom';
import Element from './Element';
import * as THREE from 'three';
import ResidueType from './ResidueType';
//////////////////////////////////////////////////////////////////////////////

var cNucleicControlNames = ['C3\'', 'C3*', 'P', 'H5T', 'H3T'];
var cNucleicWing1Names = ['OP1', 'O1P'];
var cNucleicWing2Names = ['OP2', 'O2P'];

var cCylinderSource = ['C3\'', 'C3*', 'C1', 'C1\'', 'C1*', 'P'];
var cCylinderTarget =  [{
  types: ['A', 'DA', 'G', 'DG'],
  atoms: ['N1']
}, {
  types: ['C', 'DC'],
  atoms: ['N3']
}, {
  types: ['T', 'DT', 'U', 'DU'],
  atoms: ['O4']
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
function Residue(chain, type, sequence, icode) {
  this._chain = chain;
  this._component = null;
  this._type = type;
  this._sequence = sequence;
  this._icode = icode;
  this._mask = 1 | 0;
  this._index = -1;

  this._atoms = []; // TODO: change to range
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
Residue.prototype.getChain = function() {
  return this._chain;
};

Residue.prototype.getMolecule = function() {
  return this._molecule;
};

Residue.prototype.getType = function() {
  return this._type;
};

Residue.prototype.getSequence = function() {
  return this._sequence;
};

Residue.prototype.getSecondary = function() {
  return this._secondary;
};

Residue.prototype.getICode = function() {
  return this._icode;
};

// Other methods

Residue.prototype.addAtom = function(name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge) {
  var atom = new Atom(this, name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge);
  var complex = this._chain.getComplex();
  complex.addAtom(atom);
  this._atoms.push(atom); // TODO: change to range
  this._het = this._het || het;
  return atom;
};

Residue.prototype.getAtomCount = function() {
  return this._atoms.length;
};

Residue.prototype.forEachAtom = function(process) {
  var atoms = this._atoms;
  for (var i = 0, n = atoms.length; i < n; ++i) {
    if (process(atoms[i])) {
      break;
    }
  }
};

Residue.prototype._findAtomByName = function(name) {
  var res = null;
  this.forEachAtom(function(atom) {
    if (atom._name._name === name) {
      res = atom;
      return true;
    }
    return false;
  });
  return res;
};

Residue.prototype._findFirstAtomInList = function(names) {
  var res = null;
  for (var i = 0; i < names.length; ++i) {
    res = this._findAtomByName(names[i]);
    if (res !== null) {
      return res;
    }
  }
  return res;
};

Residue.prototype.collectMask = function() {
  var mask = 0xffffffff;
  var atoms = this._atoms;
  for (var i = 0, n = atoms.length; i < n; ++i) {
    mask &= atoms[i]._mask;
  }
  this._mask = mask;
};

Residue.prototype.getCylinderTargetList = function() {
  var type = this._type._name;
  for (var i = 0, n = cCylinderTarget.length; i < n; ++i) {
    for (var j = 0, m = cCylinderTarget[i].types.length; j < m; ++j) {
      if (type === cCylinderTarget[i].types[j]) {
        return cCylinderTarget[i].atoms;
      }
    }
  }
  return null;
};

Residue.prototype._detectLeadWing = function(dst, next, getAtomPosition) {
  var leadAtom = this._findFirstAtomInList(cNucleicControlNames);
  var wingStart = this._findFirstAtomInList(cNucleicWing1Names);
  var wingEnd = this._findFirstAtomInList(cNucleicWing2Names);

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

  var cylSource = this._findFirstAtomInList(cCylinderSource);
  var targetList = this.getCylinderTargetList();
  var cylTarget = targetList !== null ? this._findFirstAtomInList(targetList) : null;
  if (cylSource === null || cylTarget === null) {
    return;
  }
  dst._cylinders = [getAtomPosition(cylSource), getAtomPosition(cylTarget)];
};

Residue.prototype.calcWing = function(prevLeadPos, currLeadPos, prevWingPos, prevWing) {
  var vectorA = currLeadPos.clone().sub(prevLeadPos);
  var vectorB = prevLeadPos.clone().sub(prevWingPos);
  vectorB.crossVectors(vectorA, vectorB);
  vectorB.crossVectors(vectorA, vectorB).normalize();
  if (prevWing !== null && Math.abs(prevWing.angleTo(vectorB)) > Math.PI / 2) {
    vectorB.negate();
  }
  return vectorB;
};

Residue.prototype._innerFinalize = function(prevRes, prev, nextRes, dst, getAtomPosition) {
  var bFirstInChain = prev === null;

  var lp = getAtomPosition(this._leadAtom);
  var currLeadPos = new THREE.Vector3(lp.x, lp.y, lp.z);
  if ((this._type.flags & ResidueType.Flags.NUCLEIC) !== 0) {
    this._detectLeadWing(dst, nextRes, getAtomPosition);
    return;
  }
  if (bFirstInChain) { //for first one in chain
    dst._midPoint = getAtomPosition(this._firstAtom).clone();
  } else {
    var prevLeadPos = prev._controlPoint; //lead point of previous monomer
    dst._midPoint = prevLeadPos.clone().lerp(currLeadPos, 0.5);
    dst._wingVector = this.calcWing(prevLeadPos, currLeadPos, getAtomPosition(prevRes._wingAtom), prev._wingVector);
  }
  dst._controlPoint = currLeadPos;
};

Residue.prototype._finalize2 = function(prev, next) {
  //Should be called AFTER first finalize
  this._innerFinalize(prev, prev, next, this, function(atom) { return atom._position; });
};

Residue.prototype.isConnected = function(anotherResidue) {
  if (this._chain !== anotherResidue._chain) {
    return false;
  }
  if (this === anotherResidue) {
    return true;
  }
  var res = false;
  this.forEachAtom(function(atom) {
    var bonds = atom._bonds;
    for (var i = 0, n = bonds.length; i < n; ++i) {
      var bond = bonds[i];
      if (bond._left._residue === anotherResidue || bond._right._residue === anotherResidue) {
        res = true;
        return true;
      }
    }
    return false;
  });
  return res;
};

Residue.prototype._finalize = function() {
  const self = this;
  this._firstAtom = this._atoms[0];
  this._lastAtom = this._atoms[this._atoms.length - 1];

  this._leadAtom = null;
  this._wingAtom = null;

  let tempCount = 0;
  let temperature = 0; // average temperature
  let occupCount = 0;
  let occupancy = 0; // average occupancy
  // TODO: Is it correct? Is it fast?
  this.forEachAtom(function(a) {
    if (self._leadAtom === null) {
      if (a._role === Element.Constants.Lead) {
        self._leadAtom = a;
      }
    }
    if (self._wingAtom === null) {
      if (a._role === Element.Constants.Wing) {
        self._wingAtom = a;
      }
    }
    if (a._temperature) {
      temperature += a._temperature;
      tempCount++;
    }
    if (a._occupancy) {
      occupancy += a._occupancy;
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

  //Still try to make monomer look valid
  if (this._leadAtom === null || this._wingAtom === null) {
    this._isValid = false;
  }
  if (this._leadAtom === null) {
    this._leadAtom = this._firstAtom;
  }
  if (this._wingAtom === null) {
    this._wingAtom = this._lastAtom;
  }
};

export default Residue;

