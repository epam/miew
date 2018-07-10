import _ from 'lodash';
import settings from '../../settings';
import utils from '../../utils';
import palettes from '../palettes';

/**
 * Create new colorer.
 *
 * @param {object=} opts - Options to override defaults with.
 *
 *   These options are copied locally and not kept by reference, so the created instance will not reflect further
 *   changes to the `opts` object. However, changes in defaults **will** affect the colorer after its creation.
 *
 * @exports Colorer
 * @this Colorer
 * @abstract
 * @constructor
 * @classdesc Basic class for all available coloring algorithms used for building and displaying molecule geometry.
 */
class Colorer {
  constructor(opts) {
    if (this.constructor === Colorer) {
      throw new Error('Can not instantiate abstract class!');
    }
    /**
     * Colorer options inherited (prototyped) from defaults.
     * @type {object}
     */
    this.opts = _.merge(utils.deriveDeep(settings.now.colorers[this.id], true), opts);
    /**
     * Palette in use.
     * @type {Palette}
     */
    this.palette = palettes.first;
  }

  /**
   * Get Colorer identification, probably with options.
   * @returns {string|Array} Colorer identifier string ({@link Colorer#id}) or two-element array containing both colorer
   *   identifier and options ({@link Colorer#opts}).
   * Options are returned if they were changed during or after colorer creation.
   */
  identify() {
    const diff = utils.objectsDiff(this.opts, settings.now.colorers[this.id]);
    if (!_.isEmpty(diff)) {
      return [this.id, diff];
    }
    return this.id;
  }
}

/**
 * Colorer identifier.
 * @type {string}
 */

Colorer.prototype.id = '__';

export default Colorer;
