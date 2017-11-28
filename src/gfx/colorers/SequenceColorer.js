

import utils from '../../utils';
import Colorer from './Colorer';

function SequenceColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(SequenceColorer, Colorer, {
  id: 'SQ',
  aliases: ['RI'], // backward compatibility after renaming [R]esidue [I]d -> [S]e[Q]uence
  name: 'Sequence',
  shortName: 'Sequence',
});

SequenceColorer.prototype.getAtomColor = function(atom, complex) {
  return this.getResidueColor(atom._residue, complex);
};

SequenceColorer.prototype.getResidueColor = function(residue, _complex) {
  const chain = residue._chain;
  if (chain.minSequence === Number.POSITIVE_INFINITY && chain.maxSequence === Number.NEGATIVE_INFINITY) {
    return this.palette.defaultNamedColor;
  }
  const min = chain.minSequence;
  const max = chain.maxSequence > min ? chain.maxSequence : min + 1;
  return this.palette.getGradientColor((residue._sequence - min) / (max - min), this.opts.gradient);
};

export default SequenceColorer;

