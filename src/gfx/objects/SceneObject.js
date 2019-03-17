import _ from 'lodash';
import settings from '../../settings';
import utils from '../../utils';
import gfxutils from '../gfxutils';

/**
 * Create new scene object.
 *
 * @param {array=} params - Object required params.
 * @param {object=} opts - Options to override defaults with.
 *
 *   These options are copied locally and not kept by reference, so the created instance will not reflect further
 *   changes to the `opts` object. However, changes in defaults **will** affect the colorer after its creation.
 *
 * @exports SceneObject
 * @this SceneObject
 * @abstract
 * @constructor
 * @classdesc Basic class for all scene objects that are not reps.
 */
class SceneObject {
  constructor(params, opts) {
    if (this.constructor === SceneObject) {
      throw new Error('Can not instantiate abstract class!');
    }
    /**
     * Object's options inherited (prototyped) from defaults.
     * @type {object}
     */
    this.params = params;
    this.opts = _.merge(utils.deriveDeep(settings.now.objects[this.type], true), opts);
    this.needsRebuild = false;
    this._mesh = null;
    this.id = null;
  }

  /**
   * Get object identification, probably with options.
   *  @returns {Object} field type contains type information, params - object's formal parameters,
   * opts - changed options
   * Options are returned if they were changed during or after object creation.
   */
  identify() {
    const result = {
      type: this.type,
      params: this.params,
    };
    const diff = utils.objectsDiff(this.opts, settings.now.modes[this.id]);
    if (!_.isEmpty(diff)) {
      result.opts = diff;
    }
    return result;
  }

  toString() {
    const paramsStr = `o=${this.type},${this.params.join(',')}`;
    const optsStr = utils.compareOptionsWithDefaults(this.opts, settings.defaults.objects[this.type]);
    return paramsStr + optsStr;
  }

  getGeometry() {
    return this._mesh;
  }

  destroy() {
    if (this._mesh) {
      gfxutils.destroyObject(this._mesh);
    }
  }
}

/**
 * Scene object identifier.
 * @type {string}
 */
SceneObject.prototype.type = '__';

export default SceneObject;
