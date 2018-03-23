

import utils from '../../utils';
import Colorer from './Colorer';

/**
 * Create new colorer.
 *
 * @param {object=} opts - Options to override defaults with. See {@link Colorer}.
 *
 * @see Temperature
 *
 * @exports TemperatureColorer
 * @augments Colorer
 * @constructor
 * @classdesc Coloring algorithm based on temperature of chemical element.
 */
function TemperatureColorer(opts) {
  Colorer.call(this, opts);
}

utils.deriveClass(TemperatureColorer, Colorer, {
  id: 'TM', // [T]e[M]perature
  name: 'Temperature',
  shortName: 'Temperature',
});

TemperatureColorer.prototype.getAtomColor = function(atom, _complex) {
  const opts = this.opts;
  let factor = 1;
  if (atom._temperature && opts) {
    if (opts.min === opts.max) {
      factor = atom._temperature > opts.max ? 1 : 0;
    } else {
      factor = (atom._temperature - opts.min) / (opts.max - opts.min);
    }
    return this.palette.getGradientColor(factor, opts.gradient);
  }
  return this.palette.defaultGradientColor;
};

TemperatureColorer.prototype.getResidueColor = function(residue, _complex) {
  const opts = this.opts;
  if (!opts) {
    return this.palette.defaultGradientColor;
  }
  if (residue.temperature) {
    let factor = 0;
    if (opts.min === opts.max) {
      factor = residue.temperature > opts.max ? 1 : 0;
    } else {
      factor = (residue.temperature - opts.min) / (opts.max - opts.min);
    }
    return this.palette.getGradientColor(factor, opts.gradient);
  }
  return this.palette.defaultGradientColor;
};

export default TemperatureColorer;

