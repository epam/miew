

//////////////////////////////////////////////////////////////////////////////
import * as THREE from 'three';
import Bond from './Bond';
import Element from './Element';
var cCrossThresh = 0.1;
var cAromaticType = Bond.BondType.AROMATIC;
var cAromaticAtoms = [
  Element.ByName.C.number,
  Element.ByName.N.number
  /*Element.ByName.O.number,
    Element.ByName.S.number,*/
];


  /** Conditions for bonds:
   *   - Cross product with each subsequent bond to add is collinear and point to the same direction
   *   - Each pair of a adjacent bonds belong to not more than one cycle
   *   - If there is more than one candidates we try them in ascending order of angle values
   */

var _coDirVectors = (function() {
  var v1Tmp = new THREE.Vector3();
  var v2Tmp = new THREE.Vector3();
  var cp = new THREE.Vector3();
  return function(v1, v2) {
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
  var idx = 0;
  while (idx < arr.length && arr[idx] < val) {
    ++idx;
  }
  arr.splice(idx, 0, val);
}

function _anotherAtom(bond, currAtom) {
  return bond._left === currAtom ? bond._right : bond._left;
}

function _cosBetween(v1, v2) {
  var theta = v1.dot(v2) / (Math.sqrt(v1.lengthSq() * v2.lengthSq()));
  return THREE.Math.clamp(theta, -1, 1);
}

function _markAromatic(bond) {
  bond._type = cAromaticType;
}

function Cycle(atomsList) {
  this.atoms = atomsList;
  this.update();
}

Cycle.prototype.update = function() {
  var atoms = this.atoms;
  var center = new THREE.Vector3();
  var nA = atoms.length;
  for (var j = 0; j < nA; ++j) {
    center.add(atoms[j]._position);
  }
  center.multiplyScalar(1.0 / nA);
  this.center = center;
  this.radius = center.distanceTo(atoms[0]._position.clone().lerp(atoms[1]._position, 0.5));
};

Cycle.prototype.forEachBond = function(process) {
  var atoms = this.atoms;
  var nA = atoms.length;
  var currAtom = atoms[0];
  var nextAtom;

  function checkBond(bond) {
    if (bond._left === nextAtom || bond._right === nextAtom) {
      process(bond);
    }
  }

  for (var i = 0; i < nA; ++i) {
    nextAtom = atoms[(i + 1) % nA];
    currAtom.forEachBond(checkBond);
    currAtom = nextAtom;
  }
};

function _isAromatic(bond) {
  return bond._type === cAromaticType;
}

function _isPossibleAromatic(bond) {
  if (bond.type === cAromaticType) {
    return true;
  }
  var rightIdx = cAromaticAtoms.indexOf(bond._right.element.number);
  var leftIdx = cAromaticAtoms.indexOf(bond._left.element.number);
  return rightIdx !== -1 && leftIdx !== -1;
}

function _checkCycleSimple(cycle) {
  return cycle.length > 3;
}

function _checkCycleComplex(cycle) {
  console.assert(cycle.length > 2);
  return true;
}

function AromaticLoopsMarker(complex) {
  this._complex = complex;
  var bondsData = new Array(complex._bonds.length);
  var bondMarks = new Array(complex._bonds.length);
  for (var i = 0, n = bondsData.length; i < n; ++i) {
    bondsData[i] = [];
    bondMarks[i] = false;
  }
  this._bondsData = bondsData;
  this._bondMarks = bondMarks;
  this._resetCycles();
}

AromaticLoopsMarker.prototype._resetCycles = function() {
  this._cycles = [];
  this._currIdx = -1;
};

AromaticLoopsMarker.prototype._haveSameCycle = function(bondsData, bond1, bond2) {
  var arr1 = bondsData[bond1._index];
  var arr2 = bondsData[bond2._index];
  var n1 = arr1.length;
  var n2 = arr2.length;
  var i1 = 0;
  var i2 = 0;
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
};

AromaticLoopsMarker.prototype._tryBond = function(prevBond, currRight, currDir) {
  var bondsOrder = [];
  var bondsData = this._bondsData;
  var currLeft = _anotherAtom(prevBond, currRight);
  var currVec = currRight._position.clone().sub(currLeft._position);
  var startAtomRef = this._currStart;
  var self = this;
  var bondMarks = this._bondMarks;
  var checkAromatic = this._checkBond;
  bondMarks[prevBond._index] = true;
  checkAromatic = checkAromatic === undefined ? _isAromatic : checkAromatic;
  currRight.forEachBond(function(newBond) {
    if (!checkAromatic(newBond) ||
          newBond === prevBond ||
          bondMarks[newBond._index] ||
          self._haveSameCycle(bondsData, prevBond, newBond)) {
      return;
    }
    var anotherAtom = _anotherAtom(newBond, currRight);
    var anotherVec = anotherAtom._position.clone().sub(currRight._position);
    var val = anotherAtom === startAtomRef ? -2.0 : 1 - _cosBetween(currVec, anotherVec);
    var newDir = anotherVec.cross(currVec);
    if (!_coDirVectors(newDir, currDir)) {
      return;
    }
    var idx = 0;
    while (idx < bondsOrder.length && bondsOrder[idx].val < val) {
      ++idx;
    }
    bondsOrder.splice(idx, 0, {bond: newBond, val: val, dir: newDir});
  });

  for (var i = 0, n = bondsOrder.length; i < n; ++i) {
    var bond = bondsOrder[i].bond;
    var newRight = bond._left === currRight ? bond._right : bond._left;
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
};

AromaticLoopsMarker.prototype._startCycle = function(bond) {
  // start from left to right
  this._currStart = bond._left;
  if (this._tryBond(bond, bond._right, new THREE.Vector3())) {
    _insertAscending(this._bondsData[bond._index], this._currIdx);
    this._cycles[this._currIdx].push(bond._left);
  }
};

AromaticLoopsMarker.prototype._findLoops = function(checkBond, checkCycle) {
  this._checkBond = checkBond;
  var complex = this._complex;
  var self = this;

  complex.forEachComponent(function(component) {
    self._resetCycles();
    component.forEachBond(function(bond) {
      if (checkBond(bond)) {
        self._startCycle(bond);
      }
    });
    var cycles = self._cycles;
    for (var i = 0, n = cycles.length; i < n; ++i) {
      var cycle = cycles[i];
      if (!checkCycle(cycle)) {
        continue;
      }
      var newCycle = new Cycle(cycle);
      newCycle.forEachBond(_markAromatic);
      component.addCycle(newCycle);
    }
  });
};

AromaticLoopsMarker.prototype.markCycles = function() {
  this._findLoops(_isAromatic, _checkCycleSimple);
};

AromaticLoopsMarker.prototype.detectCycles = function() {
  this._findLoops(_isPossibleAromatic, _checkCycleComplex);
};

export default AromaticLoopsMarker;

