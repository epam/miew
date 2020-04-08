import AtomsProcessor from './AtomsProcessor';
import OrphanAtomsProcessor from './OrphanAtomsProcessor';
import ResiduesProcessor from './ResiduesProcessor';
import NucleicProcessor from './NucleicProcessor';
import SubseqsProcessor from './SubseqsProcessor';
import BondsProcessor from './BondsProcessor';
import AromaticProcessor from './AromaticProcessor';

export default {
  Atoms: AtomsProcessor,
  OrphanAtoms: OrphanAtomsProcessor,
  Residues: ResiduesProcessor,
  Nucleic: NucleicProcessor,
  Subseqs: SubseqsProcessor,
  Bonds: BondsProcessor,
  Aromatic: AromaticProcessor,
};
