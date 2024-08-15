import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import SDFStream from './SDFStream';
import Assembly from '../../chem/Assembly';

const {
  Complex,
  Element,
  Bond,
  Molecule,
} = chem;

const chargeMap = [0, 3, 2, 1, 0, -1, -2, -3];
const orderMap = [0, 1, 2, 3, 1, 1, 1, 2];
const typeMap = [
  Bond.BondType.UNKNOWN, // 0 - error
  Bond.BondType.COVALENT, // 1 - single
  Bond.BondType.COVALENT, // 2 - double
  Bond.BondType.COVALENT, // 3 - triple
  Bond.BondType.AROMATIC, // 4 - aromatic
  Bond.BondType.UNKNOWN, // 5 - single or double
  Bond.BondType.AROMATIC, // 6 - single or aromatic
  Bond.BondType.AROMATIC, // 7 - double or aromatic
  // 8 - any
  // 9 - coordination
  // 10 - hydrogen
];

const sdfAndMolRegexp = /.*(M\s\sEND).*|.*(^$$$$).*|.*>\s+<(.+)>.*/;
const sdfRegExp = /.*($$$$).*|.*>\s+<(.+)>.*/;

const fileFormat = { SDF: 'sdf', MOL: 'mol' };

const possibleNameTags = ['PUBCHEM_IUPAC_TRADITIONAL_NAME', /PUBCHEM_(.+)_NAME/, /(.+)name/, /(.+)NAME/];
const possibleIDTags = ['PUBCHEM_COMPOUND_CID', 'id', 'ID', /.*CID/, /.*ID/, /.*id/];
const possibleTitleTags = ['msg', 'MSG', 'message', 'title', 'description', 'desc'];
const tagsNames = ['name', 'id', 'title'];
const tags = { name: possibleNameTags, id: possibleIDTags, title: possibleTitleTags };

function buildChainID(index) {
  if (!index) {
    return 'A';
  }

  const codes = [];
  while (index) {
    codes.push(65 + (index % 26));
    index = Math.trunc(index / 26);
  }
  if (codes.length > 1) {
    codes.reverse();
    codes[0] -= 1;
  }

  return String.fromCharCode(...codes);
}

