import Colorer from './Colorer';
import Atom from '../../chem/Atom';

function scaleColor(c, factor) {
  const r1 = (c >> 16) & 0xff;
  const g1 = (c >> 8) & 0xff;
  const b1 = c & 0xff;
  const r = factor * r1;
  const g = factor * g1;
  const b = factor * b1;
  return (r << 16) | (g << 8) | b;
}

/**
 * Create new colorer.
 *
 * @param {object=} opts - Options to override defaults with. See {@link Colorer}.
 *
 * @exports CarbonColorer
 * @augments Colorer
 * @constructor
 * @classdesc Bicolor coloring algorithm based on selection carbon atoms.
 */
class CarbonColorer extends Colorer {
  static id = 'CB';

  getAtomColor(atom, _complex) {
    const colorCarbon = this.opts.color;
    const colorNotCarbon = scaleColor(colorCarbon, this.opts.factor);
    return (atom.flags & Atom.Flags.CARBON) ? colorCarbon : colorNotCarbon;
  }

  getResidueColor(_residue, _complex) {
    return this.opts.color;
  }
}

CarbonColorer.prototype.id = 'CB';
CarbonColorer.prototype.name = 'Carbon';
CarbonColorer.prototype.shortName = 'Carbon';

export default CarbonColorer;
