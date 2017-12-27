

/**
 * Mode list.
 * @module gfx/modes
 */

import _ from 'lodash';
import settings from '../settings';
import _LN from './modes/LinesMode';
import _LC from './modes/LicoriceMode';
import _BS from './modes/BallsAndSticksMode';
import _VW from './modes/VanDerWaalsMode';
import _TR from './modes/TraceMode';
import _TU from './modes/TubeMode';
import _CA from './modes/CartoonMode';
import _QS from './modes/QuickSurfaceMode';
import _SA from './modes/IsoSurfaceSASMode';
import _SE from './modes/IsoSurfaceSESMode';
import _CS from './modes/ContactSurfaceMode';
import _TX from './modes/TextMode';
// FIXME: deps for amdclean

var modeList = [];
var modeDict = {};
var ag = [_LN, _LC, _BS, _VW, _TR, _TU, _CA, _QS, _SA, _SE, _CS, _TX];

(function(plugins) {
  for (var i = 0, n = plugins.length; i < n; ++i) {
    var Mode = plugins[i];
    modeList.push(Mode);
    if (Mode.prototype.id) {
      modeDict[Mode.prototype.id] = Mode;
    }
  }
})(ag);

// NOTE: workaround for https://github.com/gfranko/amdclean/issues/115
var exports = /** @alias module:gfx/modes */ {
  /**
   *  The list of mode constructor functions available.
   *  @type {Array<function(new:Mode)>}
   */
  list: modeList,

  /**
   * The list of mode descriptions.
   * @type {Array<{id:string, name:string}>}
   */
  descriptions: _.map(modeList, (m) => _.pick(m.prototype, ['id', 'name'])),

  /**
   * The mode constructor one can use if he doesn't care (the default one).
   * @type {function(new:Mode)}
   */
  any: modeDict[settings.now.presets.default[0].mode] || modeList[0],

  /**
   * Get mode constructor function by id.
   * @param {string} name - Mode identifier.
   * @returns {function(new:Mode)} Constructor for the specified mode.
   * @see {@link module:gfx/modes.create|modes.create}
   *
   * @example
   * var Mode = modes.get('BS'); // get Balls and Sticks mode
   * m = new Mode();
   */
  get: function(name) {
    return modeDict[name];
  },

  /**
   * Create a mode instance.
   * @param {string|Array} mode - Mode identifier or two-element array containing both mode identifier and options.
   * @param {object=} opts - Mode options object overriding defaults.
   * @returns {Mode} New mode object.
   *
   * @example
   * m = create('BS');                // create Balls and Sticks mode
   * m = create('BS', {atom: 0.1});   // override atom radius
   * m = create(['BS', {atom: 0.1}]); // pass an array (e.g. received from deserializing the mode settings)
   */
  create: function(mode, opts) {
    if (!opts && mode instanceof Array) {
      opts = mode[1];
      mode = mode[0];
    }
    var Mode = this.get(mode) || this.any;
    return new Mode(opts);
  },
};

export default exports;

