

import ResidueProcessor from './ResiduesProcessor';

function NucleicProcessor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
  ResidueProcessor.call(this, AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material);
}

NucleicProcessor.prototype = Object.create(ResidueProcessor.prototype);
NucleicProcessor.prototype.constructor = NucleicProcessor;

NucleicProcessor.prototype._checkResidue = function(residue, mask) {
  return mask & residue._mask && residue._cylinders !== null;
};

export default NucleicProcessor;

