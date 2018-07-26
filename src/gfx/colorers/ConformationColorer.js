import Colorer from './Colorer';

class ConformationColorer extends Colorer {
  static id = 'CF';

  constructor(opts) {
    super(opts);
  }

  getAtomColor(atom, _complex) {
    return this.palette.getChainColor(String.fromCharCode(atom._location));
  }

  getResidueColor(_residue, _complex) {
    return this.palette.defaultResidueColor;
  }
}

ConformationColorer.prototype.id = 'CF';
ConformationColorer.prototype.name = 'Conformation';
ConformationColorer.prototype.shortName = 'Conformation';

export default ConformationColorer;
