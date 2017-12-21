

import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';
import Remark290 from './pdb/Remark290';
import Remark350 from './pdb/Remark350';
import PDBStream from './PDBStream';

var
  Complex = chem.Complex,
  Element = chem.Element,
  Helix = chem.Helix,
  Sheet = chem.Sheet,
  Strand = chem.Strand,
  Bond = chem.Bond,
  Molecule = chem.Molecule;

var TAG_LENGTH = 6;

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

  var veryLong = name.trim().length === 4;
  return name.slice(0, veryLong ? 1 : 2).trim();
}

function PDBParser(data, options) {
  Parser.call(this, data, options);

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

////////////////////////////////////////////////////////////////////////////
// Inheritance

PDBParser.prototype = Object.create(Parser.prototype);
PDBParser.prototype.constructor = PDBParser;

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
PDBParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  return (typeof data === 'string') &&
    (Parser.checkDataTypeOptions(options, 'pdb') || Parser.checkDataTypeOptions(options, 'pdb', '.ent'));
};

// the most frequently used beginnings; although HEADER is mandatory, it is often missing in handmade files
const pdbStartRegexp = /^(HEADER\s|COMPND\s|REMARK\s|ATOM {2}|HETATM|MODEL )/i;

PDBParser.canProbablyParse = function(data) {
  return _.isString(data) && pdbStartRegexp.test(data);
};

////////////////////////////////////////////////////////////////////////////
// Instance methods

PDBParser.prototype._finalize = function() {
  // console.time('PDBParser._finalize');
  this._fixBondsArray();
  this._fixChains();

  // keep crystallographic symmetry transformations
  var remark290 = this._remarks[290];
  this._complex.symmetry = _.isUndefined(remark290) ? [] : remark290.matrices;

  // add loaded biological assemblies
  var remark350 = this._remarks[350];
  this._complex.structures = this._complex.structures.concat(_.isUndefined(remark350) ? [] : remark350.assemblies);

  // add loaded macromolecules
  this._finalizeMolecules();

  // create secondary structure etc.
  this._complex.finalize({
    needAutoBonding: true,
    detectAromaticLoops: this.settings.now.aromatic,
    enableEditing: this.settings.now.editing,
    serialAtomMap: this._serialAtomMap
  });

};

PDBParser.prototype._finalizeMolecules = function() {
  // get chains from complex
  var chainDict = {};
  var i;
  var chains = this._complex._chains;
  for (i = 0; i < chains.length; ++i) {
    var chainObj = chains[i];
    var chainName  = chainObj._name;
    chainDict[chainName] = chainObj;
  }

  // aggregate residues from chains
  for (i = 0; i < this._molecules.length; i++) {
    var m = this._molecules[i];
    var residues = [];
    for (var j = 0; j < m._chains.length; j++) {
      var name = m._chains[j];
      var chain = chainDict[name];
      residues = residues.concat(chain._residues.slice());
    }
    var molecule = new Molecule(this._complex, m._name, i + 1);
    molecule._residues = residues;
    this._complex._molecules[i] = molecule;
  }
};

PDBParser.prototype._fixChains = function() {
  var idChainMap = {};
  var complex = this._complex;

  //prepare
  for (var i = 0; i < complex._chains.length; i++) {
    var chain = complex._chains[i];
    idChainMap[chain._name.charCodeAt(0)] = chain;
  }
};

/* NOTE: Slow and clumsy. And only for badly formatted files.
  PDBParser.prototype._atomNameScan = function(str) {
    var i = 0;
    var code = null;
    var codeA = 'A'.charCodeAt(0);
    var codeZ = 'Z'.charCodeAt(0);
    var s = str.toUpperCase();
    for (i = s.length - 1; i >= 0; i--) { // FIXME: What for?
      code = s.charCodeAt(i);
      if (codeA <= code && code <= codeZ) {
        continue;
      } else {
        s = s.slice(0, i) + s.slice(i + 1, s.length);
      }
    }
    return s;
  };
  */

// FIXME: This function is redundant, CONECT records always follow ATOM and HETATM. Build the map online.
PDBParser.prototype._fixBondsArray = function() {
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
};

