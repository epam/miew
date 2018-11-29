import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';

const
  Complex = chem.Complex,
  Element = chem.Element;

class XYZParser extends Parser {
  constructor(data, options) {
    super(data, options);

    this._complex = null;
    this._atomsInf = null;

    this._options.fileType = 'xyz';
  }

  canParse(data, options) {
    if (!data) {
      return false;
    }
    return typeof data === 'string' && Parser.checkDataTypeOptions(options, 'xyz');
  }

  canProbablyParse(data) {
    return _.isString(data) && /^\s*data_/i.test(data);
  }

  _parseToAtomsInf(source) {
    const endnAtoms = source.indexOf('\n');
    const nAtoms = parseInt(source.substring(0, endnAtoms), 10);
    const endComment = source.indexOf('\n', endnAtoms + 1);
    const comment = source.slice(endnAtoms + 1, endComment);

    const startAtomsInf = endComment + source.substring(endComment).search(/\S/);
    this._atomsInf = source.substring(startAtomsInf).split(/[\s,]*\n[\s,]*/);
    if (!Number.isNaN(nAtoms) && (this._atomsInf.length - 1 !== nAtoms)) {
      this._complex.error = {
        message: 'wrong number of atoms'
      };
      return;
    }

    this._complex.metadata.format = 'xyz';
    this._complex.name = comment;
  }

  _parseAtomsInf() {
    const het = true;
    const altLoc = ' ';
    const occupancy = 1;
    const tempFactor = 1;
    const charge = 0;

    const chain = this._complex.addChain(' ');
    const residue = chain.addResidue('LIG', 1, ' ');

    for (let i = 0; i < this._atomsInf.length - 1; i++) {
      const words = this._atomsInf[i].split(/[\s,]+/);

      if (words.length !== 4) {
        this._complex.error = {
          message: 'missed parameters'
        };
        break;
      }

      const serial = i + 1;
      const name = words[0];
      const xyz = new THREE.Vector3(parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3]));
      const type = Element.getByName(name);
      const role = Element.Role[name]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")

      residue.addAtom(name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge);
    }
  }

  parseSync() {
    const result = this._complex = new Complex();

    this._parseToAtomsInf(this._data);
    this._parseAtomsInf();

    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap
    });

    this._complex = null;
    this._atomsInf = null;

    if (result.error) {
      throw new Error(result.error.message);
    }
    return result;
  }

  static formats = ['xyz'];

  static extensions = ['.xyz'];
}

export default XYZParser;
