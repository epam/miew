

/**
 * Colorer list.
 * @module gfx/colorers
 */
import _ from 'lodash';
import settings from '../settings';
import _EL from './colorers/ElementColorer';
import _RT from './colorers/ResidueTypeColorer';
import _SQ from './colorers/SequenceColorer';
import _CH from './colorers/ChainColorer';
import _SS from './colorers/SecondaryStructureColorer';
import _UN from './colorers/UniformColorer';
import _CO from './colorers/ConditionalColorer';
import _CF from './colorers/ConformationColorer';
import _TM from './colorers/TemperatureColorer';
import _OC from './colorers/OccupancyColorer';
import _HY from './colorers/HydrophobicityColorer';
import _MO from './colorers/MoleculeColorer'; // FIXME: deps for amdclean

var colorerList = [];
var colorerDict = {};
var ag = [_EL, _RT, _SQ, _CH, _SS, _UN, _CO, _CF, _TM, _OC, _HY, _MO];

(function(plugins) {
  for (var i = 0, n = plugins.length; i < n; ++i) {
    var Colorer = plugins[i];
    colorerList.push(Colorer);
    if (Colorer.prototype.id) {
      colorerDict[Colorer.prototype.id] = Colorer;
    }
    var aliases = Colorer.prototype.aliases;
    if (Array.isArray(aliases)) {
      for (var j = 0, m = aliases.length; j < m; ++j) {
        colorerDict[aliases[j]] = Colorer;
      }
    }
  }
})(ag);

// NOTE: workaround for https://github.com/gfranko/amdclean/issues/115
var exports = /** @alias module:gfx/colorers */ {
  /**
   *  The list of colorer constructor functions available.
   *  @type {Function[]}
   */
  list: colorerList,

  /**
   * The list of colorer descriptions.
   * @type {Array<{id:string, name:string}>}
   */
  descriptions: _.map(colorerList, (m) => _.pick(m.prototype, ['id', 'name'])),

  /**
   * The colorer constructor one can use if he doesn't care (the default one).
   * @type {Function}
   */
  any: colorerDict[settings.now.presets.default[0].colorer] || colorerList[0],

  /**
   * Get colorer constructor function by id.
   * @param {string} name - Colorer identifier.
   * @returns {Function} Constructor for the specified colorer.
   * @see {@link module:gfx/colorers.create|colorers.create}
   *
   * @example
   * var Colorer = colorers.get('EL'); // get coloring by element
   * m = new Colorer();
   */
  get: function(name) {
    return colorerDict[name];
  },

  /**
   * Create a colorer instance.
   * @param {string|Array} colorer - Colorer identifier or two-element array containing both colorer identifier
   *   and options.
   * @param {object=} opts - Colorer options object overriding defaults.
   * @returns {object} New colorer object.
   *
   * @example
   * c = create('UN');                      // create Unified colorer
   * c = create('UN', {color: 0x00FF00});   // override unified color
   * c = create(['UN', {color: 0x00FF00}]); // pass an array (e.g. received from deserializing the colorer settings)
   */
  create: function(colorer, opts) {
    if (!opts && colorer instanceof Array) {
      opts = colorer[1];
      colorer = colorer[0];
    }
    var Colorer = this.get(colorer) || this.any;
    return new Colorer(opts);
  },
};

export default exports;