PDBParser.prototype._parseATOM = function(stream) {
  if (this._modelId !== 1) {
    return;
  }

  /* eslint-disable no-magic-numbers */
  var het        = stream.readCharCode(1) === 0x48;

  // field names according to wwPDB Format
  // NOTE: Chimera allows (nonstandard) use of columns 6-11 for the integer atom serial number in ATOM records.
  var serial     = het ? stream.readInt(7, 11) : stream.readInt(6, 11);
  var name       = stream.readString(13, 16);
  var altLoc     = stream.readChar(17);
  var resName    = stream.readString(18, 20).trim();
  var chainID    = stream.readChar(22);
  var resSeq     = stream.readInt(23, 26);
  var iCode      = stream.readChar(27);
  var x          = stream.readFloat(31, 38);
  var y          = stream.readFloat(39, 46);
  var z          = stream.readFloat(47, 54);
  var occupancy  = stream.readFloat(55, 60);
  var tempFactor = stream.readFloat(61, 66);
  var element    = stream.readString(77, 78).trim() || nameToElement(name);
  var charge     = stream.readInt(79, 80) || 0;
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

  var type = Element.getByName(element);
  var role = Element.Role[name]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")

  // NOTE: Residues of a particular chain are not required to be listed next to each other.
  // https://github.com/biasmv/pv/commit/7319b898b7473ba380c26699e3b028b2b1a7e1a1
  var chain = this._chain;
  if (!chain || chain.getName() !== chainID) {
    this._chain = chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
    this._residue = null;
  }

  var residue = this._residue;
  if (!residue || residue.getSequence() !== resSeq || residue.getICode() !== iCode) {
    this._residue = residue = chain.addResidue(resName, resSeq, iCode);
  }

  // TODO: optimize atom positions storage? what for? (and occupancy? tempFactor?)
  var xyz = new THREE.Vector3(x, y, z);
  residue.addAtom(name, type, xyz, role, het, serial, altLoc, occupancy, tempFactor, charge);
};

PDBParser.prototype._parseENDMDL = function() {
  this._modelId += 1;
};

PDBParser.prototype._parseCONECT = function(stream) {
  /* eslint-disable no-magic-numbers */
  var serial0 = stream.readInt(7, 11);
  var serial1 = stream.readInt(12, 16);
  var serial2 = stream.readInt(17, 21);
  var serial3 = stream.readInt(22, 26);
  var serial4 = stream.readInt(27, 31);
  /* eslint-enable no-magic-numbers */

  var complex = this._complex;

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
};

PDBParser.prototype._parseCOMPND = function(stream) {
  /* eslint-disable no-magic-numbers */
  var str = stream.readString(11, 80);
  var tokenIdx = str.indexOf(':');
  this._compndCurrToken  = tokenIdx > 0 ? str.substring(0, tokenIdx).trim() : this._compndCurrToken;
  /* eslint-enable no-magic-numbers */

  // start reading new molecule
  if (this._compndCurrToken === 'MOL_ID') {
    this._molecule = {_index: '', _chains: []};
    this._molecule._index = parseInt(str.substring(tokenIdx + 1, str.indexOf(';')), 10);
    this._molecules.push(this._molecule);
    // parse molecule name
  } else if (this._compndCurrToken === 'MOLECULE' && this._molecule != null) {
    this._molecule._name = str.substring(tokenIdx + 1, str.indexOf(';')).trim();
    // parse molecule chains
  } else if (this._compndCurrToken === 'CHAIN' && this._molecule != null) {
    var chainStr = str.substring(tokenIdx + 1, 80).trim();
    var lastChar = chainStr[chainStr.length - 1];
    if (lastChar === ';' || lastChar === ',') {
      chainStr = chainStr.slice(0, -1);
    }
    chainStr = chainStr.replace(/\s+/g, '');
    var chains = chainStr.split(',');
    this._molecule._chains = this._molecule._chains.concat(chains);
  }
};

var remarkParsers = {
  // NOTE: please forget the idea to build the method name in runtime, it can be obfuscated.
  290: Remark290,
  350: Remark350,
};

PDBParser.prototype._parseREMARK = function(stream) {
  /* eslint-disable no-magic-numbers */
  var remarkNum = stream.readInt(8, 10);
  /* eslint-enable no-magic-numbers */

  // create remark parser if needed
  var remark = this._remarks[remarkNum];
  if (_.isUndefined(remark)) {
    var RemarkParser = remarkParsers[remarkNum];
    if (_.isFunction(RemarkParser)) {
      this._remarks[remarkNum] = remark = new RemarkParser(this._complex);
    }
  }

  // delegate parsing
  if (!_.isUndefined(remark)) {
    remark.parse(stream);
  }
};

PDBParser.prototype._parseHELIX = function(stream) {
  /* eslint-disable no-magic-numbers */
  var fields = [20, 22, 32, 34];
  /* eslint-enable no-magic-numbers */
  this._parseSTRUCTURE(stream, fields, function(obj) {
    this._complex.addHelix(obj);
  }.bind(this));
};

