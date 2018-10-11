import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import Atom from '../../chem/Atom';

const
  Complex = chem.Complex,
  Element = chem.Element,
  Helix = chem.Helix,
  Sheet = chem.Sheet,
  Strand = chem.Strand,
  Bond = chem.Bond,
  Molecule = chem.Molecule;

const chargeMap = [0, 3, 2, 1, 0, -1, -2, -3];

export default class SDFParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._currentString = -1;
    this._complex = null;
    this._strings = null;
    this._chain = null;
    this._residue = null;
    this._moleculeIndx = 0;
  }

  canProbablyParse(data) {
    return _.isString(data);
  }

  _parseConnectionTable() {

  }

  _parseHeader() {

  }

  _fixBondsArray() {
    var serialAtomMap = this._serialAtomMap = {};
    var complex = this._complex;

    var atoms = complex._atoms;
    var i = 0, ni = atoms.length;
    for (; i < ni; ++i) {
      var atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
    }

    var bonds = complex._bonds;
    var j = 0, nj = bonds.length;
    var logger = this.logger;
    for (; j < nj; ++j) {
      var bond = bonds[j];
      if (bond._right < bond._left) {
        logger.debug('_fixBondsArray: Logic error.');
      }
      bond._left = serialAtomMap[bond._left] || null;
      bond._right = serialAtomMap[bond._right] || null;
    }
  }

  finalize() {
    const serialAtomMap = this._serialAtomMap = {};
    const atoms = this._complex._atoms;
    let i = 0, ni = atoms.length;
    for (; i < ni; ++i) {
      var atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
    }

    this._complex._finalizeBonds();
    this._fixBondsArray();

    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap
    });
  }

  _parseMOL(start) {
    let parsedStrings = 0;
    let strIndx = start;
    let curStr = this._strings[strIndx];

    let serial = 0;
    strIndx += 3;
    const countsLine = this._strings[strIndx];
    strIndx++;
    const atomsNum = parseInt(countsLine.substr(0, 3), 10);
    const bondsNum = parseInt(countsLine.substr(3, 3), 10);

    const complex = this._complex;

    for (let i = 0; i < atomsNum; i++) {
      curStr = this._strings[strIndx];
      serial++;
      const occupancy = 1.0;
      const x = parseFloat(curStr.substr(0, 10));
      const y = parseFloat(curStr.substr(10, 10));
      const z = parseFloat(curStr.substr(20, 10));
      const charge = chargeMap[parseInt(curStr.substr(36, 3), 10)];
      let xyz = new THREE.Vector3(x, y, z);
      let name = curStr.substr(31, 3).trim().toUpperCase();
      const type = Element.getByName(name);
      name += serial;
      var role = Element.Role[name]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")

      // NOTE: Residues of a particular chain are not required to be listed next to each other.
      // https://github.com/biasmv/pv/commit/7319b898b7473ba380c26699e3b028b2b1a7e1a1

      const chainID = 'chain' + this._moleculeIndx;
      const resName = 'residue' + this._moleculeIndx;
      const resSeq = resName;
      const iCode = '';
      let chain = this._chain;
      if (!chain || chain.getName() !== chainID) {
        this._chain = chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
        this._residue = null;
      }

      var residue = this._residue;
      if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
        this._residue = residue = chain.addResidue(resName, resSeq, iCode);
      }

      // TODO: optimize atom positions storage? what for? (and occupancy? tempFactor?)
      residue.addAtom(name, type, xyz, role, false, serial, '', occupancy, 0.0, charge);
      strIndx++;
    }

    for (let i = 0; i < bondsNum; i++) {
      curStr = this._strings[strIndx];
      const atom1 = parseInt(curStr.substr(0, 3), 10);
      const atom2 = parseInt(curStr.substr(3, 3), 10);
      //const bondType = Bond.BondType.UNKNOWN;//parseInt(curStr.substr(6, 3), 10);

      //dat kolxoz
      if (atom1 > atom2) {
        complex.addBond(atom2, atom1, 0, 1, true);
      } else {
        complex.addBond(atom1, atom2, 0, 1, true);
      }
      strIndx++;
    }

    parsedStrings = strIndx;
    curStr = this._strings[start + parsedStrings];         //dat double kolxoz
    while (curStr !== 'M  END' && !_.isUndefined(curStr)) {
      curStr = this._strings[start + parsedStrings];
      parsedStrings++;
    }

    return parsedStrings;
  }

  _parseDataItems(start) {
    let parsedStrings = 0;
    let curStr = this._strings[start];
    while (curStr !== '$$$$' && !_.isUndefined(curStr)) {
      curStr = this._strings[start + parsedStrings];
      parsedStrings++;
    }

    return parsedStrings;
  }

  _isBlankString(string) {
    return !string ||  /^\s*$/.test(string);
  }

  _parseCompound(start) {
    let strParsed = 0;
    strParsed += this._parseMOL(start);
    strParsed += this._parseDataItems(start);
    return strParsed;
  }

  parseSync() {
    const result = this._complex = new Complex();
    this._strings = this._data.split(/\r?\n|\r/);
    this._currentString = 0;
    let cmpndStart = 0;
    let stringsParsed = 0;
    do {
      this._moleculeIndx++;
      stringsParsed = this._parseCompound(cmpndStart);
      console.log(stringsParsed);
      cmpndStart += stringsParsed;
    } while (stringsParsed < this._strings.length);

    this.finalize();

    return result;
  }
}

SDFParser.formats = ['mol', 'sdf'];
SDFParser.extensions = ['.mol', '.sdf'];
