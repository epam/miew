

/**
 * Parsers list.
 * @module io/parsers
 */
import Parser from './parsers/Parser';
import _PDB from './parsers/PDBParser';
import _MOL from './parsers/MOLParser';
import _CML from './parsers/CMLParser';
import _MMTF from './parsers/MMTFParser';
import _CIF from './parsers/CIFParser';
import _CCP4 from './parsers/CCP4Parser';
import _PBC from './parsers/PubChemParser';
// FIXME: deps for amdclean

var parserList = [];
var ag = [_PDB, _MOL, _CML, _MMTF, _CIF, _CCP4, _PBC];

(function(plugins) {
  for (var i = 0, n = plugins.length; i < n; ++i) {
    var currParser = plugins[i];
    parserList.push(currParser);
  }
})(ag);

// NOTE: workaround for https://github.com/gfranko/amdclean/issues/115
var exports = /** @alias module:io/parsers */ {
  /**
   *  The list of parser constructor functions available.
   *  @type {Array<function(new:Parser)>}
   */
  list: parserList,

  Parser: Parser,

  /**
   * Create a parser instance.
   * @param {object} context - Current context.
   * @param {string} data    - Data to be parsed.
   * @param {object} options - Parser options object overriding defaults.
   * @returns {Parser} New parser object.
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

