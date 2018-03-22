

import utils from '../../utils';
import Colorer from './Colorer';
import chem from '../../chem';

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

OccupancyColorer.prototype.getResidueColor = function(_residue, _complex) {
  const opts = this.opts;
  if (!opts) {
    return this.palette.defaultGradientColor;
  }
  // get temperature from CA atom for residue color definition
  let occupancyCA = -1;
  _residue.forEachAtom(function(a) {
    if (a._occupancy && a._role === chem.Element.Constants.Lead) {
      occupancyCA = a._occupancy;
    }
  });
  if (occupancyCA > 0) {
    const factor = 1 - occupancyCA;
    return this.palette.getGradientColor(factor, opts.gradient);
  }
  // no CA atom?
  return this.palette.defaultGradientColor;
};

export default OccupancyColorer;

