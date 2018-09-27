import Exporter from './Exporter';
import PDBResult from './PDBResult';
import Assembly from '../../chem/Assembly';
import {Matrix4} from 'three';
import {typeByPDBHelixClass} from '../../chem/Helix';
import _ from 'lodash';

export default class PDBExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    this._tags = ['HEADER', 'TITLE ', 'COMPND', 'REMARK', 'HELIX', 'SHEET ', 'ATOM and HETATM', 'CONECT'];
    this._result = null;
    this._resultArray = [];
    this._tagExtractors = {
      'HEADER'         : this._extractHEADER,
      'TITLE '         : this._extractTITLE,
      'ATOM and HETATM': this._extractATOM,
      'CONECT'         : this._extractCONECT,
      'COMPND'         : this._extractCOMPND,
      'REMARK'         : this._extractREMARK,
      'HELIX'          : this._extractHELIX,
      'SHEET '         : this._extractSHEET,
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

    result.writeString('\n', 81, 81);
    this._result = result.getResult();

    //console.log(this._result);
    return this._result;
  }

  _extractHEADER(result) {
    if (!this._source.metadata) {
      return;
    }
    const metadata = this._source.metadata;
    result.newTag('HEADER');
    result.newString();
    if (metadata.classification) {
      result.writeString(metadata.classification, 11, 50);
    }
    if (metadata.date) {
      result.writeString(metadata.date, 51, 59);
    }
    if (metadata.id) {
      result.writeString(metadata.id, 63, 66);
    }
  }

  _extractTITLE(result) {
    if (!this._source.metadata) {
      return;
    }
    const metadata = this._source.metadata;
    if (!metadata.title) {
      return;
    }
    result.newTag('TITLE', true);
    for (let i = 0; i < metadata.title.length; i++) {
      result.newString();
      result.writeString(metadata.title[i], 11, 80);
    }
  }

  _extractCONECT(result) {
    if (!this._source._atoms) {
      return;
    }

    const atoms = this._source._atoms;
    result.newTag('CONECT');

    for (let i = 0; i < atoms.length; i++) {
      const fixedBonds = (atoms[i]._bonds.filter(this._fixedBond)).reverse();
      if (fixedBonds.length !== 0) {
        const bondsGroups = this._getSubArrays(fixedBonds, 4);
        for (let k = 0; k < bondsGroups.length; k++) {
          result.newString();
          result.writeString(atoms[i]._serial, 11, 7);

          for (let j = 0; j < bondsGroups[k].length; j++) {
            const serial = (bondsGroups[k][j]._left._serial === atoms[i]._serial) ?
              bondsGroups[k][j]._right._serial : bondsGroups[k][j]._left._serial;

            result.writeString(serial, 16 + 5 * j, 12 + 5 * j);
          }
        }
      }
    }
  }

  _getSubArrays (arr, subArraySize) {
    const subArrays = [];
    for (let i = 0; i < arr.length; i += subArraySize) {
      subArrays.push(arr.slice(i, i + subArraySize));
    }
    return subArrays;
  }

  _fixedBond(bond) {
    if (bond._fixed) {
      return true;
    }
    return false;
  }

  _extractSHEET(result) {
    if (!this._source._sheets) {
      return;
    }

    result.newTag('SHEET');
    const sheets = this._source._sheets;
    for (let i = 0; i < sheets.length; i++) {
      if (sheets[i]._strands) {
        const strands = sheets[i]._strands;
        for (let j = 0; j < strands.length; j++) {
          result.newString();
          result.writeString(j + 1, 10, 8);
          result.writeString(sheets[i]._name, 14, 12);
          result.writeString(strands.length, 16, 15);
          result.writeString(strands[j].init._type._name, 18, 20);
          result.writeString(strands[j].init._chain._name, 22, 22);
          result.writeString(strands[j].init._sequence, 26, 23);
          result.writeString(strands[j].init._icode, 27, 27);
          result.writeString(strands[j].term._type._name, 29, 31);
          result.writeString(strands[j].init._chain._name, 33, 33);
          result.writeString(strands[j].term._sequence, 37, 34);
          result.writeString(strands[j].term._icode, 38, 38);
          result.writeString(strands[j].sense, 40, 39);
        }
      }
    }
  }

