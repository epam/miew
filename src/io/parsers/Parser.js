

//////////////////////////////////////////////////////////////////////////////
import ContextDependent from '../../utils/ContextDependent';
//////////////////////////////////////////////////////////////////////////////
function Parser(data, options) {
  this._data = data;
  this._options = options;
}

////////////////////////////////////////////////////////////////////////////
// Instance methods

ContextDependent(Parser.prototype);

Parser.prototype.parse = function(callback) {
  var self = this;
  setTimeout(function _parse() {
    try {
      self._parse(callback);
    } catch (err) {
      callback.error(err);
    }
  }, 0);
};

Parser.prototype.abort = function() {
  this._abort = true;
};


Parser.checkDataTypeOptions = function(options, type, extension) {
  const fileType = options.fileType;
  const name = options.fileName;
  extension = extension || ('.' + type);
  return (fileType && fileType === type) ||
    (name && name.toLowerCase().lastIndexOf(extension) === name.length - extension.length);
};
////////////////////////////////////////////////////////////////////////////

export default Parser;

