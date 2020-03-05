import Colorer from './Colorer';

/**
 * Create new colorer.
 *
 * @param {object=} opts - Options to override defaults with. See {@link Colorer}.
 *
 * @see Occupancy
 *
 * @exports OccupancyColorer
 * @augments Occupancy
 * @constructor
 * @classdesc Coloring algorithm based on occupancy of chemical element.
 */
class OccupancyColorer extends Colorer {
  static id = 'OC';

  getAtomColor(atom, _complex) {
    const { opts } = this;
    if (atom.occupancy && opts) {
      const factor = 1 - atom.occupancy;
      return this.palette.getGradientColor(factor, opts.gradient);
    }
    return this.palette.defaultGradientColor;
  }

  getResidueColor(residue, _complex) {
    const { opts } = this;
    if (!opts) {
      return this.palette.defaultGradientColor;
    }
    if (residue.occupancy > 0) {
      const factor = 1 - residue.occupancy;
      return this.palette.getGradientColor(factor, opts.gradient);
    }
    return this.palette.defaultGradientColor;
  }
}

OccupancyColorer.prototype.id = 'OC'; // [OC]cupancy
OccupancyColorer.prototype.name = 'Occupancy';
OccupancyColorer.prototype.shortName = 'Occupancy';

export default OccupancyColorer;
