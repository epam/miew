

import ResidueProcessor from './ResiduesProcessor';

function ComponentNucleicProcessor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
  ResidueProcessor.call(this, AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material);
}

ComponentNucleicProcessor.prototype = Object.create(ResidueProcessor.prototype);
ComponentNucleicProcessor.prototype.constructor = ComponentNucleicProcessor;

ComponentNucleicProcessor.prototype._checkResidue = function(residue, mask) {
  return mask & residue._mask && residue._cylinders !== null;
};

export default ComponentNucleicProcessor;

