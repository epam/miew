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

  _parse(source) {
    const het = true;
    const altLoc = ' ';
    const occupancy = 1;
    const tempFactor = 1;
    const charge = 0;

    const endAtomsNum = source.indexOf('\n');
    const nAtoms = parseInt(source.substring(0, endAtomsNum), 10);
    const endComment = source.indexOf('\n', endAtomsNum + 1);
    const comment = source.slice(endAtomsNum + 1, endComment);

    let lines = source.substring(endComment + 1).split(/[\s,]*\n[\s,]*/);
    if (!Number.isNaN(nAtoms) && (lines.length - 1 !== nAtoms)) {
      this._complex.error = {
        message: 'wrong number of atoms'
      };
      return;
    }

    this._complex.metadata.format = 'xyz';
    this._complex.name = comment;

    const chain = this._complex.addChain(' ');
    const residue = chain.addResidue('LIG', 1, ' ');

    for (let i = 0; i < lines.length - 1; i++) {
      const words = lines[i].split(/[\s,]+/);

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

    this._parse(this._data);

    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap
    });

    this._complex = null;

    if (result.error) {
      throw new Error(result.error.message);
    }
    return result;
  }

  static formats = ['xyz'];

  static extensions = ['.xyz'];
}

export default XYZParser;
