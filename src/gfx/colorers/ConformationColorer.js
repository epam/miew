

import utils from '../../utils';
import Colorer from './Colorer';

function ConformationColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(ConformationColorer, Colorer, {
  id: 'CF', // [C]on[F]ormation
  name: 'Conformation',
  shortName: 'Conformation',
});

ConformationColorer.prototype.getAtomColor = function(atom, _complex) {
  return this.palette.getChainColor(String.fromCharCode(atom._location));
};

ConformationColorer.prototype.getResidueColor = function(_residue, _complex) {
  return this.palette.defaultResidueColor;
};

export default ConformationColorer;

