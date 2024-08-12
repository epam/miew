import ResidueProcessor from './ResiduesProcessor';

class NucleicProcessor extends ResidueProcessor {
  _checkResidue(residue, mask) {
    return mask & residue._mask && residue._cylinders !== null;
  }
}
export default NucleicProcessor;
