import {
  registerInList,
  unregisterFromList,
  registerInDict,
  unregisterFromDict,
} from '../../utils';

export default class LoaderList {
  constructor(someLoaders = []) {
    this._list = [];
    this._byType = {};

    someLoaders.forEach(SomeLoader => this.register(SomeLoader));
  }

  /**
   * Register a parser for a specific data format.
   *
   * @param {function} SomeLoader - a Parser subclass to register
   * @param {string[]} SomeLoader.types - supported data formats
   */
  register(SomeLoader) {
    registerInList(this._list, SomeLoader);
    registerInDict(this._byType, SomeLoader.types, SomeLoader);
  }

  unregister(SomeLoader) {
    unregisterFromList(this._list, SomeLoader);
    unregisterFromDict(this._byType, SomeLoader.types, SomeLoader);
  }

  get all() {
    return [...this._list];
  }

  get types() {
    return Object.keys(this._byType);
  }

  /**
   * Find a suitable loader for the data source
   *
   * @param {object} specs - parser specifications
   * @param {string=} specs.type - supported source type
   * @param {data=} specs.source - source to load from
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
