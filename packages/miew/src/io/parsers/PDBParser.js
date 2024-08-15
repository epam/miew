import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import Remark290 from './pdb/Remark290';
import Remark350 from './pdb/Remark350';
import PDBStream from './PDBStream';

const {
  Complex,
  Element,
  Helix,
  Sheet,
  Strand,
  Bond,
  Molecule,
} = chem;

const TAG_LENGTH = 6;

function nameToElement(name) {
  // http://www.wwpdb.org/documentation/file-format-content/format33/sect9.html#ATOM
  //
  // http://www.cgl.ucsf.edu/chimera/docs/UsersGuide/tutorials/pdbintro.html#note1
  //
  // Atom names start with element symbols right-justified in columns 13-14
  // as permitted by the length of the name. For example, the symbol FE for
  // iron appears in columns 13-14, whereas the symbol C for carbon appears
  // in column 14 (see Misaligned Atom Names). If an atom name has four
  // characters, however, it must start in column 13 even if the element
  // symbol is a single character (for example, see Hydrogen Atoms).

  const veryLong = name.trim().length === 4;
  return name.slice(0, veryLong ? 1 : 2).trim();
}

// the most frequently used beginnings; although HEADER is mandatory, it is often missing in handmade files
const pdbStartRegexp = /^(HEADER\s|COMPND\s|REMARK\s|ATOM {2}|HETATM|MODEL )/i;

const remarkParsers = {
  // NOTE: please forget the idea to build the method name in runtime, it can be obfuscated.
  290: Remark290,
  350: Remark350,
};

class PDBParser extends Parser {
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

