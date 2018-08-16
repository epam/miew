import Exporter from './Exporter';
import chem from '../../chem';

export default class PDBExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    this._tags = ['HEADER', 'TITLE ', 'COMPND', 'REMARK', 'ATOM  ', 'HETATM', 'ENDMDL', 'CONECT', 'HELIX ', 'SHEET '];
    //this._result = '';
  }


  exportSync() {
    const result = this._result;
    for (let i = 0; i < this._tags.length; i++) {
      const tag = this._tags[i];
      const func = this.tagExtractors[tag];
      if (_.isFunction(func)) {

      }
    }


    return result;
  }

  _extractHEADER() {
  }

  _extractTITLE() {
  }

  _extractCONECT() {
  }

  _extractATOM() {
  }

  _extractCOMPND() {
  }

  _extractREMARK() {
  }
}

PDBExporter.formats = ['pdb'];
