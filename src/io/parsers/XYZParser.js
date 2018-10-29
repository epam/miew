import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import _ from 'lodash';

var
  Complex = chem.Complex,
  Element = chem.Element,
  Molecule = chem.Molecule;

function XYZParser(data, options) {
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

  this._options.fileType = 'xyz';
}

////////////////////////////////////////////////////////////////////////////
// Inheritance

XYZParser.prototype = Object.create(Parser.prototype);
XYZParser.prototype.constructor = XYZParser;

////////////////////////////////////////////////////////////////////////////
// Class methods

/** @deprecated */
XYZParser.canParse = function(data, options) {
  if (!data) {
    return false;
  }
  return typeof data === 'string' && Parser.checkDataTypeOptions(options, 'xyz');
};

XYZParser.canProbablyParse = function(data) {
  return _.isString(data) && /^\s*data_/i.test(data);
};

////////////////////////////////////////////////////////////////////////////
// Instance methods

XYZParser._parseToObject = function(source) {
  let lines = source.split(/\s*\n\s*/);

  let nAtoms = parseInt(lines[0], 10);
  let comment = lines[1];

  var metadata = this._complex.metadata;
  //metadata.classification = comment;
  metadata.date = ' ';

  //metadata.id = comment;
  //metadata.title = comment;
  this._complex.name = comment;
  metadata.format = 'xyz';

  this._molecule = {_index: '', _chains: []};
  this._molecule._index = 0;
  this._molecule._name = 'UNKNOWN';
  this._molecules.push(this._molecule);

  this._molecule._chains = this._molecule._chains.concat('U');
  var chain = this._chain;
  this._chain = chain = this._complex.addChain('U');

  var residue = this._residue;
  this._residue = residue = chain.addResidue('unknown', 0, ' ');

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
  //connect
}

XYZParser.prototype._fixChains = function() {
  var idChainMap = {};
  var complex = this._complex;

  //prepare
  for (var i = 0; i < complex._chains.length; i++) {
    var chain = complex._chains[i];
    idChainMap[chain._name.charCodeAt(0)] = chain;
  }
};

XYZParser.prototype._fixBondsArray = function() {
  var serialAtomMap = this._serialAtomMap = {};
  var complex = this._complex;

  var atoms = complex._atoms;
  var i = 0, ni = atoms.length;
  for (; i < ni; ++i) {
    var atom = atoms[i];
    serialAtomMap[atom._serial] = atom;
  }

  /*var bonds = complex._bonds;
  var j = 0, nj = bonds.length;
  var logger = this.logger;
  for (; j < nj; ++j) {
    var bond = bonds[j];
    if (bond._right < bond._left) {
      logger.debug('_fixBondsArray: Logic error.');
    }
    bond._left = serialAtomMap[bond._left] || null;
    bond._right = serialAtomMap[bond._right] || null;
  }*/
};

XYZParser.prototype._finalizeMolecules = function() {
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

XYZParser.prototype.parseSync = function() {
  const result = this._complex = new Complex();

  XYZParser._parseToObject.call(this, this._data);


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
};

XYZParser.formats = ['xyz'];
XYZParser.extensions = ['.xyz'];

export default XYZParser;
