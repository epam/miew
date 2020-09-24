import _ from 'lodash';
import makeContextDependent from '../../utils/makeContextDependent';
import utils from '../../utils';
import gfxutils from '../gfxutils';
import factory from './groups/GroupsFactory';

/**
 * Create new mode.
 *
 * @param {object=} opts - Options to override defaults with.
 *
 *   These options are copied locally and not kept by reference, so the created instance will not reflect further
 *   changes to the `opts` object. However, changes in defaults **will** affect the mode after its creation.
 *
 * @exports Mode
 * @this Mode
 * @abstract
 * @constructor
 * @classdesc Basic class for all available modes used for building and displaying molecule geometry.
 */
class Mode {
  constructor(opts) {
    if (this.constructor === Mode) {
      throw new Error('Can not instantiate abstract class!');
    }
    /**
     * Mode options inherited (prototyped) from defaults.
     * @type {object}
     */
    this.opts = _.merge(utils.deriveDeep(this.settings.now.modes[this.id], true), opts);
  }

  /**
   * Get mode identification, probably with options.
   * @returns {string|Array} Mode identifier string ({@link Mode#id}) or two-element array containing both mode
   *   identifier and options ({@link Mode#opts}).
   * Options are returned if they were changed during or after the mode creation.
   */
  identify() {
    const diff = utils.objectsDiff(this.opts, this.settings.now.modes[this.id]);
    if (!_.isEmpty(diff)) {
      return [this.id, diff];
    }
    return this.id;
  }

  buildGeometry(complex, colorer, mask, material) {
    const polyComplexity = this.opts.polyComplexity ? this.opts.polyComplexity[this.settings.now.resolution] : 0;
    const groupList = this.depGroups;
    const groupCount = groupList.length;
    const group = new gfxutils.RCGroup();
    const self = this;
    for (let i = 0; i < groupCount; ++i) {
      let currGroup = groupList[i];
      let renderParams = {};
      if (_.isArray(currGroup)) {
        renderParams = currGroup[1].call(this);
        [currGroup] = currGroup;
      }
      const Group = factory[currGroup](null, this.settings, renderParams);
      const newGroup = new Group(complex, colorer, self, polyComplexity, mask, material);
      if (newGroup.children.length > 0) {
        group.add(newGroup);
      }
    }
    return group;
  }
}

makeContextDependent(Mode.prototype);

/**
* Mode identifier.
* @type {string}
*/
Mode.prototype.id = '__';

/**
 * Mode geo groups.
 * @type {Array}
 */
Mode.prototype.depGroups = [];

export default Mode;
