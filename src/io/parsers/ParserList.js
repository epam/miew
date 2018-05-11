import EntityList from '../../utils/EntityList';

/**
 * A list of available parsers.
 * @extends EntityList
 */
class ParserList extends EntityList {
  /**
   * Create a list of parsers.
   * The parsers can be retrieved later by matching against specs (see {@link ParsrerList#find}).
   *
   * @param {!Array<function(new:Parser)>=} someParsers A list of {@link Parser} subclasses to
   *   automatically register at creation time.
   * @see ParserList#register
   */
  constructor(someParsers = []) {
    super();
    this._byFormat = {};
    this._byExt = {};

    someParsers.forEach(SomeParser => this.register(SomeParser));
  }

  /**
   * Register a parser for a specific data format.
   *
   * @param {function(new:Parser)} SomeParser A {@link Parser} subclass to register.
   * @param {string} SomeParser.id A case-insensitive identifier.
   * @param {Array<string>} SomeParser.formats Supported data formats.
   * @param {Array<string>} SomeParser.extensions Supported file extensions.
   * @see ParserList#unregister
   */
  register(SomeParser) {
    super.register(SomeParser);
    EntityList.registerInDict(this._byFormat, SomeParser.formats, SomeParser);
    EntityList.registerInDict(this._byExt, SomeParser.extensions, SomeParser);
  }

  /**
   * Remove a parser from this list.
   *
   * @param {function(new:Parser)} SomeParser A {@link Parser} subclass to unregister.
   * @param {string} SomeParser.id A case-insensitive identifier.
   * @param {Array<string>} SomeParser.formats Supported data formats.
   * @param {Array<string>} SomeParser.extensions Supported file extensions.
   * @see ParserList#register
   */
  unregister(SomeParser) {
    super.unregister(SomeParser);
    EntityList.unregisterFromDict(this._byFormat, SomeParser.formats, SomeParser);
    EntityList.unregisterFromDict(this._byExt, SomeParser.extensions, SomeParser);
  }

  /**
   * An unordered list of data formats for registered parsers.
   * It is a read-only copy, use {@link ParserList#register} and {@link ParserList#unregister}
   * to modify it.
   *
   * @type {!Array<string>}
   */
  get formats() {
    return Object.keys(this._byFormat);
  }

  /**
   * An unordered list of file extensions for registered parsers.
   * It is a read-only copy, use {@link ParserList#register} and {@link ParserList#unregister}
   * to modify it.
   *
   * @type {!Array<string>}
   */
  get extensions() {
    return Object.keys(this._byExt);
  }

  /**
   * Find a suitable parser for data.
   *
   * @param {Object} specs Parser specifications.
   * @param {string=} specs.format Supported data format.
   * @param {string=} specs.ext Supported filename extension.
   * @param {*} specs.data Data to parse.
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

export default ParserList;
