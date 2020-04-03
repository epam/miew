import Colorer from './Colorer';
import ResidueType from '../../chem/ResidueType';

class SecondaryStructureColorer extends Colorer {
  static id = 'SS';

  getAtomColor(atom, complex) {
    return this.getResidueColor(atom.residue, complex);
  }

  getResidueColor(residue, _complex) {
    if (residue._type.flags & ResidueType.Flags.DNA) {
      return this.palette.getSecondaryColor('dna');
    }
    if (residue._type.flags & ResidueType.Flags.RNA) {
      return this.palette.getSecondaryColor('rna');
    }
    const secondary = residue.getSecondary();
    if (secondary) {
      let color = this.palette.getSecondaryColor(secondary.type, true);
      if (color === undefined) {
        color = this.palette.getSecondaryColor(secondary.generic);
      }
      return color;
    }
    return this.palette.defaultSecondaryColor;
  }
}

SecondaryStructureColorer.prototype.id = 'SS';
SecondaryStructureColorer.prototype.name = 'Secondary Structure';
SecondaryStructureColorer.prototype.shortName = 'Structure';

export default SecondaryStructureColorer;