PDBParser.prototype._parseSHEET = function(stream) {
  /* eslint-disable no-magic-numbers */
  var fields = [22, 23, 33, 34];
  /* eslint-enable no-magic-numbers */
  this._parseSTRUCTURE(stream, fields, function(obj) {
    this._complex.addSheet(obj);
  }.bind(this));
};

PDBParser.prototype._parseSTRUCTURE = function(stream, pars, adder) { // FIXME: HELIX and SHEET have nothing in common

  var startId = 0;
  var startIndex = 1;
  var endId = 2;
  var endIndex = 3;

  //identify fields: debugging and stuff
  /* eslint-disable no-magic-numbers */
  var codeOfS = 0x53;
  //var twoLinesMaxLen = 2 * 80;
  var serialNumber = stream.readInt(8, 10);
  var structureName = stream.readString(12, 14).trim(); // FIXME: LString(3) forbids trim()
  var comment = stream.readString(41, 70).trim();
  var helLength = stream.readInt(72, 76);
  var helType = stream.readInt(39, 40);
  var shWidth = stream.readInt(15, 16);
  var shCur = stream.readInt(42, 45);
  var shPrev = stream.readInt(57, 60);
  /* eslint-enable no-magic-numbers */
  //file fields
  var startChainID = stream.readString(pars[startId], pars[endId] + 1).charCodeAt(0); // FIXME: no need in these
  var endChainID = stream.readString(pars[endId], pars[endId] + 1).charCodeAt(0);
  var startSequenceNumber = stream.readInt(pars[startIndex], pars[startIndex] + 3);
  var iCodeStr = stream.readString(pars[startIndex] + 4, pars[startIndex] + 4);
  var startICode = 0;

  if (iCodeStr.length > 0) {
    startICode = iCodeStr.charCodeAt(0);
  }
  var endSequenceNumber = stream.readInt(pars[endIndex], pars[endIndex] + 3);
  iCodeStr = stream.readString(pars[endIndex] + 4, pars[endIndex] + 4);
  var endICode = 0;
  if (iCodeStr.length > 0) {
    endICode = iCodeStr.charCodeAt(0);
  }

  var obj;
  var cs = this._sheet;
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
    var strand = new Strand(
      obj,
      this._complex.getUnifiedSerial(startChainID, startSequenceNumber, startICode),
      this._complex.getUnifiedSerial(endChainID, endSequenceNumber, endICode), helType,
      shCur, shPrev
    );
    obj.addStrand(strand);
  } else {
    obj = new Helix(
      serialNumber, structureName,
      this._complex.getUnifiedSerial(startChainID, startSequenceNumber, startICode),
      this._complex.getUnifiedSerial(endChainID, endSequenceNumber, endICode), helType, comment, helLength
    );
    adder(obj);
  }
};

PDBParser.prototype._parseHEADER = function(stream) {
  var metadata = this._complex.metadata;
  metadata.classification = stream.readString(11, 50).trim();
  metadata.date = stream.readString(51, 59).trim();

  var id = stream.readString(63, 66).trim();
  metadata.id = id;
  if (id) {
    this._complex.name = id;
  }
};

PDBParser.prototype._parseTITLE = function(stream) {
  var metadata = this._complex.metadata;
  metadata.title = metadata.title || [];

  var line = stream.readInt(9, 10) || 1;
  metadata.title[line - 1] = stream.readString(11, 80).trim();
};

var tagParsers = {
  'HEADER': PDBParser.prototype._parseHEADER,
  'TITLE ': PDBParser.prototype._parseTITLE,
  'ATOM  ': PDBParser.prototype._parseATOM,
  'HETATM': PDBParser.prototype._parseATOM,
  'ENDMDL': PDBParser.prototype._parseENDMDL,
  'CONECT': PDBParser.prototype._parseCONECT,
  'COMPND': PDBParser.prototype._parseCOMPND,
  'REMARK': PDBParser.prototype._parseREMARK,
  // 'SOURCE': PDBParser.prototype._parseSOURCE,
  'HELIX ': PDBParser.prototype._parseHELIX,
  'SHEET ': PDBParser.prototype._parseSHEET,

  // FIXME: HACK: nonstandard extension to allow range 100,000 - 999,999
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

PDBParser.prototype.parseSync = function() {
  const stream = new PDBStream(this._data);
  const result = this._complex = new Complex();

  // parse PDB line by line
  while (!stream.end()) {
    const tag = stream.readString(1, TAG_LENGTH);
    const func = tagParsers[tag];
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
};

PDBParser.formats = ['pdb'];
PDBParser.extensions = ['.pdb', '.ent'];

export default PDBParser;
