

//////////////////////////////////////////////////////////////////////////////
import AtomPairs from './AtomPairs';
import Bond from './Bond';
import settings from '../settings';
//////////////////////////////////////////////////////////////////////////////
var cProfileBondBuilder = false;
var cEstBondsMultiplier = 4;
var cSpaceCode = 32;
var cBondTolerance = 0.45;
var cVMDTolerance = 0.6;
var cBondRadInJMOL = true;
var cEpsilon = 0.001;

/**
 * Get radius used for building bonds.
 *
 * @param {Atom} atom - Atom object.
 * @returns {number} special value for bonding radius for this atom
 */
function _getBondingRadius(atom) {
  const element = atom.element;
  if (element) {
    return element.radiusBonding;
  } else {
    throw new Error('_getBondingRadius: Logic error.');
  }
}

/**
 * Returns value, limited in given range (min, max)
 * @param {number} val modified value
 * @param {number} valMin minimum value in range
 * @param {number} valMax maximum value in range
 * @returns {number} original value (if it lie inside range) or range bound (left or right)
 */
function _clamp(val, valMin, valMax) {
  if (val < valMin) {
    return valMin;
  }
  if (val > valMax) {
    return valMax;
  }
  return val;
}

function _isAtomEligible(atom) {
  // build for all non-hetatm and for hetatm without bonds
  return !atom.isHet() || (atom._bonds && atom._bonds.length === 0);
}

function _isAtomEligibleWithWaterBondingHack(atom) {
  // TODO: remove this hack (requested by customer)
  var noHack = atom._residue._type._name !== 'HOH';
  return noHack && !atom.isHet();
}

/**
 * Bond between atoms.
 *
 * @param {Complex} complex molecular complex

 * @exports AutoBond
 * @constructor
 */
function AutoBond(complex) {
  this._complex = complex;
  this._maxRad = 1.8;
  var bBox = this._complex.getDefaultBoundaries().boundingBox;
  this._vBoxMin = bBox.min.clone();
  this._vBoxMax = bBox.max.clone();

  this._pairCollection = null;
}

/**
 * Add existing pairs of connectors (from pdb file after its reading)
 * @returns {number} 0
 */
AutoBond.prototype._addExistingPairs = function() {
  var atoms = this._complex.getAtoms();
  var numAtoms = atoms.length;
  var aInd = 0;
  var collection = this._pairCollection;

  for (; aInd < numAtoms; aInd++) {
    var bonds = atoms[aInd]._bonds;
    var numBondsForAtom = bonds.length;
    for (var bInd = 0; bInd < numBondsForAtom; bInd++) {
      var bond = bonds[bInd];
      var indTo = bond._left._index;
      if (indTo === aInd) {
        collection.addPair(aInd, bond._right._index);
      }
    }   // for (b) all bonds in atom
  } // for (a)
  return 0;
};

AutoBond.prototype._findPairs = function(volMap) {
  var atoms = this._complex._atoms;
  var atomsNum = atoms.length;
  var vBoxMin = this._vBoxMin;
  var xB = this.xB;
  var yB = this.yB;
  var zB = this.zB;
  var invPairDist = this.invPairDist;
  var xyTotalBoxes = yB * xB;
  var isAtomEligible = this.isAtomEligible;

  for (var i = 0; i < atomsNum; ++i) {
    var atom = atoms[i];
    if (!isAtomEligible(atom)) {
      continue;
    }

    var rA = atom.element.radiusBonding;
    // 'H' == 72
    var isHydrogenA = atom.isHydrogen();
    var locationA = atom.getLocation();

    var posA = atom._position;
    var axB = ((posA.x - vBoxMin.x) * invPairDist) | 0;
    var ayB = ((posA.y - vBoxMin.y) * invPairDist) | 0;
    var azB = ((posA.z - vBoxMin.z) * invPairDist) | 0;

    for (var dz = -1; dz <= 1; ++dz) {
      var zInd = azB + dz;
      if (zInd < 0 || zInd >= zB) {
        continue;
      }
      for (var dy = -1; dy <= 1; ++dy) {
        var yInd = ayB + dy;
        if (yInd < 0 || yInd >= yB) {
          continue;
        }
        for (var dx = -1; dx <= 1; ++dx) {
          var xInd = axB + dx;
          if (xInd < 0 || xInd >= xB) {
            continue;
          }
          var iIndex = zInd * xyTotalBoxes + yInd * xB + xInd;
          var neighbours = volMap[iIndex];
          for (var j = 0; j < neighbours.length; ++j) {
            var iB = neighbours[j];
            if (iB <= i) {
              continue;
            }
            var atomB = atoms[iB];
            if (isHydrogenA && atomB.isHydrogen()) {
              continue;
            }

            var locationB = atomB.getLocation();
            if ((locationA !== cSpaceCode) &&
                (locationB !== cSpaceCode) &&
                (locationA !== locationB)) {
              continue;
            }
            var dist2 = posA.distanceToSquared(atomB._position);
            var rB = atomB.element.radiusBonding;
            var maxAcceptable = cBondRadInJMOL ? rA + rB + cBondTolerance : cVMDTolerance * (rA + rB);
            if (dist2 > (maxAcceptable * maxAcceptable)) {
              continue;
            }

            if (dist2 < cEpsilon) {
              continue;
            }

            this._pairCollection.addPair(i, iB);
          }
        }
      }
    }
  }
};

