

/**
 * Loaders list.
 * @module io/loaders
 */
import Loader from './loaders/Loader';
import _fl from './loaders/FileLoader';
import _xhr from './loaders/XHRLoader';
import _imm from './loaders/ImmediateLoader';
import _ml from './loaders/MessageLoader';


// FIXME: deps for amdclean

var loaderList = [];
var ag = [_fl, _xhr, _imm, _ml];

(function(plugins) {
  for (var i = 0, n = plugins.length; i < n; ++i) {
    var currLoader = plugins[i];
    loaderList.push(currLoader);
  }
})(ag);

// NOTE: workaround for https://github.com/gfranko/amdclean/issues/115
var exports = /** @alias module:io/loaders */ {
  /**
   *  The list of loader constructor functions available.
   *  @type {Array<function(new:Loader)>}
   */
  list: loaderList,

  Loader: Loader,

  /**
   * Create a loader instance.
   * @param {object} context - Current context.
   * @param {object} source  - Data to be loaded.
   * @param {object} options - Loader options object overriding defaults.
   * @returns {Loader} New loader object.
   */
  create: function(context, source, options) {
    var loader = new Loader(source, options);// this behaviour was copied from the previous version
    var i = 0, n = loaderList.length;
    for (; i < n; ++i) {
      var SomeLoader = loaderList[i];
      if (SomeLoader.canLoad && SomeLoader.canLoad(source, options)) {
        loader = new SomeLoader(source, options);
        break;
      }
    }
    loader.context = context;
    if (i === n) {
      loader.logger.error('Could not select a suitable Loader.');
    }
    return loader;
  },
};

export default exports;