export default class SDFParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._format = 'sdf';
    this._complex = null;
    this._chain = null;
    this._residue = null;
    this._molecules = null;
    this._metadata = {};
    this._metadata.molecules = [];
    this._currentMolProps = {};
    this._compoundIndx = -1;
    this._assemblies = [];
    this._atomsParsed = 0;
    this._atomsIndexes = [];
  }

  canProbablyParse(data) {
    return _.isString(data) && sdfAndMolRegexp.test(data);
  }

  _parseHeader(stream) {
    const molecule = {};
    molecule.name = stream.getStringFromStart(0);
    const date = parseInt(stream.getStringFromStart(1).substr(10, 6).trim(), 10);
    molecule.date = date.toString() || '';
    molecule.title = stream.getStringFromStart(2);
    this._metadata.molecules.push(molecule);
  }

  _parseAtoms(stream, atomsNum) {
    let curStr;
    let serial = this._atomsParsed;

    // each molecule = chain\residue
    const chainID = buildChainID(this._compoundIndx);
    const resName = 'UNK';
    const resSeq = 1;

    this._chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
    this._residue = this._chain.addResidue(resName, resSeq, ' ');

    for (let i = 0; i < atomsNum; i++) {
      curStr = stream.getNextString();
      serial++;
      const x = parseFloat(curStr.substr(0, 10));
      const y = parseFloat(curStr.substr(10, 10));
      const z = parseFloat(curStr.substr(20, 10));
      const charge = chargeMap[parseInt(curStr.substr(36, 3), 10)];
      const xyz = new THREE.Vector3(x, y, z);
      let name = curStr.substr(31, 3).trim().toUpperCase();
      const type = Element.getByName(name);
      if (!this._atomsIndexes[name]) {
        this._atomsIndexes[name] = 0;
      }
      this._atomsIndexes[name] += 1;
      name += this._atomsIndexes[name]; // every atom need to have unique name.

      this._residue.addAtom(name, type, xyz, undefined, true, serial, ' ', 1.0, 0.0, charge);
    }
  }

  _parseBonds(stream, bondsNum) {
    let curStr;

    for (let i = 0; i < bondsNum; i++) {
      curStr = stream.getNextString();
      let atom1 = parseInt(curStr.substr(0, 3), 10) + this._atomsParsed;
      let atom2 = parseInt(curStr.substr(3, 3), 10) + this._atomsParsed;
      const bondType = parseInt(curStr.substr(6, 3), 10);

      if (atom1 > atom2) {
        [atom1, atom2] = [atom2, atom1];
      }
      this._complex.addBond(
        atom1,
        atom2,
        orderMap[bondType] || 1,
        typeMap[bondType] || Bond.BondType.UNKNOWN,
        true,
      );
    }
  }

  _parseMOL(stream) {
    this._compoundIndx++;

    this._parseHeader(stream);
    const countsLine = stream.getStringFromStart(3);
    const atomsNum = parseInt(countsLine.substr(0, 3), 10);
    const bondsNum = parseInt(countsLine.substr(3, 3), 10);
    this._parseAtoms(stream, atomsNum);
    this._parseBonds(stream, bondsNum);

    this._atomsParsed += atomsNum;

    this._metadata.molecules[this._compoundIndx]._residues = [];
    this._metadata.molecules[this._compoundIndx]._residues.push(this._residue);
  }

  _parseDataItem(stream) {
    const tag = stream.getCurrentString();

    let data = [];
    let curStr = stream.getNextString();

    // read data
    while (curStr.trim() !== '') {
      data.push(curStr);
      curStr = stream.getNextString();
    }
    if (data.length === 1) {
      [data] = data;
    }
    this._currentMolProps[tag.replace(/[<>]/g, '').trim()] = data;
  }

  _parseCompound(stream) {
    this._parseMOL(stream);

    // parse data items block
    if (this._format === fileFormat.SDF) {
      this._currentMolProps = {};
      while (stream.findNextDataItem()) {
        this._parseDataItem(stream);
      }
      if (Object.keys(this._currentMolProps).length !== 0) {
        const molecule = this._metadata.molecules[this._compoundIndx];
        molecule.props = this._currentMolProps;
        this._tryToUpdateMoleculeData(molecule);
      }
    }
  }

  _fixBondsArray() {
    const serialAtomMap = this._serialAtomMap;
    const complex = this._complex;

    const bonds = complex._bonds;
    for (let j = 0; j < bonds.length; j++) {
      const bond = bonds[j];
      if (bond._right < bond._left) {
        console.log('_fixBondsArray: Logic error.');
      }
      bond._left = serialAtomMap[bond._left] || null;
      bond._right = serialAtomMap[bond._right] || null;
    }
  }

  _buildAssemblies() {
    const chains = this._complex._chains;

    if (chains.length === 1) {
      return this._assemblies;
    }

    for (let i = 0; i < chains.length; i++) {
      const assembly = new Assembly(this._complex);
      const matrix = new THREE.Matrix4();
      assembly.addMatrix(matrix);
      assembly.addChain(chains[i]._name);
      this._assemblies.push(assembly);
    }

    return this._assemblies;
  }

  _buildMolecules() {
    this._complex._molecules = [];
    const { molecules } = this._metadata;
    for (let i = 0; i < molecules.length; i++) {
      const molecule = new Molecule(this._complex, molecules[i].name, i + 1);
      molecule.residues = molecules[i]._residues;
      this._complex._molecules[i] = molecule;
    }

    return this._complex._molecules;
  }

  _searchTag(tag, props) {
    for (let i = 0; i < props.length; i++) {
      if ((tag instanceof RegExp && tag.test(props[i].tag)) || tag === props[i].tag) {
        return props[i].data;
      }
    }
    return undefined;
  }

  _tryToFind(tagsList, props) {
    for (let j = 0; j < tagsList.length; j++) {
      const res = this._searchTag(tagsList[j], props);
      if (res) {
        return res;
      }
    }
    return undefined;
  }

  _tryToUpdateMoleculeData(molecule) {
    let res = false;
    for (let i = 0; i < tagsNames.length; i++) {
      const tagPossibleNames = tags[tagsNames[i]];
      const data = this._tryToFind(tagPossibleNames, molecule.props);
      if (data) {
        molecule[tagsNames[i]] = data;
        res = true;
      }
    }

    molecule.name = molecule.name || molecule.id;
    if (molecule.name.match(/^\d+$/)) {
      molecule.name = `CID: ${molecule.name}`;
    }

    return res;
  }

  _finalizeMetadata() {
    const { molecules } = this._metadata;
    const { metadata } = this._complex;
    const complex = this._complex;

    if (molecules.length === 1) {
      complex.name = molecules[0].name;
      metadata.title = molecules[0].title;
      metadata.date = molecules[0].date;
      metadata.properties = molecules[0].props;
    } else if (molecules.length > 1) {
      metadata.molecules = [];
      for (let i = 0; i < molecules.length; i++) {
        metadata.molecules.push({
          name: molecules[i].name, date: molecules[i].date, title: molecules[i].title, properties: molecules[i].props,
        });
      }
    }
  }

  _finalize() {
    const serialAtomMap = this._serialAtomMap = {};
    const atoms = this._complex._atoms;

    for (let i = 0; i < atoms.length; i++) {
      const atom = atoms[i];
      serialAtomMap[atom.serial] = atom;
    }

    this._complex._finalizeBonds();
    this._fixBondsArray();
    this._finalizeMetadata();
    this._buildAssemblies();
    this._complex.units = this._complex.units.concat(this._assemblies);
    this._buildMolecules();
    this._complex.finalize({
      needAutoBonding: false, detectAromaticLoops: false, enableEditing: false, serialAtomMap: this._serialAtomMap,
    });
  }

  defineFormat(data) {
    let format;
    if (sdfRegExp.test(data)) {
      format = fileFormat.SDF;
    } else {
      format = fileFormat.MOL;
    }

    return format;
  }

  parseSync() {
    const result = this._complex = new Complex();
    const stream = new SDFStream(this._data);

    this._format = this.defineFormat(this._data);
    result.metadata.format = this._format;

    do {
      this._parseCompound(stream);
    } while (stream.findNextCompoundStart());

    this._finalize();

    return result;
  }
}

SDFParser.formats = ['mol', 'sdf'];
SDFParser.extensions = ['.mol', '.sdf'];
