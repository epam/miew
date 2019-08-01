import * as THREE from 'three';
import Parser from './Parser';
import chem from '../../chem';
import GROReader from './GROReader';


const {
  Complex,
  Element,
  /* Helix,
  Sheet,
  Strand, */
  Bond,
  Molecule,
} = chem;

/* Docs template */
/**
 * Briefly abouts.
 * @param {type} name - Explanation.
 * @param {type2} name2 - Explanation2.
 * @returns {retType} Explanation
 */


/**
 * Gromos87 file format parser.
 *
 * @param {String} title          - Complex title, free format string.
 * @param {Number} time           - Time in ps (optional).
 * @param {Number} numAtoms       - Number of atoms in complex.
 * @param {Number} residueNumber  - Number of exact residue.
 * @param {String} residueName    - Scientific name of exact residue.
 * @param {String} atomName       - Scientific name of exact atom.
 * @param {Number} atomNumber     - Sorted number of exact atom.
 * @param {Array} atomPosition    - Array which contains x, y, z position of exact atom.
 * @param {Array} atomVelocity    - Array which contains x, y, z velocity of exact atom (optional).
 *
 * @param {Complex} complex       - Complex structure for unified molecule representation.
 *
 * @param {String} filetype       - Extension of data file.
 *
 * @exports GROParser
 * @constructor
 */
class GROParser extends Parser {
  constructor(data, options) {
    super(data, options);

    this._title = '';
    this._time = null;
    this._numAtoms = null;
    this._residueNumber = null;
    this._residueName = '';
    this._atomName = '';
    this._atomNumber = null;
    this._atomPosition = [];
    this._atomVelocity = [];

    this._complex = null;

    this._molecules = []; // undef
    this._molecule = null; // undef
    this._options.filetype = 'gro';
  }

  /**
   * General check for possibility of parsing.
   * @returns {boolean} TEMPORARY TRUE
   */
  canProbablyParse() {
    return true;
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
      molecule._residues = residues;
      this._complex._molecules[i] = molecule;
    }
  }

  /**
   * Parsing title and time of molecule complex.
   * @param {String} line - Line containing title and time.
   */
  _parseTitle(line) {
    const { metadata } = this._complex;
    const timeIsSet = line.indexOf('t= ');
    // metadata.title = line.slice(0, timeIsSet).trim();

    metadata.date = line.slice(timeIsSet, line.length).trim();
    metadata.format = 'gro';
  }

  /**
   * Parsing line containing number of atoms information.
   * @param {String} line - Line containing number of atoms.
   */
  _parseNumberOfAtoms(line) {
    this._numAtoms = parseInt(line, 10);
    console.log(line);
  }

  /**
   * Parsing line containing information about residues, atoms etc. Also information about box vectors.
   * Format of atoms MUST (by Gromos87 standard) be this: (note that numbering starts not from 0, but from 1!)
   * ResidueNumber[1 - 5]  ResidueName[6 - 10] AtomName[11 - 15] AtomNumber[16 - 20] Position[21 - 45] Velocity[46 - 69]
   * @param {GROReader} line - Line containing information about atom.
   */
  _parseAtom(line) {
    /* CHECK FOR BOX VECTORS!? */
    const residueNumber = line.readInt(1, 5);
    const residueName = line.readString(6, 10).trim();
    const atomName = line.readString(11, 15).trim();
    const atomNumber = line.readInt(16, 20);
    const positionX = line.readFloat(21, 28) * 10;
    const positionY = line.readFloat(29, 36) * 10;
    const positionZ = line.readFloat(37, 45) * 10;
    /* const velocityX = line.readFloat(46, 53);
    const velocityY = line.readFloat(54, 61);
    const velocityZ = line.readFloat(62, 69); */
    /* TODO: Place for some error if something went wrong */
    /* console.log(residueNumber + '___' + residueName + '___' + atomName + '___' + atomNumber
      + '___' + positionX + '___' + positionY + '___' + positionZ + '___' + velocityX + '___' + velocityY + '___' + velocityZ); */
    /* Adding residue and atom to complex structure */
    const type = Element.getByName(atomName);
    const role = Element.Role[atomName]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")
    /* Firstly, create a dummy chain */
    let chain = this._chain;
    if (!chain) {
      this._chain = chain = this._complex.addChain('A');
    }
    /* Secondly, add residue to that chain */
    let residue = this._residue;
    if (!residue || residue.getSequence() !== residueNumber) {
      this._residue = residue = chain.addResidue(residueName, residueNumber, 'A');
    }
    /* Lastly, add atom to that residue */
    const xyz = new THREE.Vector3(positionX, positionY, positionZ);
    residue.addAtom(atomName, type, xyz, role, null, atomNumber, null, null, null, null);
  }


  _fixBondsArray() {
    const serialAtomMap = this._serialAtomMap = {};
    const complex = this._complex;

    const atoms = complex._atoms;
    for (let i = 0, ni = atoms.length; i < ni; ++i) {
      const atom = atoms[i];
      serialAtomMap[atom._serial] = atom;
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

  /**
   * Some finalizing procedures.
   * @returns {Complex} Complex structure for visualizing.
   */
  _finalize() {

  }

  /**
   * Main parsing procedure.
   * @returns {Complex} Complex structure for visualizing.
   */
  parseSync() {
    console.log('HERE!'); /* Temp debugging purposes */
    /* Somehow catch all data (all lines) */
    /* Create "Complex" variable */
    const result = this._complex = new Complex();
    /* Parse input file line-by-line */
    const reader = new GROReader(this._data);
    let counter = 0; /* Simple counter regarding to format of .gro file */
    while (!reader.end()) {
      const line = reader.readLine();
      /* Got line, let's parse */
      /* First two lines - technical information, other lines - Atoms */
      if (counter === 0) {
        this._parseTitle(line);
      } else if (counter === 1) {
        this._parseNumberOfAtoms(line);
      } else {
        this._parseAtom(reader); /* BOX VECTORS PARSING IS HERE - WEIRD FLEX BUT OKAY */
      }
      /* End of parsing, switch to next line */
      reader.next();
      counter++;
    }
    /* TODO:: WHAT ABOUT BONDS? HOW TO CALCULATE THEM? */
    /* SID: ADDED DUMMY BONDS AND MOLECULE */
    // result.addBond(20, 282, 0, Bond.BondType.UNKNOWN, true);
    // result.addBond(26, 229, 0, Bond.BondType.UNKNOWN, true);
    // result.addBond(116, 188, 0, Bond.BondType.UNKNOWN, true);
    this._fixBondsArray();
    this._molecule = { _index: '', _chains: [] };
    this._molecule._index = 1;
    this._molecules.push(this._molecule);
    this._finalizeMolecules();
    // create secondary structure etc.
    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });
    /* Return resulting Complex variable */
    return result;
  }
}

GROParser.formats = ['gro'];
GROParser.extensions = ['.gro'];

export default GROParser;
