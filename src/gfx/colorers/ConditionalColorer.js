

import utils from '../../utils';
import Colorer from './Colorer';
import selectors from '../../chem/selectors';

/**
 * Create new colorer.
 *
 * @param {object=} opts - Options to override defaults with. See {@link Colorer}.
 *
 * @exports ConditionalColorer
 * @augments Colorer
 * @constructor
 * @classdesc Bicolor coloring algorithm based on a selector string used as a condition.
 */
function ConditionalColorer(opts) {
  Colorer.call(this, opts);
  var parsed = selectors.parse(this.opts.subset);
  this._subsetCached = parsed.error ? selectors.none() : parsed.selector;
}

utils.deriveClass(ConditionalColorer, Colorer, {
  id: 'CO',
  name: 'Conditional',
  shortName: 'Conditional',
});

ConditionalColorer.prototype.getAtomColor = function(atom, _complex) {
  return this._subsetCached.includesAtom(atom) ? this.opts.color : this.opts.baseColor;
};

ConditionalColorer.prototype.getResidueColor = function(residue, _complex) {
  var subset = this._subsetCached;
  var includes = true;
  var atoms = residue._atoms;
  for (var i = 0, n = atoms.length; i < n; ++i) {
    includes = includes && subset.includesAtom(atoms[i]);
  }
  return includes ? this.opts.color : this.opts.baseColor;
};

export default ConditionalColorer;

