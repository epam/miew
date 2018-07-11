import ResidueProcessor from './ResiduesProcessor';

class NucleicProcessor extends ResidueProcessor {
  constructor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
    super(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material);
  }

  _checkResidue(residue, mask) {
    return mask & residue._mask && residue._cylinders !== null;
  }
}
export default NucleicProcessor;
