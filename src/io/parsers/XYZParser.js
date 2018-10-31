import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';

const
  Complex = chem.Complex,
  Element = chem.Element,
  Molecule = chem.Molecule;

class XYZParser extends Parser {
  constructor(data, options) {
    super(data, options);

    this._complex = null;
    this._chain = null;
    this._residue = null;
    this._sheet = null;
    this._serialAtomMap = null;
    this._modelId = 1;
    this._compaundFound = false;
    this._biomoleculeFound = false;
    this._allowedChainsIDs = null;
    this._lastMolId = -1;

    this._remarks = {};
    this._remark = null;

    this._molecules = [];
    this._molecule = null;
    this._compndCurrToken = '';

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

  _parseToObject(source) {
    let lines = source.split(/\s*\n\s*/);

    let nAtoms = parseInt(lines[0], 10);
    let comment = lines[1];

    const metadata = this._complex.metadata;
    metadata.date = ' ';

    this._complex.name = comment;
    metadata.format = 'xyz';

    this._molecule = {_index: '', _chains: []};
    this._molecule._index = 0;
    this._molecule._name = 'UNKNOWN';
    this._molecules.push(this._molecule);

    this._molecule._chains = this._molecule._chains.concat('U');
    this._chain = this._complex.addChain('U');

    let residue = this._residue;
    this._residue = residue = this._chain.addResidue('unknown', 0, ' ');

    for (let i = 0; i < nAtoms; i++) {
      const words = lines[i + 2].split(/[\s,]+/);

      if (words.length !== 4) {
        this._complex.error = {
          line: i + 2,
          message: 'missed parameters'
        };
        break;
      }

      const name = words[0];
      const xyz = new THREE.Vector3(parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3]));
      const type = Element.getByName(name);
      const role = Element.Role[name]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")

      residue.addAtom(name, type, xyz, role, true, i+1, ' ', 1, 1, 0);
    }
  }

  _fixChains() {
    const idChainMap = {};
    const complex = this._complex;

    //prepare
    for (let i = 0; i < complex._chains.length; i++) {
      const chain = complex._chains[i];
      idChainMap[chain._name.charCodeAt(0)] = chain;
    }
  }

  _fixBondsArray() {
    const serialAtomMap = this._serialAtomMap = {};
    const complex = this._complex;

    const atoms = complex._atoms;
    let i = 0, ni = atoms.length;
    for (; i < ni; ++i) {
      const atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
    }
  }

  _finalizeMolecules() {
    // get chains from complex
    const chainDict = {};

    const chains = this._complex._chains;
    for (let i = 0; i < chains.length; ++i) {
      const chainObj = chains[i];
      const chainName  = chainObj._name;
      chainDict[chainName] = chainObj;
    }

    // aggregate residues from chains
    for (let i = 0; i < this._molecules.length; i++) {
      const m = this._molecules[i];
      let residues = [];
      for (let j = 0; j < m._chains.length; j++) {
        const name = m._chains[j];
        const chain = chainDict[name];
        residues = residues.concat(chain._residues.slice());
      }
      const molecule = new Molecule(this._complex, m._name, i + 1);
      molecule._residues = residues;
      this._complex._molecules[i] = molecule;
    }
  }

  parseSync() {
    const result = this._complex = new Complex();

    this._parseToObject(this._data);

    this._fixBondsArray();
    this._fixChains();

    this._finalizeMolecules();

    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap
    });

    this._serialAtomMap = null;
    this._sheet = null;
    this._residue = null;
    this._chain = null;
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
