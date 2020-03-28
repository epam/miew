import StructuralElement from './StructuralElement';

/**
 * A single strand of a sheet in a protein secondary structure.
 * @extends StructuralElement
 */
class Strand extends StructuralElement {
  /**
   * Create a strand.
   *
   * @param {Sheet} sheet Parent sheet this strand belongs to.
   * @param {Residue} init Initial residue.
   * @param {Residue} term Terminal residue.
   * @param {number} sense Sense of strand with respect to previous strand in the sheet.
   *   - 0 if the first strand,
   *   - 1 if parallel, and
   *   - -1 if anti-parallel.
   * @param {Atom} atomCur Atom in current strand (see PDB Format).
   * @param {Atom} atomPrev Atom in previous strand (see PDB Format).
   */
  constructor(sheet, init, term, sense, atomCur, atomPrev) {
    super(StructuralElement.Type.STRAND, init, term);

    /**
     * Parent sheet this strand belongs to.
     * @type {Sheet}
     */
    this.sheet = sheet;
    /**
     * Sense of strand with respect to previous strand in the sheet.
     * - 0 if the first strand,
     * - 1 if parallel, and
     * - -1 if anti-parallel.
     * @type {number}
     */
    this.sense = sense;
    /**
     * Atom in current strand (see PDB Format).
     * @type {Atom}
     */
    this.atomCur = atomCur;
    /**
     * Atom in previous strand (see PDB Format).
     * @type {Atom}
     */
    this.atomPrev = atomPrev;
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
   *
   * @override
   */
  _finalize(serialAtomMap, residueHash, complex) {
    super._finalize(serialAtomMap, residueHash, complex);

    let as = this.atomCur;
    if (as !== null && !Number.isNaN(as)) {
      this.atomCur = serialAtomMap[as];
    }
    as = this.atomPrev;
    if (as !== null && !Number.isNaN(as)) {
      this.atomPrev = serialAtomMap[as];
    }
  }
}

export default Strand;
