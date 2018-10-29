import Parser from './Parser';
import chem from '../../chem';
import * as THREE from 'three';
import SDFStream from './SDFStream';
import Assembly from '../../chem/Assembly';

const
  Complex = chem.Complex,
  Element = chem.Element,
  Bond = chem.Bond,
  Molecule = chem.Molecule;

const chargeMap = [0, 3, 2, 1, 0, -1, -2, -3];
const bondsMap = [
  Bond.BondType.UNKNOWN,
  Bond.BondType.COVALENT,
  Bond.BondType.COVALENT,
  Bond.BondType.COVALENT,
  Bond.BondType.AROMATIC
];

const sdfAndMolRegexp = /.*(M\s\sEND).*|.*(^$$$$).*|.*>\s+<(.+)>.*/;
const sdfRegExp = /.*($$$$).*|.*>\s+<(.+)>.*/;

const possibleNameTags = ['PUBCHEM_IUPAC_TRADITIONAL_NAME', /PUBCHEM_(.+)_NAME/, 'name', 'NAME'];
const possibleIDTags = ['PUBCHEM_COMPOUND_CID', 'id', 'ID', /.*CID.*/, /.*ID.*/, /.*id.*/];
const possibleTitleTags = ['msg', 'message', 'title', 'description', 'desc', /.*desc.*/];
const tagsNames = ['name', 'id', 'title'];
const tags = {'name':  possibleNameTags, 'id': possibleIDTags, 'title': possibleTitleTags};

