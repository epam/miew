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

  _getColorByOccupancy(occupancy, opts) {
    if (occupancy !== undefined) {
      const factor = 1 - occupancy;
      return this.palette.getGradientColor(factor, opts.gradient);
    }
    return this.palette.defaultGradientColor;
  }

  getAtomColor(atom, _complex) {
    const { opts } = this;
    return this._getColorByOccupancy(atom.occupancy, opts);
  }

  getResidueColor(residue, _complex) {
    const { opts } = this;
    return this._getColorByOccupancy(residue.occupancy, opts);
  }
}

OccupancyColorer.prototype.id = 'OC'; // [OC]cupancy
OccupancyColorer.prototype.name = 'Occupancy';
OccupancyColorer.prototype.shortName = 'Occupancy';

export default OccupancyColorer;
