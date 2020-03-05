import Colorer from './Colorer';

class SequenceColorer extends Colorer {
  static id = 'SQ';

  getAtomColor(atom, complex) {
    return this.getResidueColor(atom.residue, complex);
  }

  getResidueColor(residue, _complex) {
    const chain = residue._chain;
    if (chain.minSequence === Number.POSITIVE_INFINITY && chain.maxSequence === Number.NEGATIVE_INFINITY) {
      return this.palette.defaultNamedColor;
    }
    const min = chain.minSequence;
    const max = chain.maxSequence > min ? chain.maxSequence : min + 1;
    return this.palette.getGradientColor((residue._sequence - min) / (max - min), this.opts.gradient);
  }
}

SequenceColorer.prototype.id = 'SQ';
SequenceColorer.prototype.name = 'Sequence';
SequenceColorer.prototype.shortName = 'Sequence';

export default SequenceColorer;