_extractHELIX(result) {
    if (!this._source._helices) {
      return;
    }

    result.newTag('HELIX');
    const helices = this._source._helices;
    for (let i = 0; i < helices.length; i++) {
      const helix = helices[i];
      const helixClass = _.invert(typeByPDBHelixClass);
      result.newString();
      result.writeString(helix.serial, 10, 8);
      result.writeString(helix.name, 14, 12);
      result.writeString(helix.init._type._name, 16, 18);
      result.writeString(helix.init._chain._name, 20, 20);
      result.writeString(helix.init._sequence, 25, 22);
      result.writeString(helix.init._icode, 26, 26);
      result.writeString(helix.term._type._name, 28, 30);
      result.writeString(helix.term._chain._name, 32, 32);
      result.writeString(helix.term._sequence, 37, 34);
      result.writeString(helix.term._icode, 38, 38);
      result.writeString(helixClass[helix.type], 40, 39);
      result.writeString(helix.comment, 41, 70);
      result.writeString(helix.length, 76, 72);
    }
  }

  _extractATOM(result) {
    if (!this._source._atoms) {
      return;
    }

    const atoms = this._source._atoms;

    for (let i = 0; i < atoms.length; i++) {
      const elementName = atoms[i].element.name;
      const atomName = atoms[i]._name._name;

      if (atoms[i]._het && result.currentTag() !== 'HETATM') {
        result.newTag('HETATM');
      } else if (!atoms[i]._het && result.currentTag() !== 'ATOM') {
        result.newTag('ATOM');
      }
      result.newString();
      result.writeString(atoms[i]._serial, 11, 7);

      if (elementName.length > 1 || atomName.length > 3) {
        result.writeString(atomName, 13, 16);
      } else {
        result.writeString(atomName, 14, 16);
      }

      result.writeString(String.fromCharCode(atoms[i]._location), 17, 17);
      result.writeString(atoms[i]._residue._type._name, 20, 18);
      result.writeString(atoms[i]._residue._chain._name, 22, 22);
      result.writeString(atoms[i]._residue._sequence, 26, 23);
      result.writeString(atoms[i]._residue._icode, 27, 27);
      result.writeString(atoms[i]._position.x.toFixed(3), 38, 31);
      result.writeString(atoms[i]._position.y.toFixed(3), 46, 39);
      result.writeString(atoms[i]._position.z.toFixed(3), 54, 47);
      result.writeString(atoms[i]._occupancy.toFixed(2), 60, 55);
      result.writeString(atoms[i]._temperature.toFixed(2), 66, 61);

      result.writeString(atoms[i].element.name, 78, 77);

      if (atoms[i]._charge) {
        result.writeString(atoms[i]._charge, 79, 80);
      }
    }
  }

  _extractCOMPND(result) {
    if (!this._source._molecules) {
      return;
    }
    const molecules = this._source._molecules;
    result.newTag('COMPND', true);
    for (let i = 0; i < molecules.length; i++) {
      const chains = this._getMoleculeChains(molecules[i]);
      result.newString();
      result.writeString('MOL_ID: ' + molecules[i]._index + ';', 11, 80);
      result.newString();
      result.writeString('MOLECULE: ' + molecules[i]._name + ';', 11, 80);
      result.newString();
      result.writeString('CHAIN: ', 11, 18);
      const chainsString = chains.join(', ') + ';';
      for (let j = 0; j < chainsString.length; j++) {
        if (result.currentStrLength() === 81) {
          result.newString();
        }
        result.writeString(chainsString[j]);
      }
    }
  }

  _extractREMARK(result) {
    this._Remark290(result);
    this._Remark350(result);
  }

  _Remark290(result) {
    if (!this._source.symmetry) {
      return;
    }

    if (this._source.symmetry.length !== 0) {
      const matrices = this._source.symmetry;
      result.newTag('REMARK', 290);
      result.newString();
      result.newString();
      result.writeString('CRYSTALLOGRAPHIC SYMMETRY TRANSFORMATIONS', 11, 80);
      result.newString();
      result.writeString('THE FOLLOWING TRANSFORMATIONS OPERATE ON THE ATOM/HETATM', 11, 80);
      result.newString();
      result.writeString('RECORDS IN THIS ENTRY TO PRODUCE CRYSTALLOGRAPHICALLY', 11, 80);
      result.newString();
      result.writeString('RELATED MOLECULES.', 11, 80);

      const matrix = new Matrix4();
      for (let i = 0; i < matrices.length; i++) {
        matrix.copy(matrices[i]).transpose();
        result.writeMatrix(matrix, i + 1, '  SMTRY');
      }

      result.newString();
      result.newString();
      result.writeString('REMARK: NULL', 11, 80);
    }
  }

  _Remark350(result) {
    if (!this._source.units) {
      return;
    }
    const units = this._source.units;
    const matrix = new Matrix4();
    let biomolIndx = 0;

    result.newTag('REMARK', 350);
    result.newString();
    result.newString();
    result.writeString('COORDINATES FOR A COMPLETE MULTIMER REPRESENTING THE KNOWN', 11, 80);
    result.newString();
    result.writeString('BIOLOGICALLY SIGNIFICANT OLIGOMERIZATION STATE OF THE', 11, 80);
    result.newString();
    result.writeString('MOLECULE CAN BE GENERATED BY APPLYING BIOMT TRANSFORMATIONS', 11, 80);
    result.newString();
    result.writeString('GIVEN BELOW.  BOTH NON-CRYSTALLOGRAPHIC AND', 11, 80);
    result.newString();
    result.writeString('CRYSTALLOGRAPHIC OPERATIONS ARE GIVEN.', 11, 80);

    for (let i = 0; i < units.length; i++) {
      if (units[i] instanceof Assembly) {
        result.newString();
        result.newString();
        biomolIndx++;
        result.writeString('BIOMOLECULE: ' + biomolIndx, 11, 80);
        if (units[i].chains) {
          const chains = units[i].chains.join(', ');
          result.newString();
          result.writeString('APPLY THE FOLLOWING TO CHAINS: ');
          for (let j = 0; j < chains.length; j++) {
            if (result.currentStrLength() === 69 && j !== chains.length - 1) {
              result.newString();
              result.writeString('AND CHAINS: ', 31, 42);
            }
            result.writeString(chains[j]);
          }
        }

        const matrices = units[i].matrices;
        if (matrices) {
          for (let j = 0; j < matrices.length; j++) {
            matrix.copy(matrices[j]).transpose();
            result.writeMatrix(matrix, j + 1, '  BIOMT');
          }
        }
      }
    }
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

  _finalize(result) {
    result.writeString('\n', 81, 81);
    return result.getResult();
  }
}

PDBExporter.formats = ['pdb'];
