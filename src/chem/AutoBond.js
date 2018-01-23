

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

AutoBond.prototype._findPairs = function() {
  let vw = this._complex.getVoxelWorld();
  if (vw === null) {
    return;
  }

  let atoms = this._complex._atoms;
  let atomsNum = atoms.length;
  let isAtomEligible = this.isAtomEligible;
  let self = this;

  let rA;
  let isHydrogenA;
  let posA;
  let locationA;
  let atomA;

  let processAtom = function(atomB) {
    if (isHydrogenA && atomB.isHydrogen()) {
      return;
    }

    let locationB = atomB.getLocation();
    if ((locationA !== cSpaceCode) &&
        (locationB !== cSpaceCode) &&
        (locationA !== locationB)) {
      return;
    }

    let dist2 = posA.distanceToSquared(atomB._position);
    let rB = atomB.element.radiusBonding;
    let maxAcceptable = cBondRadInJMOL ? rA + rB + cBondTolerance : cVMDTolerance * (rA + rB);

    if (dist2 > (maxAcceptable * maxAcceptable)) {
      return;
    }

    if (dist2 < cEpsilon) {
      return;
    }

    self._pairCollection.addPair(atomA._index, atomB._index);
  };

  for (let i = 0; i < atomsNum; ++i) {
    atomA = atoms[i];
    if (!isAtomEligible(atomA)) {
      continue;
    }

    rA = atomA.element.radiusBonding;
    isHydrogenA = atomA.isHydrogen();
    posA = atomA._position;
    locationA = atomA.getLocation();

    vw.forEachAtomWithinRadius(posA, 2 * this._maxRad + cBondTolerance, processAtom);
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
  this._pairCollection = new AtomPairs(atoms.length * cEstBondsMultiplier);
  this._addExistingPairs();
  this._findPairs();
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

AutoBond.prototype.destroy = function() {
  if (this._pairCollection) {
    this._pairCollection.destroy();
  }
};

export default AutoBond;
