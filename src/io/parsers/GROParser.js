import * as THREE from 'three';
import _ from 'lodash';
import Parser from './Parser';
import chem from '../../chem';
import GROReader from './GROReader';


const {
  Complex,
  Element,
  Molecule,
} = chem;

/**
 * Gromos87 file format parser.
 *
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
 * @param {Molecule} molecules    - Molecules array.
 * @param {Molecule} molecule     - Single molecule.
 * @param {String} filetype       - Extension of data file.
 *
 * @exports GROParser
 * @constructor
 */
class GROParser extends Parser {
  constructor(data, options) {
    super(data, options);

    this._time = null;
    this._numAtoms = null;
    this._residueNumber = null;
    this._residueName = '';
    this._atomName = '';
    this._atomNumber = null;
    this._atomPosition = [];
    this._atomVelocity = [];

    this._complex = null;

    this._molecules = [];
    this._molecule = null;
    this._options.filetype = 'gro';
  }

  /**
   * General check for possibility of parsing.
   * @returns {boolean} true if this file is in ascii, false otherwise
   */
  canProbablyParse() {
    return _.isString(this._data);
  }

  /**
   * Parsing title of molecule complex.
   * NOTE: that names are ESTIMATES, there is no strict rules in Gromos87 standard for first line in input file.
   * @param {GROReader} line - Line containing title and time.
   */
  _parseTitle(line) {
    const { metadata } = this._complex;
    metadata.id = line.readLine().trim();
    metadata.format = 'gro';
  }

  /**
   * Parsing line containing number of atoms information.
   * @param {GROReader} line - Line containing number of atoms.
   */
  _parseNumberOfAtoms(line) {
    this._numAtoms = line.readInt(0, line.getNext());
    if (Number.isNaN(this._numAtoms)) {
      this._complex.error = {
        message: `"${line.readLine()}" is not representing atom number. Consider checking input file`,
      };
    }
  }

  /**
   * Parsing line containing information about residues, atoms etc. Also information about box vectors.
   * Format of atoms MUST (by Gromos87 standard) be this: (note that numbering starts not from 0, but from 1!)
   * ResidueNumber[1 - 5]  ResidueName[6 - 10] AtomName[11 - 15] AtomNumber[16 - 20] Position[21 - 45] Velocity[46 - 69]
   * @param {GROReader} line - Line containing information about atom.
   */
  _parseAtom(line) {
    /* CHECK FOR BOX VECTORS!? */
    this._residueNumber = line.readInt(1, 5);
    if (Number.isNaN(this._residueNumber)) {
      this._complex.error = {
        message: `"${line.readString(1, 5)}" is not a residue number in "${line.readLine()}"`,
      };
      return;
    }
    this._residueName = line.readString(6, 10).trim();
    this._atomName = line.readString(11, 15).trim();
    this._atomNumber = line.readInt(16, 20);
    if (Number.isNaN(this._atomNumber)) {
      this._complex.error = {
        message: `"${line.readString(16, 20)}" is not an atom number in "${line.readLine()}"`,
      };
      return;
    }
    const positionX = line.readFloat(21, 28) * 10;
    const positionY = line.readFloat(29, 36) * 10;
    const positionZ = line.readFloat(37, 45) * 10;
    if (Number.isNaN(positionX) || Number.isNaN(positionY) || Number.isNaN(positionZ)) {
      this._complex.error = {
        message: `Atom position is invalid in "${line.readLine()}"`,
      };
      return;
    }
    /* const velocityX = line.readFloat(46, 53);
    const velocityY = line.readFloat(54, 61);
    const velocityZ = line.readFloat(62, 69); */
    /* Adding residue and atom to complex structure */
    const type = Element.getByName(this._atomName[0]); /* MAGIC 0. REASONS: This name is something like "CA", where
     C - is an element an A is something else. But what about Calcium? */
    if (type.fullName === 'Unknown') {
      this._complex.error = {
        message: `${this._atomName[0]} hasn't been recognised as an atom name.`,
      };
      return;
    }
    const role = Element.Role[this._atomName];
    /* Firstly, create a dummy chain */
    let chain = this._chain;
    if (!chain) {
      this._chain = chain = this._complex.addChain('A');
    }
    /* Secondly, add residue to that chain */
    let residue = this._residue;
    if (!residue || residue.getSequence() !== this._residueNumber) {
      this._residue = residue = chain.addResidue(this._residueName, this._residueNumber, 'A');
    }
    /* Lastly, add atom to that residue */
    this._atomPosition = new THREE.Vector3(positionX, positionY, positionZ);
    /* Adding default constants to correct atom addition process */
    const het = true;
    const altLoc = ' ';
    const occupancy = 1;
    const tempFactor = 1;
    const charge = 0;
    residue.addAtom(this._atomName, type, this._atomPosition, role, het, this._atomNumber, altLoc, occupancy, tempFactor, charge);
  }

  /**
   * Needed procedure for molecules finalization. In '.gro' file format there is only 1 chain and 1 molecule.
   */
  _finalizeMolecules() {
    // get chain from complex
    const chainDict = {};
    const chain = this._complex._chains[0];
    const chainName = chain._name;
    chainDict[chainName] = chain;

    // aggregate residues from chain
    const m = this._molecules[0];
    let residues = [];
    residues = residues.concat(chain._residues.slice());

    const molecule = new Molecule(this._complex, m._name, 1);
    molecule._residues = residues;
    this._complex._molecules[0] = molecule;
  }

  /**
   * Some finalizing procedures.
   * @returns {Complex} Complex structure for visualizing.
   */
  _finalize() {
    this._molecule = { _index: '', _chains: [] };
    this._molecule._index = 1;
    this._molecules.push(this._molecule);
    this._finalizeMolecules();
    this._complex.finalize({
      needAutoBonding: true,
      detectAromaticLoops: this.settings.now.aromatic,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });
  }

  /**
   * Main parsing procedure.
   * @returns {Complex} Complex structure for visualizing.
   */
  parseSync() {
    /* Create "Complex" variable */
    const result = this._complex = new Complex();
    /* Parse input file line-by-line */
    const reader = new GROReader(this._data);
    let counter = 0; /* Simple counter regarding to format of .gro file */
    while (!reader.end()) {
      /* First two lines - technical information, other lines - Atoms */
      if (counter === 0) {
        this._parseTitle(reader);
      } else if (counter === 1) {
        this._parseNumberOfAtoms(reader);
      } else if (counter <= this._numAtoms + 1) { /* Number of atoms + 2 strings of technical information */
        this._parseAtom(reader); /* Box Vectors are not been proceeded at all */
      } else break;
      /* End of parsing, switch to next line */
      reader.next();
      counter++;
    }

    /* Catch errors occurred in parsing process */
    if (result.error) {
      throw new Error(result.error.message);
    }

    /* Finalizing data */
    this._finalize();

    /* Cleaning up */
    this._atomPosition = null;
    this._complex = null;
    this._molecules = null;
    this._molecule = null;

    /* Return resulting Complex variable */
    return result;
  }
}

GROParser.formats = ['gro'];
GROParser.extensions = ['.gro'];

export default GROParser;
