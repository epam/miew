import Exporter from './Exporter';

export default class DUMBExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    //   this._tags = [];
  }

  exportSync() {
    this.result = 'void';
    return this.result;
  }
}

DUMBExporter.formats = ['dumb'];
