import makeContextDependent from '../../utils/makeContextDependent';

export default class Exporter {
  constructor(source, options) {
    this._source = source;
    this._options = options || {};
    this._abort = false;
  }

  exportSync() {
    throw new Error('Exporting to this source is not implemented');
  }

  export() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (this._abort) {
            return reject(new Error('Export aborted'));
          }
          return resolve(this.exportSync());
        } catch (error) {
          return reject(error);
        }
      });
    });
  }

  abort() {
    this._abort = true;
  }
}

makeContextDependent(Exporter.prototype);
