

import Colorer from './Colorer';

class UniformColorer extends Colorer {
  constructor(opts) {
    super(opts);
  }

  getAtomColor(_atom, _complex) {
    return this.opts.color;
  }

  getResidueColor(_residue, _complex) {
    return this.opts.color;
  }
}

UniformColorer.id = 'UN';
UniformColorer.prototype.id = 'UN';
UniformColorer.prototype.name = 'Uniform';
UniformColorer.prototype.shortName = 'Uniform';

export default UniformColorer;
