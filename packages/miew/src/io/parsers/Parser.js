import CancellationError from '../CancellationError';
import makeContextDependent from '../../utils/makeContextDependent';

export default class Parser {
  constructor(data, options) {
    this._data = data;
    this._options = options || {};
    this._abort = false;
  }

  parseSync() {
    throw new Error('Parsing this type of data is not implemented');
  }

  parse() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (this._abort) {
            return reject(new CancellationError('Parsing aborted'));
          }
          return resolve(this.parseSync());
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  // only for volume Parsers
  getModel() {
    this.model._parseHeader(this._data);
    return this.model;
  }

  /**
   * Resolve the effective `autoBonding` mode for this parse, taking into account
   * (in order of precedence) a per-load override (`opts.autoBonding` passed to {@link Miew#load})
   * and the global `autoBonding` setting.
   * @returns {string} the effective mode ('default'|'disable'|'force'|'nohetatm').
   */
  _resolveAutoBondingMode() {
    return this._options.autoBonding !== undefined
      ? this._options.autoBonding
      : this.settings.now.autoBonding;
  }

  /**
   * Resolve whether auto-bonding should be performed for this parse, taking into account
   * (in order of precedence) a per-load override (`opts.autoBonding` passed to {@link Miew#load}),
   * the global `autoBonding` setting, and finally the format's own default behavior.
   * @param {boolean} formatDefault - Whether this format reconstructs bonds by default.
   * @returns {boolean} true if bonds should be automatically reconstructed.
   */
  resolveAutoBonding(formatDefault) {
    const mode = this._resolveAutoBondingMode();
    if (mode === 'force') {
      return true;
    }
    if (mode === 'disable') {
      return false;
    }
    return formatDefault;
  }

  /**
   * Resolve whether HETATM atoms should be excluded from auto-bonding, taking into account
   * (in order of precedence) a per-load override (`opts.autoBonding` passed to {@link Miew#load})
   * and the global `autoBonding` setting.
   * @returns {boolean} true if HETATM atoms should be excluded from auto-bonding.
   */
  excludeHetatmFromAutoBonding() {
    return this._resolveAutoBondingMode() === 'nohetatm';
  }

  abort() {
    this._abort = true;
  }
}

makeContextDependent(Parser.prototype);
