

import utils from '../../utils';
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
function ElementColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(ElementColorer, Colorer, {
  id: 'EL',
  aliases: ['AT'], // backward compatibility after renaming [A]tom [T]ype -> [EL]ement
  name: 'Element',
  shortName: 'Element',
});

ElementColorer.prototype.getAtomColor = function(atom, _complex) {
  var type = atom.element.name;
  if (type === 'C' && this.opts.carbon >= 0) {
    return this.opts.carbon;
  }
  return this.palette.getElementColor(type);
};

ElementColorer.prototype.getResidueColor = function(_residue, _complex) {
  return this.palette.defaultResidueColor;
};

export default ElementColorer;