    this._options.fileType = 'pdb';
  }

  static canProbablyParse(data) {
    return _.isString(data) && pdbStartRegexp.test(data);
  }

  _finalize() {
    this._fixBondsArray();
    this._fixChains();

    // keep crystallographic symmetry transformations
    const remark290 = this._remarks[290];
    this._complex.symmetry = _.isUndefined(remark290) ? [] : remark290.matrices;

    // add loaded biological assemblies
    const remark350 = this._remarks[350];
    this._complex.units = this._complex.units.concat(_.isUndefined(remark350) ? [] : remark350.assemblies);

    // add loaded macromolecules
    this._finalizeMolecules();

    // create secondary structure etc.
    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });
  }

  _finalizeMolecules() {
    // get chains from complex
    const chainDict = {};
    let i;
    const chains = this._complex._chains;
    for (i = 0; i < chains.length; ++i) {
      const chainObj = chains[i];
      const chainName = chainObj._name;
      chainDict[chainName] = chainObj;
    }

    // aggregate residues from chains
    for (i = 0; i < this._molecules.length; i++) {
      const m = this._molecules[i];
      let residues = [];
      for (let j = 0; j < m._chains.length; j++) {
        const name = m._chains[j];
        const chain = chainDict[name];
        residues = residues.concat(chain._residues.slice());
      }
      const molecule = new Molecule(this._complex, m._name, i + 1);
      molecule.residues = residues;
      this._complex._molecules[i] = molecule;
    }
  }

  _fixChains() {
    const idChainMap = {};
    const complex = this._complex;

    // prepare
    for (let i = 0; i < complex._chains.length; i++) {
      const chain = complex._chains[i];
      idChainMap[chain._name.charCodeAt(0)] = chain;
    }
  }

  // FIXME: This function is redundant, CONECT records always follow ATOM and HETATM. Build the map online.
  _fixBondsArray() {
    const serialAtomMap = this._serialAtomMap = {};
    const complex = this._complex;

    const atoms = complex._atoms;
    for (let i = 0, ni = atoms.length; i < ni; ++i) {
      const atom = atoms[i];
      serialAtomMap[atom.serial] = atom;
    }

    const bonds = complex._bonds;
    const { logger } = this;
    for (let j = 0, nj = bonds.length; j < nj; ++j) {
      const bond = bonds[j];
      if (bond._right < bond._left) {
        logger.debug('_fixBondsArray: Logic error.');
      }
      bond._left = serialAtomMap[bond._left] || null;
      bond._right = serialAtomMap[bond._right] || null;
    }
  }

  _parseATOM(stream) {
    if (this._modelId !== 1) {
      return;
    }

    /* eslint-disable no-magic-numbers */
    const het = stream.readCharCode(1) === 0x48;

    // field names according to wwPDB Format
    // NOTE: Chimera allows (nonstandard) use of columns 6-11 for the integer atom serial number in ATOM records.
    const serial = het ? stream.readInt(7, 11) : stream.readInt(6, 11);
    let name = stream.readString(13, 16);
    const altLoc = stream.readChar(17);
    const resName = stream.readString(18, 20).trim();
    const chainID = stream.readChar(22);
    const resSeq = stream.readInt(23, 26);
    const iCode = stream.readChar(27);
    const x = stream.readFloat(31, 38);
    const y = stream.readFloat(39, 46);
    const z = stream.readFloat(47, 54);
    const occupancy = stream.readFloat(55, 60);
    const tempFactor = stream.readFloat(61, 66);
    const element = stream.readString(77, 78).trim() || nameToElement(name);
    const charge = stream.readInt(79, 80) || 0;
    /* eslint-enable no-magic-numbers */
    // skip waters (there may be lots of them)
    if (this.settings.now.nowater) {
      if (resName === 'HOH' || resName === 'WAT') {
        return;
      }
    }

    // PDB uses positional system for atom names. It helps derive element type from the name
    // but names may include extra spaces. From this point on we don't need those spaces anymore.
    name = name.trim();

    const type = Element.getByName(element);
    const role = Element.Role[name]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")

    // NOTE: Residues of a particular chain are not required to be listed next to each other.
    // https://github.com/biasmv/pv/commit/7319b898b7473ba380c26699e3b028b2b1a7e1a1
    let chain = this._chain;
    if (!chain || chain.getName() !== chainID) {
      this._chain = chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
      this._residue = null;
    }

    let residue = this._residue;
    if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
      this._residue = residue = chain.addResidue(resName, resSeq, iCode);
    }

    const xyz = new THREE.Vector3(x, y, z);
    residue.addAtom(name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge);
  }

  _parseENDMDL() {
    this._modelId += 1;
  }

  _parseCONECT(stream) {
    /* eslint-disable no-magic-numbers */
    const serial0 = stream.readInt(7, 11);
    const serial1 = stream.readInt(12, 16);
    const serial2 = stream.readInt(17, 21);
    const serial3 = stream.readInt(22, 26);
    const serial4 = stream.readInt(27, 31);
    /* eslint-enable no-magic-numbers */

    const complex = this._complex;

    // Keep bonds ordered by atom serial
    if (serial1 && serial1 > serial0) {
      complex.addBond(serial0, serial1, 0, Bond.BondType.UNKNOWN, true);
    }
    if (serial2 && serial2 > serial0) {
      complex.addBond(serial0, serial2, 0, Bond.BondType.UNKNOWN, true);
    }
    if (serial3 && serial3 > serial0) {
      complex.addBond(serial0, serial3, 0, Bond.BondType.UNKNOWN, true);
    }
    if (serial4 && serial4 > serial0) {
      complex.addBond(serial0, serial4, 0, Bond.BondType.UNKNOWN, true);
    }
  }

  _parseCOMPND(stream) {
    /* eslint-disable no-magic-numbers */
    const str = stream.readString(11, 80);
    const tokenIdx = str.indexOf(':');
    this._compndCurrToken = tokenIdx > 0 ? str.substring(0, tokenIdx).trim() : this._compndCurrToken;
    /* eslint-enable no-magic-numbers */

    // start reading new molecule
    if (this._compndCurrToken === 'MOL_ID') {
      this._molecule = { _index: '', _chains: [] };
      this._molecule._index = parseInt(str.substring(tokenIdx + 1, str.indexOf(';')), 10);
      this._molecules.push(this._molecule);
      // parse molecule name
    } else if (this._compndCurrToken === 'MOLECULE' && this._molecule != null) {
      this._molecule._name = str.substring(tokenIdx + 1, str.indexOf(';')).trim();
      // parse molecule chains
    } else if (this._compndCurrToken === 'CHAIN' && this._molecule != null) {
      let chainStr = str.substring(tokenIdx + 1, 80).trim();
      const lastChar = chainStr[chainStr.length - 1];
      if (lastChar === ';' || lastChar === ',') {
        chainStr = chainStr.slice(0, -1);
      }
      chainStr = chainStr.replace(/\s+/g, '');
      const chains = chainStr.split(',');
      this._molecule._chains = this._molecule._chains.concat(chains);
    }
  }

  _parseREMARK(stream) {
    /* eslint-disable no-magic-numbers */
    const remarkNum = stream.readInt(8, 10);
    /* eslint-enable no-magic-numbers */

    // create remark parser if needed
    let remark = this._remarks[remarkNum];
    if (_.isUndefined(remark)) {
      const RemarkParser = remarkParsers[remarkNum];
      if (_.isFunction(RemarkParser)) {
        this._remarks[remarkNum] = remark = new RemarkParser(this._complex);
      }
    }

    // delegate parsing
    if (!_.isUndefined(remark)) {
      remark.parse(stream);
    }
  }

  _parseHELIX(stream) {
    /* eslint-disable no-magic-numbers */
    const fields = [20, 22, 32, 34];
    /* eslint-enable no-magic-numbers */
    this._parseSTRUCTURE(stream, fields, (obj) => {
      this._complex.addHelix(obj);
      this._complex.structures.push(obj);
    });
  }

  _parseSHEET(stream) {
    /* eslint-disable no-magic-numbers */
    const fields = [22, 23, 33, 34];
    /* eslint-enable no-magic-numbers */
    this._parseSTRUCTURE(stream, fields, (obj) => {
      this._complex.addSheet(obj);
    });
  }

  _parseSTRUCTURE(stream, pars, adder) {
    const startId = 0;
    const startIndex = 1;
    const endId = 2;
    const endIndex = 3;

    // identify fields: debugging and stuff
    /* eslint-disable no-magic-numbers */
    const codeOfS = 0x53;
    const serialNumber = stream.readInt(8, 10);
    const structureName = stream.readString(12, 14).trim(); // FIXME: LString(3) forbids trim()
    const comment = stream.readString(41, 70).trim();
    const helLength = stream.readInt(72, 76);
    const helixClass = stream.readInt(39, 40);
    const shWidth = stream.readInt(15, 16);
    const shCur = stream.readInt(42, 45);
    const shPrev = stream.readInt(57, 60);
    /* eslint-enable no-magic-numbers */
    // file fields
    const startChainID = stream.readString(pars[startId], pars[endId] + 1).charCodeAt(0);
    const endChainID = stream.readString(pars[endId], pars[endId] + 1).charCodeAt(0);
    const startSequenceNumber = stream.readInt(pars[startIndex], pars[startIndex] + 3);
    let iCodeStr = stream.readString(pars[startIndex] + 4, pars[startIndex] + 4);
    let startICode = 0;

    if (iCodeStr.length > 0) {
      startICode = iCodeStr.charCodeAt(0);
    }
    const endSequenceNumber = stream.readInt(pars[endIndex], pars[endIndex] + 3);
    iCodeStr = stream.readString(pars[endIndex] + 4, pars[endIndex] + 4);
    let endICode = 0;
    if (iCodeStr.length > 0) {
      endICode = iCodeStr.charCodeAt(0);
    }

    let obj;
    let cs = this._sheet;
    if (stream.readCharCode(1) === codeOfS) {
      if (cs !== null && cs.getName() !== structureName) {
        cs = null;
        this._sheet = null;
      }
      if (cs === null) {
        this._sheet = obj = new Sheet(structureName, shWidth);
        adder(obj);
      } else {
        obj = cs;
      }
      const strand = new Strand(
        obj,
        this._complex.getUnifiedSerial(startChainID, startSequenceNumber, startICode),
        this._complex.getUnifiedSerial(endChainID, endSequenceNumber, endICode),
        helixClass,
        shCur,
        shPrev,
      );
      obj.addStrand(strand);
      this._complex.structures.push(strand);
    } else {
      obj = new Helix(
        helixClass,
        this._complex.getUnifiedSerial(startChainID, startSequenceNumber, startICode),
        this._complex.getUnifiedSerial(endChainID, endSequenceNumber, endICode),
        serialNumber,
        structureName,
        comment,
        helLength,
      );
      adder(obj);
    }
  }

  _parseHEADER(stream) {
    const { metadata } = this._complex;
    metadata.classification = stream.readString(11, 50).trim();
    metadata.date = stream.readString(51, 59).trim();

    const id = stream.readString(63, 66).trim();
    metadata.id = id;
    if (id) {
      this._complex.name = id;
    }
    metadata.format = 'pdb';
  }

  _parseTITLE(stream) {
    const { metadata } = this._complex;
    metadata.title = metadata.title || [];

    const line = stream.readInt(9, 10) || 1;
    metadata.title[line - 1] = stream.readString(11, 80).trim();
  }

  static tagParsers = {
    HEADER: PDBParser.prototype._parseHEADER,
    'TITLE ': PDBParser.prototype._parseTITLE,
    'ATOM  ': PDBParser.prototype._parseATOM,
    HETATM: PDBParser.prototype._parseATOM,
    ENDMDL: PDBParser.prototype._parseENDMDL,
    CONECT: PDBParser.prototype._parseCONECT,
    COMPND: PDBParser.prototype._parseCOMPND,
    REMARK: PDBParser.prototype._parseREMARK,
    // 'SOURCE': PDBParser.prototype._parseSOURCE,
    'HELIX ': PDBParser.prototype._parseHELIX,
    'SHEET ': PDBParser.prototype._parseSHEET,

    // nonstandard extension to allow range 100,000 - 999,999
    'ATOM 1': PDBParser.prototype._parseATOM,
    'ATOM 2': PDBParser.prototype._parseATOM,
    'ATOM 3': PDBParser.prototype._parseATOM,
    'ATOM 4': PDBParser.prototype._parseATOM,
    'ATOM 5': PDBParser.prototype._parseATOM,
    'ATOM 6': PDBParser.prototype._parseATOM,
    'ATOM 7': PDBParser.prototype._parseATOM,
    'ATOM 8': PDBParser.prototype._parseATOM,
    'ATOM 9': PDBParser.prototype._parseATOM,
  };

  parseSync() {
    const stream = new PDBStream(this._data);
    const result = this._complex = new Complex();

    // parse PDB line by line
    while (!stream.end()) {
      const tag = stream.readString(1, TAG_LENGTH);
      const func = PDBParser.tagParsers[tag];
      if (_.isFunction(func)) {
        func.call(this, stream);
      }
      stream.next();
    }

    // Resolve indices and serials to objects
    this._finalize();

    // cleanup
    this._serialAtomMap = null;
    this._sheet = null;
    this._residue = null;
    this._chain = null;
    this._complex = null;

    if (result.getAtomCount() === 0) {
      throw new Error('The data does not contain valid atoms');
    }

    return result;
  }
}

PDBParser.formats = ['pdb'];
PDBParser.extensions = ['.pdb', '.ent'];

export default PDBParser;
