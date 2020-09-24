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
 * @extends Parser
 */
class GROParser extends Parser {
  /**
   * Create parser for .gro file format
   *
   * @param {String} data Input file
   * @param {String} options Input options (optional field)
   */
  constructor(data, options) {
    super(data, options);
    /** @type Date */
    this._time = null; // Time in ps, optional field for animations
    /** @type Number */
    this._numAtoms = null; // Number of atoms in complex
    /** @type Number */
    this._residueNumber = null; // Number of exact residue
    /** @type String */
    this._residueName = ''; // Scientific name of exact residue
    /** @type String */
    this._atomName = ''; // Scientific name of exact atom
    /** @type Number */
    this._atomNumber = null; // Sorted number of exact atom
    /** @type Array */
    this._atomPosition = []; // Array which contains x, y, z position of exact atom
    /** @type Array */
    this._atomVelocity = []; // Array which contains x, y, z velocity of exact atom (optional)
    /** @type Complex */
    this._complex = null; // Complex structure for unified molecule representation
    /** @type Vector3 */
    this._molecules = []; // Molecules array
    /** @type Molecule */
    this._molecule = null; // Single molecule
    /** @type String */
    this._options.filetype = 'gro'; // Extension of data file.
  }

  /**
   * General check for possibility of parsing.
   * @param {String} data - Input file
   * @returns {boolean} true if this file is in ascii, false otherwise
   */
  canProbablyParse(data) {
    return _.isString(this._data) && /^\s*[^\n]*\n\s*\d+ *\n\s*\d+[^\n\d]{3}\s*\w+\s*\d+\s*-?\d/.test(data);
  }

  /**
   * Parsing title of molecule complex.
   * NOTE: that names are ESTIMATES, there is no strict rules in Gromos87 standard for first line in input file.
   * @param {GROReader} line - Line containing title and time.
   */
  _parseTitle(line) {
    const { metadata } = this._complex;
    metadata.id = line.readLine().trim();
    metadata.name = metadata.id.slice(metadata.id.lastIndexOf('\\') + 1, metadata.id.lastIndexOf('.'));
    metadata.format = 'gro';
  }

  /**
   * Parsing line containing number of atoms information.
   * @param {GROReader} line - Line containing number of atoms.
   */
  _parseNumberOfAtoms(line) {
    this._numAtoms = line.readInt(0, line.getNext());
    if (Number.isNaN(this._numAtoms)) {
      throw new Error('Line 2 is not representing atom number. Consider checking input file');
    }
  }

  /**
   * Parsing line containing information about residues, atoms etc. Also information about box vectors.
   * Format of atoms MUST (by Gromos87 standard) be this: (note that numbering starts not from 0, but from 1!)
   * ResidueNumber[1 - 5]  ResidueName[6 - 10] AtomName[11 - 15] AtomNumber[16 - 20] Position[21 - 45] Velocity[46 - 69]
   * @param {GROReader} line - Line containing information about atom.
   */
  _parseAtom(line) {
    this._residueNumber = line.readInt(1, 5);
    this._residueName = line.readString(6, 10).trim();
    this._atomName = line.readString(11, 15).trim();
    this._atomNumber = line.readInt(16, 20);
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
      this._residue = residue = chain.addResidue(this._residueName, this._residueNumber, ' ');
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
   * Some finalizing procedures. In '.gro' file format there is only 1 chain and 1 molecule.
   */
  _finalize() {
    const molecule = new Molecule(this._complex, this._complex.metadata.name, 1);
    // aggregate residues from chain
    molecule.residues = this._chain._residues;
    molecule._chains = this._chain;
    this._complex._molecules[0] = molecule;
    this._molecules.push(molecule);
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
    /* First two lines - technical information, other lines - Atoms */
    this._parseTitle(reader);
    reader.next();
    this._parseNumberOfAtoms(reader);
    reader.next();
    for (counter = 0; counter < this._numAtoms; ++counter) {
      if (!reader.end()) {
        this._parseAtom(reader);
        reader.next();
      } else break;
    }
    /* If number of atoms in second line is less then actual atoms in file */
    if (counter < this._numAtoms) {
      this._complex.error = {
        message: 'File ended unexpectedly.',
      };
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