export default class SDFParser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._complex = null;
    this._chain = null;
    this._residue = null;
    this._molecules = null;
    this._metadata = {};
    this._metadata.molecules = [];
    this._currentMolProps = [];
    this._compoundIndx = -1;
    this._assemblies = [];
    this._atomsParsed = 0;
  }

  canProbablyParse(data) {
    const res = sdfAndMolRegexp.test(data);
    return _.isString(data) && res;
  }

  _parseHeader(stream) {
    const molecule = {};
    molecule.name = stream.getStringFromStart(0);
    molecule.date = parseInt(stream.getStringFromStart(1).substr(10, 6).trim(), 10) || '';
    molecule.title = stream.getStringFromStart(2);
    this._metadata.molecules.push(molecule);
  }

  _parseAtoms(stream, atomsNum) {
    let curStr;
    let globalSerial;
    let localSerial = 0;

    for (let i = 0; i < atomsNum; i++) {
      curStr = stream.getNextString();
      localSerial++;
      globalSerial = this._atomsParsed + localSerial;
      const occupancy = 1.0;
      const x = parseFloat(curStr.substr(0, 10));
      const y = parseFloat(curStr.substr(10, 10));
      const z = parseFloat(curStr.substr(20, 10));
      const charge = chargeMap[parseInt(curStr.substr(36, 3), 10)];
      let xyz = new THREE.Vector3(x, y, z);
      let name = curStr.substr(31, 3).trim().toUpperCase();
      const type = Element.getByName(name);
      name += 'A' + globalSerial;
      const role = Element.Role[name];

      const chainID = 'C' + this._compoundIndx;
      const resName = 'R' + this._compoundIndx;
      const resSeq = resName;
      let chain = this._chain;
      if (!chain || chain.getName() !== chainID) {
        this._chain = chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);
        this._residue = null;
      }

      let residue = this._residue;
      if (!residue || residue.getSequence() !== resSeq) {
        this._residue = residue = chain.addResidue(resName, resSeq, '');
      }

      residue.addAtom(name, type, xyz, role, false, globalSerial, '', occupancy, 0.0, charge);
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
      this._complex.addBond(atom1, atom2, 0, bondsMap[bondType], true);
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

    let curStr;
    do {
      curStr = stream.getNextString();
    } while (curStr !== 'M  END');

    this._atomsParsed += atomsNum;

    this._metadata.molecules[this._compoundIndx]._residues = [];
    this._metadata.molecules[this._compoundIndx]._residues.push(this._residue);
  }

  _parseDataItem(stream) {
    const tag = stream.getCurrentString();
    let data = [];
    let curStr = stream.getNextString();
    while (curStr.trim() !== '') {
      data.push(curStr);
      curStr = stream.getNextString();
    }
    if (data.length === 1) {
      data = data[0];
    }
    const property = {tag: tag.replace(/<|>/g, '').trim(), data: data};
    this._currentMolProps.push(property);
  }

  _parseCompound(stream) {
    this._parseMOL(stream);

    //parse data items block
    while (stream.findNextDataItem()) {
      this._parseDataItem(stream);
    }
    const molecule = this._metadata.molecules[this._compoundIndx];
    if (this._currentMolProps.length !== 0) {
      molecule.props = this._currentMolProps;
    }
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

  _buildAssemblies() {
    const chains = this._complex._chains;

    for (let i = 0; i < chains.length; i++) {
      const assembly = new Assembly(this._complex);
      let matrix = new THREE.Matrix4();
      assembly.addMatrix(matrix);
      assembly.addChain(chains[i]._name);
      this._assemblies.push(assembly);
    }
  }

  _buildMolecules() {
    this._complex._molecules = [];
    const molecules = this._metadata.molecules;
    for (let i = 0; i < molecules.length; i++) {
      const molecule = new Molecule(this._complex, molecules[i].name, i + 1);
      molecule._residues = molecules[i]._residues;
      this._complex._molecules[i] = molecule;
    }
  }

  tryToFind(tagsList, props) {
    for (let i = 0; i < props.length; i++) {
      for (let j = 0; j < tagsList.length; j++) {
        if (tagsList[j] instanceof RegExp) {
          if (tagsList[j].test(props[i].tag)) {
            return props[i].data;
          }
        } else if (tagsList[j] === props[i].tag) {
          return props[i].data;
        }
      }
    }

    return false;
  }

  _tryToParseProperties(molecule) {
    const properties = molecule.props;
    if (!properties) {
      return false;
    }

    let res = false;

    for (let i = 0; i < tagsNames.length; i++) {
      const tagPossibleNames = tags[tagsNames[i]];
      const data = this.tryToFind(tagPossibleNames, properties);
      if (data) {
        molecule[tagsNames[i]] = data;
        res = true;
      }
    }

    return res;
  }

  _finalizeMetadata() {
    const molecules = this._metadata.molecules;
    const metadata = this._complex.metadata;
    const complex = this._complex;
    if (molecules.length === 1) {
      this._tryToParseProperties(molecules[0]);
      if (molecules[0].name) {
        complex.name = molecules[0].name;
      }
      if (molecules[0].title) {
        metadata.title = molecules[0].title;
      }
      if (molecules[0].date) {
        metadata.date = molecules[0].date;
      }
      if (molecules[0].props) {
        metadata.properties = molecules[0].props;
      }
    } else {
      metadata.molecules = [];
      for (let i = 0; i < molecules.length; i++) {
        this._tryToParseProperties(molecules[i]);
        molecules[i].name = molecules[i].name || molecules[i].id;
        if (molecules[i].name.match(/^\d+$/)) {
          molecules[i].name = 'CID: ' + molecules[i].name;
        }
        metadata.molecules.push({
          name: molecules[i].name,
          date: molecules[i].date,
          title:molecules[i].title,
        });
      }
      metadata.molecules = molecules;
    }
  }

  finalize() {
    const serialAtomMap = this._serialAtomMap = {};
    const atoms = this._complex._atoms;

    let i = 0, ni = atoms.length;
    for (; i < ni; ++i) {
      const atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
    }
    this._complex._finalizeBonds();
    this._fixBondsArray();
    this._finalizeMetadata();
    this._buildAssemblies();
    this._buildMolecules();

    this._complex.units = this._complex.units.concat(this._assemblies);

    this._complex.finalize({
      needAutoBonding: false,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap
    });
  }

  _defineFormat(data) {
    let format;
    if (sdfRegExp.test(data)) {
      format = 'sdf';
    } else {
      format = 'mol';
    }

    return format;
  }

  parseSync() {
    const result = this._complex = new Complex();
    const stream = new SDFStream(this._data);

    result.metadata.format = this._defineFormat(this._data);

    if (!stream.probablyHaveDataToParse()) {
      return null;
    }

    do {
      this._parseCompound(stream);
    } while (stream.findNextCompoundStart());

    this.finalize();

    return result;
  }
}

SDFParser.formats = ['mol', 'sdf'];
SDFParser.extensions = ['.mol', '.sdf'];
