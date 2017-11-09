

import Parser from './Parser';
import chem from '../../chem';

var Complex = chem.Complex;

function MOLParser(data, options) {
  Parser.call(this, data, options);

  this._complex = null;

  options.fileType = 'mol';
}

MOLParser.prototype = Object.create(Parser.prototype);
MOLParser.prototype.constructor = MOLParser;

MOLParser.prototype.parseSync = function() {
  var result = this._complex = new Complex();

  // TODO: Make asynchronous

  // parse MOL
  // ...

  // cleanup
  this._complex = null;

  return result;
};

MOLParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  return typeof data === 'string' && Parser.checkDataTypeOptions(options, 'mol');
};

export default MOLParser;

