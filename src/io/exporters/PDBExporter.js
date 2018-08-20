import Exporter from './Exporter';
import chem from '../../chem';
import PDBResult from './PDBResult';

export default class PDBExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    this._tags = ['HEADER', 'TITLE ', 'COMPND', 'REMARK', 'ATOM  ', 'HETATM', 'ENDMDL', 'CONECT', 'HELIX ', 'SHEET '];
    this._result = null;
    this._resultArray = [];
    this._tagExtractors = {
      'HEADER': this._extractHEADER,
      'TITLE ': this._extractTITLE,
      'ATOM  ': this._extractATOM,
      'HETATM': this._extractATOM,
      //'ENDMDL': this._extractENDMDL,
      'CONECT': this._extractCONECT,
      'COMPND': this._extractCOMPND,
      'REMARK': this._extractREMARK,
      //'HELIX ': this._extractHELIX,
      //'SHEET ': this._extractSHEET,
    };
  }

  exportSync() {
    const result = new PDBResult();
    if (!this._source) {
      return this._result;
    }

    for (let i = 0; i < this._tags.length; i++) {
      const tag = this._tags[i];
      const func = this._tagExtractors[tag];
      if (_.isFunction(func)) {
        func.call(this, result);
      }
    }

    this._result = result.getResult();

    console.log(this._result);
    return this._result;
  }

  _extractHEADER(result) {
    if (!this._source.metadata) {
      return;
    }
    const metadata = this._source.metadata;
    result.newString();
    result.writeString('HEADER', 1, 6);
    result.writeString(metadata.classification, 11, 50);
    result.writeString(metadata.date, 51, 59);
    result.writeString(metadata.id, 63, 66);
    //result.writeString('\n', 67, 67);
  }

  _extractTITLE(result) {
    if (!this._source.metadata) {
      return;
    }
    const metadata = this._source.metadata;
    for (let i = 0; i < metadata.title.length; i++) {
      result.newString();
      result.writeString('TITLE', 1, 6);
      if (i === 0) {
        result.writeString(metadata.title[i], 11, 80);
      } else {
        result.writeString((i + 1).toString(), 10, 8);
        result.writeString(metadata.title[i], 12, 80);
      }
      //result.writeString('\n', 81, 81);
    }
  }

  _extractCONECT() {
  }

  _extractATOM() {
  }

  //dat shit
  _extractCOMPND(result) {
    if (!this._source._molecules || !this._source._chains) {
      return;
    }
    const molecules = this._source._molecules;
    //const chains = this._getChainsNamesArray();
    for (let i = 0; i < molecules.length; i++) {
      //let count = 1;
      const chains = this._getMoleculeChains(molecules[i]);
      result.newString();
      result.writeString('COMPND', 1, 6);
      result.writeString('MOL_ID: ' + molecules[i]._index + ';', 11, 80);
      result.newString();
      result.writeString('COMPND', 1, 6);
      //result.writeString((++count).toString(), 10, 9);
      result.writeString('MOLECULE: ' + molecules[i]._name + ';', 12, 80);
      result.newString();
      result.writeString('COMPND', 1, 6);
      //result.writeString((++count).toString(), 10, 9);
      result.writeString('CHAIN: ', 12, 17);
      result.writeString(chains.join(', ') + ';', 18, 80);
    }
  }

  _extractREMARK() {
  }

  _getMoleculeChains(molecule) {
    function getChainName(residue) {
      return residue._chain._name;
    }
    const chainNames = molecule._residues.map(getChainName);
    return chainNames.filter(function(item, pos) {
      return chainNames.indexOf(item) === pos;
    });
  }

  _finalize() {
    this._result = this._resultArray.join('');
  }
}

PDBExporter.formats = ['pdb'];
