import StructuralElement from './StructuralElement';

const StructuralElementType = StructuralElement.Type;

export const typeByPDBHelixClass = {
  1: StructuralElementType.HELIX_ALPHA,
  3: StructuralElementType.HELIX_PI,
  5: StructuralElementType.HELIX_310,
};

/**
 * Helical secondary structure of a protein.
 * @extends StructuralElement
 */
class Helix extends StructuralElement {
  /**
   * Create a helix.
   *
   * @param {number} helixClass A helix class according to the
   *   [PDB Format](http://www.wwpdb.org/documentation/file-format-content/format33/sect5.html#HELIX).
   * @param {Residue} init Initial residue.
   * @param {Residue} term Terminal residue.
   * @param {number} serial Serial number of the helix (see PDB Format).
   * @param {string} name Helix identifier (see PDB Format).
   * @param {string} comment Comment about this helix (see PDB Format).
   * @param {number} length Length of this helix, in residues (see PDB Format).
   */
  constructor(helixClass, init, term, serial, name, comment, length) {
    super(typeByPDBHelixClass[helixClass] || StructuralElement.Type.HELIX, init, term);

    /**
     * Serial number of the helix (see PDB Format).
     * @type {number}
     */
    this.serial = serial;
    /**
     * Helix identifier (see PDB Format).
     * @type {string}
     */
    this.name = name;
    /**
     * Comment about this helix (see PDB Format).
     * @type {string}
     */
    this.comment = comment;
    /**
     * Length of this helix, in residues (see PDB Format).
     * @type {number}
     */
    this.length = length;
  }
}

export default Helix;
