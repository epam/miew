

import utils from '../../utils';
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
function OccupancyColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(OccupancyColorer, Colorer, {
  id: 'OC', // [OC]cupancy
  name: 'Occupancy',
  shortName: 'Occupancy',
});

OccupancyColorer.prototype.getAtomColor = function(atom, _complex) {
  const opts = this.opts;
  if (atom._occupancy && opts) {
    const factor = 1 - atom._occupancy;
    return this.palette.getGradientColor(factor, opts.gradient);
  }
  return this.palette.defaultGradientColor;
};

OccupancyColorer.prototype.getResidueColor = function(residue, _complex) {
  const opts = this.opts;
  if (!opts) {
    return this.palette.defaultGradientColor;
  }
  if (residue.occupancy > 0) {
    const factor = 1 - residue.occupancy;
    return this.palette.getGradientColor(factor, opts.gradient);
  }
  return this.palette.defaultGradientColor;
};

export default OccupancyColorer;

