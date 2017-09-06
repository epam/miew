

import utils from '../../utils';
import Colorer from './Colorer';

function SecondaryStructureColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(SecondaryStructureColorer, Colorer, {
  id: 'SS',
  name: 'Secondary Structure',
  shortName: 'Structure',
});

SecondaryStructureColorer.prototype.getAtomColor = function(atom, complex) {
  return this.getResidueColor(atom._residue, complex);
};

SecondaryStructureColorer.prototype.getResidueColor = function(residue, _complex) {
  var secondary = residue.getSecondary();
  if (secondary) {
    return this.palette.getSecondaryColor(secondary.type, secondary._type);
  }
  return this.palette.getSecondaryColor('');
};

export default SecondaryStructureColorer;

