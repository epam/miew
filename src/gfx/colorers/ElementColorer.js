import Colorer from './Colorer';

/**
 * Create new colorer.
 *
 * @param {object=} opts - Options to override defaults with. See {@link Colorer}.
 *
 * @see Element
 *
 * @exports ElementColorer
 * @augments Colorer
 * @constructor
 * @classdesc Coloring algorithm based on chemical element.
 */
class ElementColorer extends Colorer {
  static id = 'EL';

  getAtomColor(atom, _complex) {
    const type = atom.element.name;
    if (type === 'C' && this.opts.carbon >= 0) {
      return this.opts.carbon;
    }
    return this.palette.getElementColor(type);
  }

  getResidueColor(_residue, _complex) {
    return this.palette.defaultResidueColor;
  }
}

ElementColorer.prototype.id = 'EL';
ElementColorer.prototype.name = 'Element';
ElementColorer.prototype.shortName = 'Element';

export default ElementColorer;