AutoBond.prototype._addPairs = function() {
  var atoms = this._complex._atoms;

  for (var i = 0, k = 0; i < this._pairCollection.numPairs; i++, k += 4) {
    var iA = this._pairCollection.intBuffer[k];
    var iB = this._pairCollection.intBuffer[k + 1];
    this._addPair(atoms[iA], atoms[iB]);
  }
};

AutoBond.prototype._addPair = function(atomA, atomB) {
  var bondsA = atomA._bonds;
  var indexA = atomA._index;
  var indexB = atomB._index;
  for (var j = 0, numBonds = bondsA.length; j < numBonds; ++j) {
    var bond = bondsA[j];
    if (bond._left._index === indexB || bond._right._index === indexB) {
      return;
    }
  }
  var left = indexA < indexB ? atomA : atomB;
  var right = indexA < indexB ? atomB : atomA;
  var newBond = this._complex.addBond(left, right, 0, Bond.BondType.UNKNOWN, false);
  bondsA.push(newBond);
  atomB.getBonds().push(newBond);
};

// TODO: remove this hack (requested by customer)
function _waterBondingHack(complex) {
  var t = Bond.BondType.UNKNOWN;
  var residues = complex._residues;
  for (var i = 0, n = residues.length; i < n; i++) {
    var residue = residues[i];
    if (residue._type._name === 'HOH') {
      var atoms = residue._atoms;
      var a0 = atoms[0];
      var a1 = atoms[1];
      var a2 = atoms[2];
      if (!a1 || !a2) {
        continue;
      }
      var b1 = complex.addBond(a0, a1, 0, t, true);
      var b2 = complex.addBond(a0, a2, 0, t, true);
      a0._bonds[0] = b1;
      a0._bonds[1] = b2;
      a1._bonds[0] = b1;
      a2._bonds[0] = b2;
    }
  }
}

AutoBond.prototype.build = function() {
  if (cProfileBondBuilder) {
    console.time('Bonds Builder');
  }
  // TODO verify that complex is ready
  this._buildInner();

  // TODO: remove this hack (requested by customer)
  if (settings.now.draft.waterBondingHack && this._complex) {
    _waterBondingHack(this._complex);
  }

  if (cProfileBondBuilder) {
    console.timeEnd('Bonds Builder');
  }
};

AutoBond.prototype._buildInner = function() {
  var atoms = this._complex._atoms;
  if (atoms.length < 2) {
    return;
  }
  if (atoms[0]._index < 0) {
    throw new Error('AutoBond: Atoms in complex were not indexed.');
  }

  this.isAtomEligible = settings.now.draft.waterBondingHack ? _isAtomEligibleWithWaterBondingHack : _isAtomEligible;

  this._calcBoundingBox();
  var volMap = this._buildGridMap();
  this._pairCollection = new AtomPairs(atoms.length * cEstBondsMultiplier);
  this._addExistingPairs();
  this._findPairs(volMap);
  this._addPairs();
};

AutoBond.prototype._calcBoundingBox = function() {
  var atoms = this._complex._atoms;
  var nAtoms = atoms.length;
  var maxRad = _getBondingRadius(atoms[0]);
  for (var i = 1; i < nAtoms; ++i) {
    maxRad = Math.max(maxRad, _getBondingRadius(atoms[i]));
  }
  this._vBoxMax.addScalar(maxRad);
  this._vBoxMin.addScalar(-maxRad);
  this._maxRad = maxRad * 1.2;
};

AutoBond.prototype._buildGridMap = function() {
  var cMaxBoxes = 125000;
  var cRadMultiplier = 1.26;

  var pairDist = this._maxRad * 2;
  var newPairDist = pairDist;
  var vBoxMin = this._vBoxMin;
  var vBoxMax = this._vBoxMax;
  var xRange = vBoxMax.x - vBoxMin.x;
  var yRange = vBoxMax.y - vBoxMin.y;
  var zRange = vBoxMax.z - vBoxMin.z;
  var xB, yB, zB, xyTotalBoxes;
  var invPairDist;
  var totalBoxes;

  do {
    pairDist = newPairDist;
    invPairDist = 1.0 / pairDist;
    xB = ((xRange * invPairDist) | 0) + 1;
    yB = ((yRange * invPairDist) | 0) + 1;
    zB = ((zRange * invPairDist) | 0) + 1;
    xyTotalBoxes = yB * xB;
    totalBoxes = xyTotalBoxes * zB;
    newPairDist = pairDist * cRadMultiplier;
  } while (totalBoxes > cMaxBoxes);
  this.xB = xB;
  this.yB = yB;
  this.zB = zB;
  this.invPairDist = invPairDist;


  var voxMap = [];
  var i = 0;
  for (; i < totalBoxes; ++i) {
    voxMap[i] = [];
  }
  var atoms = this._complex._atoms;
  var nAtoms = atoms.length;
  var isAtomEligible = this.isAtomEligible;
  for (i = 0; i < nAtoms; ++i) {
    if (!isAtomEligible(atoms[i])) {
      continue;
    }
    var pos = atoms[i]._position;
    var axB = _clamp(((pos.x - vBoxMin.x) * invPairDist) | 0, 0, xB);
    var ayB = _clamp(((pos.y - vBoxMin.y) * invPairDist) | 0, 0, yB);
    var azB = _clamp(((pos.z - vBoxMin.z) * invPairDist) | 0, 0, zB);

    var iIndex = azB * xyTotalBoxes + ayB * xB + axB;
    voxMap[iIndex].push(i);
  }

  return voxMap;
};

AutoBond.prototype.destroy = function() {
  if (this._pairCollection) {
    this._pairCollection.destroy();
  }
};


export default AutoBond;

