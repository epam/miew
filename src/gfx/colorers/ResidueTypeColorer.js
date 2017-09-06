

import utils from '../../utils';
import Colorer from './Colorer';

/**
 * Coloring algorithm based on residue type.
 *
 * @see ResidueType
 *
 * @exports ResidueTypeColorer
 * @constructor
 */
function ResidueTypeColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(ResidueTypeColorer, Colorer, {
  id: 'RT',
  name: 'Residue Type',
  shortName: 'Residue',
});

ResidueTypeColorer.prototype.getAtomColor = function(atom, complex) {
  return this.getResidueColor(atom._residue, complex);
};

ResidueTypeColorer.prototype.getResidueColor = function(residue, _complex) {
  return this.palette.getResidueColor(residue._type._name);
};

export default ResidueTypeColorer;

