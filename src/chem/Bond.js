

//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
var cBondTypes = {
  /** Was generated manually */
  UNKNOWN: 0,
  /** Simple covalent bond */
  COVALENT: 1,
  /** Aromatic bond */
  AROMATIC: 2
};

function getAtomPos(atom) {
  return atom._position;
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
function Bond(left, right, order, type, fixed) {
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

Bond.BondType = cBondTypes;

Bond.prototype.BondType = cBondTypes;

Bond.prototype.getLeft = function() {
  return this._left;
};

Bond.prototype.getRight = function() {
  return this._right;
};

Bond.prototype.getOrder = function() {
  return this._order;
};

Bond.prototype.calcLength = function() {
  return this._left._position.distanceTo(this._right._position);
};

Bond.prototype._forEachNeighbour = function(currAtom, process) {
  var bonds = currAtom._bonds;
  for (var i = 0, n = bonds.length; i < n; ++i) {
    process(bonds[i]._left !== currAtom ? bonds[i]._left : bonds[i]._right);
  }
};

Bond.prototype.forEachLevelOne = function(process) {
  var left = this._left;
  var right = this._right;
  this._forEachNeighbour(left, function(atom) {
    if (atom === right) {
      return;
    }
    process(atom);
  });
  this._forEachNeighbour(right, function(atom) {
    if (atom === left) {
      return;
    }
    process(atom);
  });
};

Bond.prototype.forEachLevelTwo = function(process) {
  // TODO refactor this piece of an art?
  var left = this._left;
  var right = this._right;
  var self = this;
  self._forEachNeighbour(left, function(atom) {
    if (atom === right) {
      return;
    }
    self._forEachNeighbour(atom, function(l2Atom) {
      if (l2Atom === left) {
        return;
      }
      process(l2Atom);
    });
  });
  self._forEachNeighbour(right, function(atom) {
    if (atom === left) {
      return;
    }
    self._forEachNeighbour(atom, function(l2Atom) {
      if (l2Atom === right) {
        return;
      }
      process(l2Atom);
    });
  });
};

Bond.prototype._fixDir = function(refPoint, currDir, posGetter) {
  // count atoms to the right and to the left of the current plane
  var rightCount = 0;
  var leftCount = 0;
  var tmpVec = refPoint.clone();
  function checkDir(atom) {
    tmpVec.copy(posGetter(atom));
    tmpVec.sub(refPoint);
    var dotProd = currDir.dot(tmpVec);
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
  var stages = [
    [this.forEachLevelOne, checkCarbon],
    [this.forEachLevelOne, checkDir],
    [this.forEachLevelTwo, checkCarbon],
    [this.forEachLevelTwo, checkDir],
  ];

  for (var stageId = 0; stageId < stages.length; ++stageId) {
    stages[stageId][0].call(this, stages[stageId][1]);
    if (leftCount > rightCount) {
      return currDir.multiplyScalar(-1);
    } else if (leftCount < rightCount) {
      return currDir;
    }
  }
  return currDir;
};

Bond.prototype.calcNormalDir = function(posGetter) {
  var left = this._left;
  var right = this._right;
  var first = left;
  var second = right;
  posGetter = posGetter === undefined ? getAtomPos : posGetter;
  if (left._bonds.length > right._bonds.length) {
    first = right;
    second = left;
  }
  var third = first;
  var maxNeibs = 0;
  var bonds = second._bonds;
  for (var i = 0, n = bonds.length; i < n; ++i) {
    var another = bonds[i]._left;
    if (bonds[i]._left === second) {
      another = bonds[i]._right;
    }
    if (another._bonds.length > maxNeibs && another !== first) {
      third = another;
      maxNeibs = another._bonds.length;
    }
  }
  var secondPos = posGetter(second);
  var firstV = posGetter(first).clone().sub(secondPos);
  var secondV = posGetter(third).clone().sub(secondPos);
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
};

export default Bond;

