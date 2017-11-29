import ParserList from './parsers/ParserList';

import PDBParser from './parsers/PDBParser';
import CMLParser from './parsers/CMLParser';
import MMTFParser from './parsers/MMTFParser';
import CIFParser from './parsers/CIFParser';
import CCP4Parser from './parsers/CCP4Parser';
import PubChemParser from './parsers/PubChemParser';

import Parser from './parsers/Parser';

export const parsers = new ParserList([
  // note: order might be important
  PDBParser,
  CIFParser,
  MMTFParser,
  CMLParser,
  PubChemParser,
  CCP4Parser,
]);

/** @deprecated */
const parserList = parsers.all;

/** @deprecated */
const exports = {
  /**
   *  The list of parser constructor functions available.
   *  @type {Array<function(new:Parser)>}
   *  @deprecated
   */
  list: parserList,

  /** @deprecated */
  Parser: Parser,

  /**
   * Create a parser instance.
   * @param {object} context - Current context.
   * @param {string} data    - Data to be parsed.
   * @param {object} options - Parser options object overriding defaults.
   * @returns {Parser} New parser object.
   * @deprecated
   */
  create: function(context, data, options) {
    var parser = new Parser(data, options);// this behaviour was copied from the previous version
    var i = 0, n = parserList.length;
    for (; i < n; ++i) {
      var SomeParser = parserList[i];
      if (SomeParser.canParse && SomeParser.canParse(data, options)) {
        parser = new SomeParser(data, options);
        break;
      }
    }
    parser.context = context;
    if (i === n) {
      parser.logger.error('Could not parse data. Format unknown.');
    }
    return parser;
  },
};

export default exports;
