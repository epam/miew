function registerIn(dict, keys, value) {
  keys.forEach((key) => {
    key = key.toLowerCase();
    const list = dict[key] = dict[key] || [];
    if (!list.includes(value)) {
      list.push(value);
    }
  });
}

function unregisterFrom(dict, keys, value) {
  keys.forEach((key) => {
    key = key.toLowerCase();
    const list = dict[key];
    if (list) {
      const pos = list.indexOf(value);
      if (pos !== -1) {
        list.splice(pos, 1);
      }
      if (list.length === 0) {
        delete dict[key];
      }
    }
  });
}

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
    if (!this._list.includes(SomeParser)) {
      this._list.push(SomeParser);
    }
    registerIn(this._byFormat, SomeParser.formats, SomeParser);
    registerIn(this._byExt, SomeParser.extensions, SomeParser);
  }

  unregister(SomeParser) {
    const pos = this._list.indexOf(SomeParser);
    if (pos !== -1) {
      this._list.splice(pos, 1);
    }
    unregisterFrom(this._byFormat, SomeParser.formats, SomeParser);
    unregisterFrom(this._byExt, SomeParser.extensions, SomeParser);
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
