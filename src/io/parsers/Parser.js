import makeContextDependent from '../../utils/makeContextDependent';

export default class Parser {
  constructor(data, options) {
    this._data = data;
    this._options = options || {};
    this._abort = false;
  }

  parseSync() {
    throw new Error('Parsing this type of data is not implemented');
  }

  parse() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (this._abort) {
            return reject(new Error('Parsing aborted'));
          }
          return resolve(this.parseSync());
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  // only for volume Parsers
  getModel() {
    this.model._parseHeader(this._data);
    return this.model;
  }

  abort() {
    this._abort = true;
  }
}

makeContextDependent(Parser.prototype);
