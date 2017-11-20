import ContextDependent from '../../utils/ContextDependent';

export default class Parser {
  constructor(data, options) {
    this._data = data;
    this._options = options;
  }

  parseSync() {
    throw new Error('Parsing this type of data is not implemented');
  }

  parse(/** @deprecated */ callbacks) {
    if (callbacks) {
      return this._parseOLD(callbacks);
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
  }

  /** @deprecated */
  _parseOLD(callbacks) {
    return this.parse()
      .then((result) => {
        callbacks.ready(result);
      })
      .catch((error) => {
        callbacks.error(error);
      });
  }

  abort() {
    this._abort = true;
  }

  static checkDataTypeOptions(options, type, extension) {
    const fileType = options.fileType;
    const fileName = options.fileName;
    extension = (extension || ('.' + type)).toLowerCase();
    return Boolean((fileType && fileType.toLowerCase() === type.toLowerCase()) ||
      (!fileType && fileName && fileName.toLowerCase().endsWith(extension)));
  }
}

ContextDependent(Parser.prototype);
