import * as THREE from 'three';
import Parser from './Parser';
import chem from '../../chem';

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

    this._currPosIdx = 0;
    this._currStartIdx = 0;

    this._serialAtomMap = {};

    this._options.fileType = 'mol2';
  }

  _parseRawStrings(data) {
    return data.split(/\r?\n|\r/);
  }

  _toStringFromStart(numb, MOL2Data) {
    const newPosIdx = this._currStartIdx + numb;
    this._currPosIdx = (newPosIdx < MOL2Data.length) ? newPosIdx : this._currStartIdx;
  }

  _toHeaderString(header, MOL2Data) {
    this._toStringFromStart(0, MOL2Data);
    while (this._currPosIdx < MOL2Data.length) {
      if (MOL2Data[this._currPosIdx].match(`@<TRIPOS>${header}`)) {
        return;
      }
      this._currPosIdx++;
    }
    this._toStringFromStart(0, MOL2Data);
  }

  _toStringFromHeader(header, numb, MOL2Data) {
    this._toHeaderString(header, MOL2Data);
    const newPosIdx = this._currPosIdx + numb;

    if (MOL2Data[this._currPosIdx].match(`@<TRIPOS>${header}`) && newPosIdx < MOL2Data.length) {
      this._currPosIdx = newPosIdx;
    }
  }

  _setStart(startPos, MOL2Data) {
    if (startPos >= MOL2Data.length) {
      this._currStartIdx = this._currPosIdx = MOL2Data.length - 1;
    } else {
      this._currStartIdx = this._currPosIdx = startPos;
    }
  }

  _probablyHaveDataToParse(MOL2Data) {
    return this._currPosIdx < MOL2Data.length - 2;
  }

  _findNextCompoundStart(MOL2Data) {
    while (this._currPosIdx < MOL2Data.length && MOL2Data[this._currPosIdx].trim() !== '@<TRIPOS>MOLECULE>') {
      this._currPosIdx++;
    }
    this._setStart(++this._currPosIdx, MOL2Data);
    return this._probablyHaveDataToParse(MOL2Data);
  }

  _parseMolecule(MOL2Data) {
    this._toHeaderString('MOLECULE', MOL2Data);

    const { metadata } = this._complex;
    metadata.name = MOL2Data[++this._currPosIdx];
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
  _parseAtoms(atomsNum, MOL2Data) {
    this._toHeaderString('ATOM', MOL2Data);

    for (let i = 0; i < atomsNum; i++) {
      const parsedStr = splitToFields(MOL2Data[++this._currPosIdx]);

      if (parsedStr.length < 6) {
        throw new Error('MOL2 parsing error: Not enough information to create atom!');
      }
      const atomId = parseInt(parsedStr[0], 10);
      const atomName = parsedStr[1];

      const x = parseFloat(parsedStr[2]);
      const y = parseFloat(parsedStr[3]);
      const z = parseFloat(parsedStr[4]);

      const element = parsedStr[5].split('.')[0].toUpperCase();

      let charge = 0;
      if (parsedStr.length >= 9) {
        charge = parseFloat(parsedStr[8]) || 0.0;
      }

      let chain = this._chain;
      if (!chain) {
        // .mol2 may contain information about multiple molecules, but they can't be visualized
        // at the same time now. There is no need to create different chain IDs then.
        this._chain = chain = this._complex.getChain('A') || this._complex.addChain('A');
        this._residue = null;
      }
      if (!this._setResidue(parsedStr)) {
        continue;
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

      const xyz = new THREE.Vector3(x, y, z);
      this._residue.addAtom(atomName, type, xyz, role, het, atomId, altLoc, occupancy, tempFactor, charge);
    }
  }

  _setResidue(parsedStr) {
    let resSeq = 1;
    let resName = 'UNK'; // The same meaning has '<0>' in some mol2 files

    if (parsedStr.length >= 7) {
      resSeq = parseInt(parsedStr[6], 10);
    }
    if (parsedStr.length >= 8 && parsedStr[7] !== '<0>') {
      resName = parsedStr[7].replace(resNumberRegex, '');
    }
    if (this.settings.now.nowater) {
      if (resName === 'HOH' || resName === 'WAT') {
        return false;
      }
    }
    const residue = this._residue;
    const chain = this._chain;
    if (!residue || residue.getSequence() !== resSeq) {
      this._residue = chain.addResidue(resName, resSeq, 'A');
    }
    return true;
  }

  /* Bond format description
   * bondId originAtomId targetAtomId bondType [statusBits]
   */
  _parseBonds(bondsNum, MOL2Data) {
    this._toHeaderString('BOND', MOL2Data);

    for (let i = 0; i < bondsNum; i++) {
      const parsedStr = splitToFields(MOL2Data[++this._currPosIdx]);

      if (parsedStr.length < 3) {
        throw new Error('MOL2 parsing error: Missing information about bonds!');
      }

      let originAtomId = parseInt(parsedStr[1], 10);
      let targetAtomId = parseInt(parsedStr[2], 10);
      const bondType = parsedStr[3];

      if (originAtomId > targetAtomId) {
        [originAtomId, targetAtomId] = [targetAtomId, originAtomId];
      }
      this._complex.addBond(
        originAtomId,
        targetAtomId,
        orderMap[bondType] || 0,
        typeMap[bondType] || Bond.BondType.UNKNOWN,
        true,
      );
    }
  }

  _fixSerialAtoms() {
    const atoms = this._complex._atoms;
    for (let i = 0; i < atoms.length; i++) {
      const atom = atoms[i];
      this._serialAtomMap[atom.serial] = atom;
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
      molecule.residues = molResidues;
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

  _parseCompound(MOL2Data) {
    this._compoundIndx++;
    this._parseMolecule(MOL2Data);

    // Ignoring comments and everything before @<TRIPOS>MOLECULE block
    this._toStringFromHeader('MOLECULE', 2, MOL2Data);

    const parsedStr = MOL2Data[this._currPosIdx].trim().split(spacesRegex);
    const atomsNum = parsedStr[0];
    const bondsNum = parsedStr[1];

    this._parseAtoms(atomsNum, MOL2Data);
    this._parseBonds(bondsNum, MOL2Data);
  }

  parseSync() {
    const result = this._complex = new Complex();
    const MOL2Data = this._parseRawStrings(this._data);
    do {
      this._parseCompound(MOL2Data);
    } while (this._findNextCompoundStart(MOL2Data));

    this._finalize();

    return result;
  }
}

MOL2Parser.formats = ['mol2'];
MOL2Parser.extensions = ['.mol2', '.ml2', '.sy2'];

export default MOL2Parser;
