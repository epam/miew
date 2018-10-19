import Parser from './Parser';

function XYZParser(data, options) {
  Parser.call(this, data, options);

  this._options.fileType = 'xyz';
}

XYZParser.prototype.parseSync = function() {
  this._complex = new Complex();
  return this._complex;
};

Parser.formats = ['xyz'];
Parser.extensions = ['.xyz'];
