import Colorer from './Colorer';

class ChainColorer extends Colorer {
  static id = 'CH';

  constructor(opts) {
    super(opts);
  }

  getAtomColor(atom, complex) {
    return this.getResidueColor(atom._residue, complex);
  }

  getResidueColor(residue, _complex) {
    return this.palette.getChainColor(residue.getChain()._name);
  }
}

ChainColorer.prototype.id = 'CH';
ChainColorer.prototype.name = 'Chain';
ChainColorer.prototype.shortName = 'Chain';

export default ChainColorer;
