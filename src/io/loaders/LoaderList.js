import EntityList from '../../utils/EntityList';

/**
 * A list of available loaders.
 * @extends EntityList
 */
class LoaderList extends EntityList {
  /**
   * Create a list of loaders.
   * The loaders can be retrieved later by matching against specs (see {@link LoaderList#find}).
   *
   * @param {!Array<function(new:Loader)>=} someLoaders A list of {@link Loader} subclasses to
   *   automatically register at creation time.
   * @see LoaderList#register
   */
  constructor(someLoaders = []) {
    super();
    this._byType = {};

    someLoaders.forEach(SomeLoader => this.register(SomeLoader));
  }

  /**
   * Register a loader for a specific data source.
   *
   * @param {function(new:Loader)} SomeLoader A {@link Loader} subclass to register.
   * @param {string} SomeLoader.id A case-insensitive identifier.
   * @param {!Array<string>} SomeLoader.types Supported data source types.
   * @see LoaderList#unregister
   */
  register(SomeLoader) {
    super.register(SomeLoader);
    EntityList.registerInDict(this._byType, SomeLoader.types, SomeLoader);
  }

  /**
   * Remove a loader from this list.
   *
   * @param {function(new:Loader)} SomeLoader A Loader subclass to unregister.
   * @param {string} SomeLoader.id A case-insensitive identifier.
   * @param {!Array<string>} SomeLoader.types Supported data source types.
   * @see LoaderList#register
   */
  unregister(SomeLoader) {
    super.unregister(SomeLoader);
    EntityList.unregisterFromDict(this._byType, SomeLoader.types, SomeLoader);
  }

  /**
   * An unordered list of data types for registered loaders.
   * It is a read-only copy, use {@link LoaderList#register} and {@link LoaderList#unregister}
   * to modify it.
   *
   * @type {!Array<string>}
   */
  get types() {
    return Object.keys(this._byType);
  }

  /**
   * Find a suitable loader for a data source.
   *
   * @param {Object} specs Loader specifications.
   * @param {string=} specs.type Supported data source type.
   * @param {*} specs.source Source to load from.
   */
  find(specs) {
    let list = [];
    if (specs.type) {
      list = this._byType[specs.type.toLowerCase()] || [];
    } else if (specs.source) {
      return this._list.filter(SomeLoader => SomeLoader.canProbablyLoad && SomeLoader.canProbablyLoad(specs.source));
    }
    return [...list];
  }
}

export default LoaderList;
