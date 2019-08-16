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

const resNumberRegex = /\d+$/;
const spacesRegex = /\s+/;

function splitToFields(str) {
  return str.trim().split(spacesRegex);
}
/* There is no jsdoc documentation because of eslint corrections:
 * not all Parser methods are implemented
 */

class MOL2Parser extends Parser {
  constructor(data, options) {
    super(data, options);

    this._complex = null;
    this._chain = null;
    this._residue = null;
    this._compoundIndx = -1;

    this._molecules = [];
    this._molecule = null;

    this._serialAtomMap = {};

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

  /* Atom format description:
   * atomId atomName x y z element [resSeq [resName [charge [statusBit]]]]
   * statusBits is the internal SYBYL status bits associated with the atom.
   * These should never be set by the user.
   * Source: http://chemyang.ccnu.edu.cn/ccb/server/AIMMS/mol2.pdf
   */
  _parseAtoms(stream, atomsNum) {
    let curStr = stream.getHeaderString('ATOM');

    for (let i = 0; i < atomsNum; i++) {
      curStr = stream.getNextString();
      const parsedStr = splitToFields(curStr);

      if (parsedStr.length < 6) {
        throw new Error('MOL2 parsing error: Not enough information to create atom!');
      }
      const atomId = parseInt(parsedStr[0], 10);
      const atomName = parsedStr[1];

      const x = parseFloat(parsedStr[2]);
      const y = parseFloat(parsedStr[3]);
      const z = parseFloat(parsedStr[4]);

      const element = parsedStr[5].split('.')[0].toUpperCase();

      let resSeq = 1;
      let resName = 'UNK'; // The same meaning has '<0>' in some mol2 files
      let charge = 0;

      if (parsedStr.length >= 7) {
        resSeq = parseInt(parsedStr[6], 10);
      }
      if (parsedStr.length >= 8 && parsedStr[7] !== '<0>') {
        resName = parsedStr[7].replace(resNumberRegex, '');
      }
      if (parsedStr.length >= 9) {
        charge = parseFloat(parsedStr[8]) | 0;
      }
      if (this.settings.now.nowater) {
        if (resName === 'HOH' || resName === 'WAT') {
          continue;
        }
      }
      // These fields are not listed in mol2 format. Set them default.
      // Atoms and het atoms doesn't differ in .mol2,
      // but het atoms have special residues. It can be used in next updates
      const het = false;
      const altLoc = ' ';
      const occupancy = 1.0;
      const tempFactor = 0.0;
      const type = Element.getByName(element);
      const role = Element.Role[atomName];

      let chain = this._chain;
      if (!chain) {
        // .mol2 may contain information about multiple molecules, but they can't be visualized
        // at the same time now. There is no need to create different chain IDs then.
        this._chain = chain = this._complex.getChain('A') || this._complex.addChain('A');
        this._residue = null;
      }
      let residue = this._residue;
      if (!residue || residue.getSequence() !== resSeq) {
        this._residue = residue = chain.addResidue(resName, resSeq, 'A');
      }
      const xyz = new THREE.Vector3(x, y, z);
      this._residue.addAtom(atomName, type, xyz, role, het, atomId, altLoc, occupancy, tempFactor, charge);
    }
  }

  /* Bond format description
   * bondId originAtomId targetAtomId bondType [statusBits]
   */
  _parseBonds(stream, bondsNum) {
    let curStr = stream.getHeaderString('BOND');

    for (let i = 0; i < bondsNum; i++) {
      curStr = stream.getNextString();
      const parsedStr = splitToFields(curStr);

      if (parsedStr.length < 3) {
        throw new Error('MOL2 parsing error: Missing information about bonds!');
      }

      let originAtomId = parseInt(parsedStr[1], 10);
      let targetAtomId = parseInt(parsedStr[2], 10);
      const bondType = parsedStr[3];

      if (originAtomId > targetAtomId) {
        [originAtomId, targetAtomId] = [targetAtomId, originAtomId];
      }
      this._complex.addBond(originAtomId, targetAtomId,
        (bondType in typeMap) ? orderMap[bondType] : 1,
        (bondType in typeMap) ? typeMap[bondType] : Bond.BondType.UNKNOWN,
        true);
    }
  }

  _fixSerialAtoms() {
    const atoms = this._complex._atoms;
    for (let i = 0; i < atoms.length; i++) {
      const atom = atoms[i];
      this._serialAtomMap[atom._serial] = atom;
    }
  }

  _fixBondsArray() {
    const serialAtomMap = this._serialAtomMap;
    const complex = this._complex;

    if (Object.keys(serialAtomMap).length === 0) {
      throw new Error('MOL2 parsing error: Missing atom information!');
    }

    const bonds = complex._bonds;
    for (let j = 0; j < bonds.length; j++) {
      const bond = bonds[j];
      bond._left = serialAtomMap[bond._left] || null;
      bond._right = serialAtomMap[bond._right] || null;
    }
  }

  _finalizeMolecules() {
    // Get chain from complex
    const chain = this._complex._chains[0];
    this._complex._molecules = [];

    // Aggregate residues from chains
    // (to be precise from the chain 'A')
    for (let i = 0; i < this._molecules.length; i++) {
      const currMolecule = this._molecules[i];
      const molResidues = chain._residues;
      const molecule = new Molecule(this._complex, currMolecule._name, i + 1);
      molecule._residues = molResidues;
      this._complex._molecules[i] = molecule;
    }
  }

  _finalize() {
    this._complex._finalizeBonds();
    this._fixSerialAtoms();
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

    // Ignoring comments and everything before @<TRIPOS>MOLECULE block
    const countsLine = stream.getStringFromHeader('MOLECULE', 2);

    const parsedStr = countsLine.trim().split(spacesRegex);
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

export default MOL2Parser;
