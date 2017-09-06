

import utils from '../../utils';
import Colorer from './Colorer';

function MoleculeColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(MoleculeColorer, Colorer, {
  id: 'MO',
  name: 'Molecule',
  shortName: 'Molecule',
});

MoleculeColorer.prototype.getAtomColor = function(atom, complex) {
  return this.getResidueColor(atom._residue, complex);
};

MoleculeColorer.prototype.getResidueColor = function(residue, _complex) {
  var molecule = residue._molecule;
  var count = _complex.getMoleculeCount();
  if (count > 1) {
    return this.palette.getGradientColor((molecule._index - 1) / (count - 1), this.opts.gradient);
  }
  return this.palette.getGradientColor(0, this.opts.gradient);
};

export default MoleculeColorer;

