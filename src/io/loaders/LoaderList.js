import EntityList from '../../utils/EntityList';

/**
 * A list of available loaders.
 * @extends EntityList
 */
class LoaderList extends EntityList {
  /**
   * Create a list of loaders.
   * The loaders are indexed by supported source types (`.types` property of a Loader
   * subclass).
   * The loaders can be retrieved later by matching against specs (see {@link LoaderList#find}).
   *
   * @param {!Array<function(new:Loader)>=} someLoaders A list of {@link Loader} subclasses to
   *   automatically register at creation time.
   * @see LoaderList#register
   */
  constructor(someLoaders = []) {
    super(someLoaders, ['types']);
  }

  /**
   * Find a suitable loader for a source type.
   *
   * @param {Object} specs Loader specifications.
   * @param {string=} specs.type Supported source type.
   * @param {*=} specs.source Source to load from.
   */
  find(specs) {
    let list = [];
    if (specs.type) {
      list = this._dict.types[specs.type.toLowerCase()] || [];
    } else if (specs.source) {
      return this._list.filter((SomeLoader) => SomeLoader.canProbablyLoad && SomeLoader.canProbablyLoad(specs.source));
    }
    return [...list];
  }
}

export default LoaderList;
