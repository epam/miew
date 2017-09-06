

import utils from '../../utils';
import Colorer from './Colorer';

function HydrophobicityColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(HydrophobicityColorer, Colorer, {
  id: 'HY',
  name: 'Hydrophobicity',
  shortName: 'Hydrophobicity',
});

HydrophobicityColorer.prototype.getAtomColor = function(atom, complex) {
  return this.getResidueColor(atom._residue, complex);
};

HydrophobicityColorer.prototype.getResidueColor = function(residue, _complex) {
  var color = this.palette.defaultResidueColor;
  if (residue._type.hydrophobicity) {
    //Kyte Doolitle hydro [-4.5,4.5]->[0.1]
    var min = -4.5;
    var max = 4.5;
    color = this.palette.getGradientColor((residue._type.hydrophobicity - min) / (max - min), this.opts.gradient);
  }
  return color;
};

export default HydrophobicityColorer;

