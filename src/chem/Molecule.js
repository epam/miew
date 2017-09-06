

//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////

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
function Molecule(complex, name, index) {
  this._complex = complex;
  this._name = name || '';
  this._residues = [];
  this._mask = 1 | 0;
  this._index = index || -1; // start with 1
}

Molecule.prototype.getComplex = function() {
  return this._complex;
};

Molecule.prototype.getName = function() {
  return this._name;
};

Molecule.prototype.getResidues = function() {
  return this._residues;
};

Molecule.prototype.getIndex = function() {
  return this._index;
};

Molecule.prototype.forEachResidue = function(process) {
  var residues = this._residues;
  for (var i = 0, n = residues.length; i < n; ++i) {
    process(residues[i]);
  }
};

Molecule.prototype.collectMask = function() {
  var mask = 0xffffffff;
  var residues = this._residues;
  for (var i = 0, n = residues.length; i < n; ++i) {
    mask &= residues[i]._mask;
  }
  this._mask = mask;
};

export default Molecule;

