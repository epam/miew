import Colorer from './Colorer';

class MoleculeColorer extends Colorer {
  static id = 'MO';

  getAtomColor(atom, complex) {
    return this.getResidueColor(atom.residue, complex);
  }

  getResidueColor(residue, _complex) {
    const molecule = residue._molecule;
    const count = _complex.getMoleculeCount();
    if (count > 1) {
      return this.palette.getGradientColor((molecule.index - 1) / (count - 1), this.opts.gradient);
    }
    return this.palette.getGradientColor(0, this.opts.gradient);
  }
}

MoleculeColorer.prototype.id = 'MO';
MoleculeColorer.prototype.name = 'Molecule';
MoleculeColorer.prototype.shortName = 'Molecule';

export default MoleculeColorer;
