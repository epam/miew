

import utils from '../../utils';
import Colorer from './Colorer';
import ResidueType from '../../chem/ResidueType';

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
  if (residue._type.flags & ResidueType.Flags.DNA) {
    return this.palette.getSecondaryColor('dna');
  } else if (residue._type.flags & ResidueType.Flags.RNA) {
    return this.palette.getSecondaryColor('rna');
  }
  const secondary = residue.getSecondary();
  if (secondary) {
    return this.palette.getSecondaryColor(secondary.type, secondary._type);
  }
  return this.palette.getSecondaryColor('');
};

export default SecondaryStructureColorer;

