import Colorer from './Colorer';

class HydrophobicityColorer extends Colorer {
  static id = 'HY';

  getAtomColor(atom, complex) {
    return this.getResidueColor(atom.residue, complex);
  }

  getResidueColor(residue, _complex) {
    let color = this.palette.defaultResidueColor;
    if (residue._type.hydrophobicity !== undefined) {
      // Kyte Doolitle hydro [-4.5,4.5]->[0.1]
      const min = -4.5;
      const max = 4.5;
      color = this.palette.getGradientColor((residue._type.hydrophobicity - min) / (max - min), this.opts.gradient);
    }
    return color;
  }
}

HydrophobicityColorer.prototype.id = 'HY';
HydrophobicityColorer.prototype.name = 'Hydrophobicity';
HydrophobicityColorer.prototype.shortName = 'Hydrophobicity';

export default HydrophobicityColorer;
