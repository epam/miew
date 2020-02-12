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
class TemperatureColorer extends Colorer {
  static id = 'TM';

  getAtomColor(atom, _complex) {
    const { opts } = this;
    let factor = 1;
    if (atom.temperature && opts) {
      if (opts.min === opts.max) {
        factor = atom.temperature > opts.max ? 1 : 0;
      } else {
        factor = (atom.temperature - opts.min) / (opts.max - opts.min);
      }
      return this.palette.getGradientColor(factor, opts.gradient);
    }
    return this.palette.defaultGradientColor;
  }

  getResidueColor(residue, _complex) {
    const { opts } = this;
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
  }
}

TemperatureColorer.prototype.id = 'TM'; // [T]e[M]perature
TemperatureColorer.prototype.name = 'Temperature';
TemperatureColorer.prototype.shortName = 'Temperature';

export default TemperatureColorer;
