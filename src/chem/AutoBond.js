import AtomPairs from './AtomPairs';
import Bond from './Bond';

const cProfileBondBuilder = false;
const cEstBondsMultiplier = 4;
const cSpaceCode = 32;
const cBondTolerance = 0.45;
const cVMDTolerance = 0.6;
const cBondRadInJMOL = true;
const cEpsilon = 0.001;

/**
 * Get radius used for building bonds.
 *
 * @param {Atom} atom - Atom object.
 * @returns {number} special value for bonding radius for this atom
 */
function _getBondingRadius(atom) {
  const { element } = atom;
  if (element) {
    return element.radiusBonding;
  }
  throw new Error('_getBondingRadius: Logic error.');
}

function _isAtomEligible(atom) {
  // build for all non-hetatm and for hetatm without bonds
  return !atom.isHet() || (atom._bonds && atom._bonds.length === 0);
}

/**
 * Bond between atoms.
 *
 * @param {Complex} complex molecular complex

 * @exports AutoBond
 * @constructor
 */
class AutoBond {
  constructor(complex) {
    this._complex = complex;
    this._maxRad = 1.8;
    const bBox = this._complex.getDefaultBoundaries().boundingBox;
    this._vBoxMin = bBox.min.clone();
    this._vBoxMax = bBox.max.clone();

    this._pairCollection = null;
  }

  /**
   * Add existing pairs of connectors (from pdb file after its reading)
   * @returns {number} 0
   */
  _addExistingPairs() {
    const atoms = this._complex.getAtoms();
    const numAtoms = atoms.length;
    let aInd = 0;
    const collection = this._pairCollection;

    for (; aInd < numAtoms; aInd++) {
      const bonds = atoms[aInd]._bonds;
      const numBondsForAtom = bonds.length;
      for (let bInd = 0; bInd < numBondsForAtom; bInd++) {
        const bond = bonds[bInd];
        const indTo = bond._left._index;
        if (indTo === aInd) {
          collection.addPair(aInd, bond._right._index);
        }
      } // for (b) all bonds in atom
    } // for (a)
    return 0;
  }

  _findPairs() {
    const vw = this._complex.getVoxelWorld();
    if (vw === null) {
      return;
    }

    const atoms = this._complex._atoms;
    const atomsNum = atoms.length;
    const self = this;

    let rA;
    let isHydrogenA;
    let posA;
    let locationA;
    let atomA;

    const processAtom = function (atomB) {
      if (isHydrogenA && atomB.isHydrogen()) {
        return;
      }

      const locationB = atomB.getLocation();
      if ((locationA !== cSpaceCode)
        && (locationB !== cSpaceCode)
        && (locationA !== locationB)) {
        return;
      }

      const dist2 = posA.distanceToSquared(atomB._position);
      const rB = atomB.element.radiusBonding;
      const maxAcceptable = cBondRadInJMOL ? rA + rB + cBondTolerance : cVMDTolerance * (rA + rB);

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
      if (!_isAtomEligible(atomA)) {
        continue;
      }

      rA = atomA.element.radiusBonding;
      isHydrogenA = atomA.isHydrogen();
      posA = atomA._position;
      locationA = atomA.getLocation();

      vw.forEachAtomWithinRadius(posA, 2 * this._maxRad + cBondTolerance, processAtom);
    }
  }

  _addPairs() {
    const atoms = this._complex._atoms;

    for (let i = 0, k = 0; i < this._pairCollection.numPairs; i++, k += 4) {
      const iA = this._pairCollection.intBuffer[k];
      const iB = this._pairCollection.intBuffer[k + 1];
      this._addPair(atoms[iA], atoms[iB]);
    }
  }

  _addPair(atomA, atomB) {
    const bondsA = atomA._bonds;
    const indexA = atomA._index;
    const indexB = atomB._index;
    for (let j = 0, numBonds = bondsA.length; j < numBonds; ++j) {
      const bond = bondsA[j];
      if (bond._left._index === indexB || bond._right._index === indexB) {
        return;
      }
    }
    const left = indexA < indexB ? atomA : atomB;
    const right = indexA < indexB ? atomB : atomA;
    const newBond = this._complex.addBond(left, right, 0, Bond.BondType.UNKNOWN, false);
    bondsA.push(newBond);
    atomB.getBonds().push(newBond);
  }

  build() {
    if (cProfileBondBuilder) {
      console.time('Bonds Builder');
    }
    this._buildInner();

    if (cProfileBondBuilder) {
      console.timeEnd('Bonds Builder');
    }
  }

  _buildInner() {
    const atoms = this._complex._atoms;
    if (atoms.length < 2) {
      return;
    }
    if (atoms[0]._index < 0) {
      throw new Error('AutoBond: Atoms in complex were not indexed.');
    }

    this._calcBoundingBox();
    this._pairCollection = new AtomPairs(atoms.length * cEstBondsMultiplier);
    this._addExistingPairs();
    this._findPairs();
    this._addPairs();
  }

  _calcBoundingBox() {
    const atoms = this._complex._atoms;
    const nAtoms = atoms.length;
    let maxRad = _getBondingRadius(atoms[0]);
    for (let i = 1; i < nAtoms; ++i) {
      maxRad = Math.max(maxRad, _getBondingRadius(atoms[i]));
    }
    this._vBoxMax.addScalar(maxRad);
    this._vBoxMin.addScalar(-maxRad);
    this._maxRad = maxRad * 1.2;
  }

  destroy() {
    if (this._pairCollection) {
      this._pairCollection.destroy();
    }
  }
}

export default AutoBond;
