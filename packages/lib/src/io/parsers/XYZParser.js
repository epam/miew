import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';

const { Complex, Element, Molecule } = chem;

class XYZParser extends Parser {
  constructor(data, options) {
    super(data, options);

    this._complex = null;
    this._atomsInf = null;

    this._options.fileType = 'xyz';
    this._fileName = options.name;
  }

  static canProbablyParse(data) {
    return _.isString(data) && /^\s*\d+ *\n[^\n]*\n\s*\w{1,3}\s+-?\d/.test(data);
  }

  _parseToAtomsInf(source) {
    const endnAtoms = source.indexOf('\n');
    const nAtoms = parseInt(source.substring(0, endnAtoms), 10);
    const endComment = source.indexOf('\n', endnAtoms + 1);
    let comment = source.slice(endnAtoms + 1, endComment).trim();
    if (comment.length === 0) {
      comment = this._fileName;
    }

    const startAtomsInf = endComment + source.substring(endComment).search(/\S/);
    this._atomsInf = source.substring(startAtomsInf).split(/[\s,]*\n[\s,]*/);
    if (!Number.isNaN(nAtoms) && (this._atomsInf.length - 1 !== nAtoms)) {
      this._complex.error = {
        message: 'wrong number of atoms',
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

    const chain = this._complex.addChain('A');
    const residue = chain.addResidue('UNK', 1, ' ');

    for (let i = 0; i < this._atomsInf.length - 1; i++) {
      const words = this._atomsInf[i].split(/[\s,]+/);

      if (words.length !== 4) {
        this._complex.error = {
          message: 'missed parameters',
        };
        break;
      }

      const serial = i + 1;
      const name = words[0];
      const xyz = new THREE.Vector3(parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3]));
      const type = Element.getByName(name);
      const role = undefined;

      residue.addAtom(name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge);
    }

    const molecule = new Molecule(this._complex, this._complex.name, 1);
    molecule.residues = residue;
    this._complex._molecules[0] = molecule;
  }

  parseSync() {
    const result = this._complex = new Complex();

    this._parseToAtomsInf(this._data);
    this._parseAtomsInf();

    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
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
