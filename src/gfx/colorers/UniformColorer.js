

import utils from '../../utils';
import Colorer from './Colorer';

function UniformColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(UniformColorer, Colorer, {
  id: 'UN',
  name: 'Uniform',
  shortName: 'Uniform',
});

UniformColorer.prototype.getAtomColor = function(_atom, _complex) {
  return this.opts.color;
};

UniformColorer.prototype.getResidueColor = function(_residue, _complex) {
  return this.opts.color;
};

export default UniformColorer;

