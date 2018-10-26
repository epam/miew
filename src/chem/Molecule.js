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
    this._complex = complex;
    this._name = name || '';
    this._residues = [];
    this._mask = 1 | 0;
    this._index = index || -1; // start with 1
  }

  getComplex() {
    return this._complex;
  }

  getName() {
    return this._name;
  }

  getResidues() {
    return this._residues;
  }

  getIndex() {
    return this._index;
  }

  forEachResidue(process) {
    const residues = this._residues;
    for (let i = 0, n = residues.length; i < n; ++i) {
      process(residues[i]);
    }
  }

  collectMask() {
    let mask = 0xffffffff;
    const residues = this._residues;
    for (let i = 0, n = residues.length; i < n; ++i) {
      mask &= residues[i]._mask;
    }
    this._mask = mask;
  }
}

export default Molecule;

