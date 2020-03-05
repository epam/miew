/**
 * Residue Molecule.
 *
 * @param {Complex} complex - Molecular complex this Molecule belongs to.
 * @param {String} name - Molecule's name.
 * @param {Integer} index - Molecule's index in file.
 *
 * @exports Molecule
 * @constructor
 */
class Molecule {
  constructor(complex, name, index) {
    this.complex = complex;
    this.name = name || '';
    this.residues = [];
    this.mask = 1 | 0;
    this.index = index || -1; // start with 1
  }

  forEachResidue(process) {
    const { residues } = this;
    for (let i = 0, n = residues.length; i < n; ++i) {
      process(residues[i]);
    }
  }

  collectMask() {
    let mask = 0xffffffff;
    const { residues } = this;
    for (let i = 0, n = residues.length; i < n; ++i) {
      mask &= residues[i]._mask;
    }
    this.mask = mask;
  }
}

export default Molecule;
