import EntityList from '../../utils/EntityList';

/**
 * A list of available parsers.
 * @extends EntityList
 */
class ParserList extends EntityList {
  /**
   * Create a list of parsers.
   * The parsers are indexed by supported data formats and file extensions (`.formats` and
   * `.extensions` properties of a Parser subclass).
   * The parsers can be retrieved later by matching against specs (see {@link ParsrerList#find}).
   *
   * @param {!Array<function(new:Parser)>=} someParsers A list of {@link Parser} subclasses to
   *   automatically register at creation time.
   * @see ParserList#register
   */
  constructor(someParsers = []) {
    super(someParsers, ['formats', 'extensions']);
  }

  /**
   * Find a suitable parser for data.
   *
   * @param {Object} specs Parser specifications.
   * @param {string=} specs.format Supported data format.
   * @param {string=} specs.ext Supported filename extension.
   * @param {*=} specs.data Data to parse.
   */
  find(specs) {
    let list = [];
    if (specs.format) {
      list = this._dict.formats[specs.format.toLowerCase()] || [];
    } else if (specs.ext) {
      list = this._dict.extensions[specs.ext.toLowerCase()] || [];
    }
    // autodetect only if no format is forced
    if (list.length === 0 && !specs.format && specs.data) {
      return this._list.filter((SomeParser) => SomeParser.canProbablyParse && SomeParser.canProbablyParse(specs.data));
    }
    return [...list];
  }
}

export default ParserList;
