import * as THREE from 'three';
import Parser from './Parser';
import chem from '../../chem';
import MOL2Stream from './MOL2Stream';
import Assembly from '../../chem/Assembly';

const {
  Complex,
  Element,
  Bond,
  Molecule,
} = chem;

const chargeMap = [0, 3, 2, 1, 0, -1, -2, -3];
const orderMap = {
  un: 0,
  1: 1,
  2: 2,
  3: 3,
  ar: 1,
  am: 1,
  nc: 0,
  du: 1,
};
const typeMap = {
  un: Bond.BondType.UNKNOWN, // unknown (cannot be determined from the parameter tables)
  1: Bond.BondType.COVALENT, // single
  2: Bond.BondType.COVALENT, // double
  3: Bond.BondType.COVALENT, // triple
  ar: Bond.BondType.AROMATIC, // aromatic
  am: Bond.BondType.COVALENT, // amide
  nc: Bond.BondType.UNKNOWN, // not connected
  du: Bond.BondType.COVALENT, // dummy
};

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

export default class MOL2Parser extends Parser {
  constructor(data, options) {
    super(data, options);
    this._format = 'mol2';
    this._complex = null;
    this._chain = null;
    this._residue = null;
    this._compoundIndx = -1;
    this._molecules = [];
    this._metadata = {};
    this._metadata.molecules = [];
    this._assemblies = [];
    this._atomsIndexes = [];
    this._atomsParsed = 0;
    this._options.fileType = 'mol2';
  }

  _parseMolecule(stream) {
    stream.getHeaderString('MOLECULE');
    const molecule = {};
    molecule.name = stream.getNextString();
    molecule.title = [''];
    molecule.format = 'mol2';
    molecule.date = '';
    this._metadata.molecules.push(molecule);
  }

  _parseAtoms(stream, atomsNum) {
    const residueRegexp = /\d+$/;

    let curStr = stream.getHeaderString('ATOM');

    const chainID = buildChainID(this._compoundIndx);

    this._chain = this._complex.getChain(chainID) || this._complex.addChain(chainID);

    for (let i = 0; i < atomsNum; i++) {
      curStr = stream.getNextString();
      const parsedStr = curStr.trim().split(/\s+/);
      const serial = parseInt(parsedStr[0], 10); // parseInt(curStr.substr(0, 7), 10);
      const name = parsedStr[1];

      const x = parseFloat(parsedStr[2]);
      const y = parseFloat(parsedStr[3]);
      const z = parseFloat(parsedStr[4]);

      const element = parsedStr[5].split('.')[0];
      const resSeq = parseInt(parsedStr[6], 10);

      const resName = parsedStr[7].replace(residueRegexp, '');

      const xyz = new THREE.Vector3(x, y, z);
      const charge = chargeMap[parseFloat(parsedStr[8]) | 0];
      // const element = nameToElement(name);

      const type = Element.getByName(element);
      const role = Element.Role[name];

      this._residue = this._chain.addResidue(resName, resSeq, ' ');
      this._residue.addAtom(name, type, xyz, role, true, serial, ' ', 1.0, 0.0, charge);
    }
  }

  _parseBonds(stream, bondsNum) {
    let curStr = stream.getHeaderString('BOND');

    for (let i = 0; i < bondsNum; i++) {
      curStr = stream.getNextString();
      const parsedStr = curStr.trim().split(/\s+/);

      let atom1 = parseInt(parsedStr[1], 10) + this._atomsParsed; // parseInt(curStr.substr(6, 6), 10);
      let atom2 = parseInt(parsedStr[2], 10) + this._atomsParsed; // parseInt(curStr.substr(12, 6), 10);
      const bondType = parsedStr[3]; // curStr.substr(12, 6).trim();

      if (atom1 > atom2) {
        [atom1, atom2] = [atom2, atom1];
      }
      this._complex.addBond(atom1, atom2,
        (bondType in typeMap) ? orderMap[bondType] : 1,
        (bondType in typeMap) ? typeMap[bondType] : Bond.BondType.UNKNOWN,
        true);
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

  _buildMolecules() {
    this._complex._molecules = [];
    const { molecules } = this._metadata;
    for (let i = 0; i < molecules.length; i++) {
      const molecule = new Molecule(this._complex, molecules[i].name, i + 1);
      molecule._residues = molecules[i]._residues;
      this._complex._molecules[i] = molecule;
    }

    return this._complex._molecules;
  }

  _finalize() {
    const serialAtomMap = this._serialAtomMap = {};
    const atoms = this._complex._atoms;

    for (let i = 0; i < atoms.length; i++) {
      const atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
    }

    this._complex._finalizeBonds();
    this._fixBondsArray();
    this._finalizeMetadata();
    this._buildAssemblies();
    this._complex.units = this._complex.units.concat(this._assemblies);
    this._buildMolecules();

    this._complex.finalize({
      needAutoBonding: false,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });
  }

  _parseCompound(stream) {
    this._compoundIndx++;
    this._parseMolecule(stream);

    const countsLine = stream.getStringFromStart(2);
    const parsedStr = countsLine.trim().split(/\s+/);
    const atomsNum = parsedStr[0];
    const bondsNum = parsedStr[1];

    this._parseAtoms(stream, atomsNum);
    this._parseBonds(stream, bondsNum);

    this._atomsParsed += atomsNum;

    this._metadata.molecules[this._compoundIndx]._residues = [];
    this._metadata.molecules[this._compoundIndx]._residues.push(this._residue);
  }

  parseSync() {
    const result = this._complex = new Complex();
    const stream = new MOL2Stream(this._data);

    result.metadata.format = this._format;

    do {
      this._parseCompound(stream);
    } while (stream.findNextCompoundStart());

    this._finalize();

    return result;
  }
}

MOL2Parser.formats = ['mol2'];
MOL2Parser.extensions = ['.mol2', '.ml2', '.sy2'];
