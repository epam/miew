import LoaderList from './loaders/LoaderList';

import FileLoader from './loaders/FileLoader';
import XHRLoader from './loaders/XHRLoader';
import ImmediateLoader from './loaders/ImmediateLoader';

import Loader from './loaders/Loader';

export const loaders = new LoaderList([
  // note: order might be important
  FileLoader,
  XHRLoader,
  ImmediateLoader,
]);

/** @deprecated */
const loaderList = loaders.all;

/** @deprecated */
const exports = {
  /**
   *  The list of loader constructor functions available.
   *  @type {Array<function(new:Loader)>}
   *  @deprecated
   */
  list: loaderList,

  /** @deprecated */
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

