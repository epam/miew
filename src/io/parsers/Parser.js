

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

/** @deprecated */
Parser.prototype.parseOLD = function(callback) {
  return this.parse()
    .then((result) => {
      callback.ready(result);
    })
    .catch((error) => {
      callback.error(error);
    });
};

Parser.prototype.parse = function(/** @deprecated */ callbacks) {
  if (callbacks) {
    return this.parseOLD(callbacks);
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        return resolve(this.parseSync());
      } catch (error) {
        return reject(error);
      }
    });
  });
};

Parser.prototype.parseSync = function() {
  throw new Error('Parsing this type of data is not implemented');
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

