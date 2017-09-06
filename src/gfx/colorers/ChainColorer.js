

import utils from '../../utils';
import Colorer from './Colorer';

function ChainColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(ChainColorer, Colorer, {
  id: 'CH',
  name: 'Chain',
  shortName: 'Chain',
});

ChainColorer.prototype.getAtomColor = function(atom, complex) {
  return this.getResidueColor(atom._residue, complex);
};

ChainColorer.prototype.getResidueColor = function(residue, _complex) {
  return this.palette.getChainColor(residue.getChain()._name);
};

export default ChainColorer;

