import {
  registerInList,
  unregisterFromList,
  registerInDict,
  unregisterFromDict,
} from '../../utils';

export default class ParserList {
  constructor(someParsers = []) {
    this._list = [];
    this._byFormat = {};
    this._byExt = {};

    someParsers.forEach(SomeParser => this.register(SomeParser));
  }

  /**
   * Register a parser for a specific data format.
   *
   * @param {function} SomeParser - a Parser subclass to register
   * @param {string[]} SomeParser.formats - supported data formats
   * @param {string[]} SomeParser.extensions - supported file extensions
   */
  register(SomeParser) {
    registerInList(this._list, SomeParser);
    registerInDict(this._byFormat, SomeParser.formats, SomeParser);
    registerInDict(this._byExt, SomeParser.extensions, SomeParser);
  }

  unregister(SomeParser) {
    unregisterFromList(this._list, SomeParser);
    unregisterFromDict(this._byFormat, SomeParser.formats, SomeParser);
    unregisterFromDict(this._byExt, SomeParser.extensions, SomeParser);
  }

  get all() {
    return [...this._list];
  }

  get formats() {
    return Object.keys(this._byFormat);
  }

  get extensions() {
    return Object.keys(this._byExt);
  }

  /**
   * Find a suitable parser for data
   *
   * @param {object} specs - parser specifications
   * @param {string=} specs.format - supported data format
   * @param {string=} specs.ext - supported filename extension
   * @param {data=} specs.data - data to parse
   */
  find(specs) {
    let list = [];
    if (specs.format) {
      list = this._byFormat[specs.format.toLowerCase()] || [];
    } else if (specs.ext) {
      list = this._byExt[specs.ext.toLowerCase()] || [];
    }
    // autodetect only if no format is forced
    if (list.length === 0 && !specs.format && specs.data) {
      return this._list.filter(SomeParser => SomeParser.canProbablyParse && SomeParser.canProbablyParse(specs.data));
    }
    return [...list];
  }
}
