import * as THREE from 'three';
import Parser from './Parser';
import chem from '../../chem';
import MOL2Stream from './MOL2Stream';

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

    this._complex = null;
    this._chain = null;
    this._residue = null;
    this._compoundIndx = -1;

    this._molecules = [];
    this._molecule = null;

    this._options.fileType = 'mol2';
  }

  _parseMolecule(stream) {
    stream.getHeaderString('MOLECULE');

    const { metadata } = this._complex;
    metadata.name = stream.getNextString();
    metadata.format = 'mol2';

    this._molecule = { _index: '', _chains: [] };
    this._molecule._index = this._compoundIndx + 1;
    this._molecules.push(this._molecule);
  }

  _parseAtoms(stream, atomsNum) {
    const resNumberRegex = /\d+$/;
    let curStr = stream.getHeaderString('ATOM');

    for (let i = 0; i < atomsNum; i++) {
      curStr = stream.getNextString();
      const parsedStr = curStr.trim().split(/\s+/);
      const atomId = parseInt(parsedStr[0], 10);
      const atomName = parsedStr[1];

      const x = parseFloat(parsedStr[2]);
      const y = parseFloat(parsedStr[3]);
      const z = parseFloat(parsedStr[4]);

      const element = parsedStr[5].split('.')[0];
      const resSeq = parseInt(parsedStr[6], 10);

      const resName = parsedStr[7].replace(resNumberRegex, '');

      /* There fields are not listed in mol2 format, set them default */
      const het = true;
      const altLoc = ' ';
      const occupancy = 1.0;
      const tempFactor = 0.0;

      if (this.settings.now.nowater) {
        if (resName === 'HOH' || resName === 'WAT') {
          return;
        }
      }

      const charge = parseFloat(parsedStr[8]) | 0;
      const type = Element.getByName(element);
      const role = Element.Role[atomName];

      let chain = this._chain;
      let resId = ' ';
      if (!chain) {
        const chainId = buildChainID(this._compoundIndx);
        resId = chainId;
        this._chain = chain = this._complex.getChain(chainId) || this._complex.addChain(chainId);
        this._residue = null;
      }
      let residue = this._residue;
      if (!residue || residue.getSequence() !== resSeq) {
        this._residue = residue = chain.addResidue(resName, resSeq, resId);
      }

      const xyz = new THREE.Vector3(x, y, z);
      this._residue.addAtom(atomName, type, xyz, role, het, atomId, altLoc, occupancy, tempFactor, charge);
    }
  }

  _parseBonds(stream, bondsNum) {
    let curStr = stream.getHeaderString('BOND');

    for (let i = 0; i < bondsNum; i++) {
      curStr = stream.getNextString();
      const parsedStr = curStr.trim().split(/\s+/);

      let atom1 = parseInt(parsedStr[1], 10);
      let atom2 = parseInt(parsedStr[2], 10);
      const bondType = parsedStr[3];

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
    const serialAtomMap = this._serialAtomMap = {};
    const complex = this._complex;

    const atoms = complex._atoms;
    for (let i = 0; i < atoms.length; i++) {
      const atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
    }

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

  _finalizeMolecules() {
    /* Get chains from complex */
    const chainDict = {};
    const chains = this._complex._chains;

    for (let i = 0; i < chains.length; ++i) {
      const chain = chains[i];
      const chainName = chain._name;
      chainDict[chainName] = chain;
    }

    /* Aggregate residues from chains */
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

  _finalize() {
    this._complex._finalizeBonds();
    this._fixBondsArray();

    this._finalizeMolecules();

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
  }

  parseSync() {
    const result = this._complex = new Complex();
    const stream = new MOL2Stream(this._data);

    do {
      this._parseCompound(stream);
    } while (stream.findNextCompoundStart());

    this._finalize();

    return result;
  }
}

MOL2Parser.formats = ['mol2'];
MOL2Parser.extensions = ['.mol2', '.ml2', '.sy2'];
