import Residue from './Residue';

/** An element of protein secondary structure. */
class StructuralElement {
  /**
   * Create a secondary structural element of the specified type.
   *
   * @param {StructuralElement.Type} type Secondary structure type.
   * @param {Residue} init Initial residue.
   * @param {Residue} term Terminal residue.
   */
  constructor(type, init, term) {
    /**
     * Secondary structure type.
     * @type {StructuralElement.Type}
     */
    this.type = type;
    /**
     * Generic secondary structure type.
     * @type {StructuralElement.Generic}
     */
    this.generic = StructuralElement.genericByType[this.type] || 'loop';
    /**
     * Initial residue.
     * @type Residue
     */
    this.init = init;
    /**
     * Terminal residue.
     * @type Residue
     */
    this.term = term;
  }

  /**
   * An internal method for making a final pass over the complex to set all required references.
   *
   * **NOTE:** I'm sorry. It's a legacy code waiting for refactoring.
   * Just copying it as-is right now and hoping for the best.
   *
   * @param {object} serialAtomMap A dictionary of atoms
   * @param {object} residueHash A dictionary of hashed residues to check.
   * @param {Complex} complex The molecular complex this element belongs to.
   */
  _finalize(serialAtomMap, residueHash, complex) {
    if (this.init instanceof Residue && this.term instanceof Residue) {
      return;
    }

    // Link all intermediate residues to this structural element
    const start = complex.splitUnifiedSerial(this.init);
    const end = complex.splitUnifiedSerial(this.term);
    for (let chainId = start.chain; chainId <= end.chain; chainId++) {
      for (let serialId = start.serial; serialId <= end.serial; serialId++) {
        for (let { iCode } = start; iCode <= end.iCode; iCode++) {
          const hashCode = complex.getUnifiedSerial(chainId, serialId, iCode);
          if (residueHash[hashCode]) {
            residueHash[hashCode]._secondary = this;
          }
        }
      }
    }

    // Replace unfined serials by objects
    this.init = residueHash[this.init];
    this.term = residueHash[this.term];
  }
}

/**
 * Specific type of a secondary structural element.
 * @enum {string}
 * @see StructuralElement.Generic
 */
StructuralElement.Type = {
  /** A strand of a [beta-sheet](https://en.wikipedia.org/wiki/Beta_sheet). */
  STRAND: 'E',
  /** An isolated beta-bridge (too small for a beta-sheet). */
  BRIDGE: 'B',

  /** A [3/10 helix](https://en.wikipedia.org/wiki/310_helix) (hydrogen bonding is 3 residues apart). */
  HELIX_310: 'G',
  /** An [alpha-helix](https://en.wikipedia.org/wiki/Alpha_helix) (hydrogen bonding is 4 residues apart). */
  HELIX_ALPHA: 'H',
  /** A [pi-helix](https://en.wikipedia.org/wiki/Pi_helix) (hydrogen bonding is 5 residues apart). */
  HELIX_PI: 'I',
  /** A generic helix of unspecified bonding distance. */
  HELIX: 'X',

  /** An isolated 3/10-like helical turn. */
  TURN_310: '3',
  /** An isolated alpha-like helical turn. */
  TURN_ALPHA: '4',
  /** An isolated pi-like helical turn. */
  TURN_PI: '5',
  /** An isolated helical [turn](https://en.wikipedia.org/wiki/Turn_(biochemistry)) of unspecified bonding distance. */
  TURN: 'T',

  /** A bend (a region of high curvature). */
  BEND: 'S',
  /** Just a protein section with no particular conformation. */
  COIL: 'C',
};

/**
 * Generic type of a secondary structural element.
 * @enum {string}
 * @see StructuralElement.Type
 */
StructuralElement.Generic = {
  /** A strand of a sheet. */
  STRAND: 'strand',
  /** A helix. */
  HELIX: 'helix',
  /** Just a protein section with no particular conformation. */
  LOOP: 'loop',
};

const StructuralElementType = StructuralElement.Type;
const StructuralElementGeneric = StructuralElement.Generic;

/**
 * A mapping from specific types to generic ones.
 * @type {Object<StructuralElement.Type, StructuralElement.Generic>}
 */
StructuralElement.genericByType = {
  [StructuralElementType.STRAND]: StructuralElementGeneric.STRAND,
  [StructuralElementType.HELIX_310]: StructuralElementGeneric.HELIX,
  [StructuralElementType.HELIX_ALPHA]: StructuralElementGeneric.HELIX,
  [StructuralElementType.HELIX_PI]: StructuralElementGeneric.HELIX,
  [StructuralElementType.HELIX]: StructuralElementGeneric.HELIX,
};

export default StructuralElement;
