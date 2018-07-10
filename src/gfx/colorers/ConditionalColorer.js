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
class ConditionalColorer extends Colorer {
  static id = 'CO';

  constructor(opts) {
    super(opts);
    const parsed = selectors.parse(this.opts.subset);
    this._subsetCached = parsed.error ? selectors.none() : parsed.selector;
  }

  getAtomColor(atom, _complex) {
    return this._subsetCached.includesAtom(atom) ? this.opts.color : this.opts.baseColor;
  }

  getResidueColor(residue, _complex) {
    const subset = this._subsetCached;
    let includes = true;
    const atoms = residue._atoms;
    for (let i = 0, n = atoms.length; i < n; ++i) {
      includes = includes && subset.includesAtom(atoms[i]);
    }
    return includes ? this.opts.color : this.opts.baseColor;
  }
}

ConditionalColorer.prototype.id = 'CO';
ConditionalColorer.prototype.name = 'Conditional';
ConditionalColorer.prototype.shortName = 'Conditional';

export default ConditionalColorer;
