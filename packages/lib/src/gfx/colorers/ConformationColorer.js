import Colorer from './Colorer';

class ConformationColorer extends Colorer {
  static id = 'CF';

  getAtomColor(atom, _complex) {
    return this.palette.getChainColor(String.fromCharCode(atom.location));
  }

  getResidueColor(_residue, _complex) {
    return this.palette.defaultResidueColor;
  }
}

ConformationColorer.prototype.id = 'CF';
ConformationColorer.prototype.name = 'Conformation';
ConformationColorer.prototype.shortName = 'Conformation';

export default ConformationColorer;
