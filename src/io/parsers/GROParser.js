import * as THREE from 'three';
import Parser from './Parser';
import chem from '../../chem';
import GROReader from './GROReader';


const {
  Complex,
  Element,
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
   * @returns {boolean} TEMPORARY TRUE
   */
  canProbablyParse() {
    return true;
  }

  /**
   * Parsing title of molecule complex.
   * NOTE: that names are ESTIMATES RIGHT NOW, NEED FURTHER DETAILED STUDY!
   * @param {GROReader} line - Line containing title and time.
   */
  _parseTitle(line) {
    const { metadata } = this._complex;
    metadata.title = metadata.title || [];
    metadata.title[0] = line.readLine().trim();
    metadata.classification = metadata.title;
    metadata.id = metadata.title;
    metadata.format = 'gro';
  }

  /**
   * Parsing line containing number of atoms information.
   * @param {GROReader} line - Line containing number of atoms.
   */
  _parseNumberOfAtoms(line) {
    this._numAtoms = line.readInt(0, line.getNext());
    console.log(this._numAtoms); /* TODO:: TESTING PURPOSES ONLY */
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
    this._residueName = line.readString(6, 10).trim();
    this._atomName = line.readString(11, 15).trim();
    this._atomNumber = line.readInt(16, 20);
    const positionX = line.readFloat(21, 28) * 10;
    const positionY = line.readFloat(29, 36) * 10;
    const positionZ = line.readFloat(37, 45) * 10;
    /* const velocityX = line.readFloat(46, 53);
    const velocityY = line.readFloat(54, 61);
    const velocityZ = line.readFloat(62, 69); */
    /* TODO: Place for some error if something went wrong */
    /* Adding residue and atom to complex structure */
    const type = Element.getByName(this._atomName[0]); /* MAGIC 0. REASONS: This name is something like "CA", where
     C - is an element an A is something else. But what about Calcium? */
    if (type.fullName === 'Unknown') {
      /* TODO:: THROW SOME ERROR? */
      /* BOX VECTORS ARE HERE ALSO. INVALID LOGIC? */
      return;
    }
    const role = Element.Role[this._atomName]; // FIXME: Maybe should use type as additional index (" CA " vs. "CA  ")
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
    residue.addAtom(this._atomName, type, this._atomPosition, role, null, this._atomNumber, null, null, null, null);
  }

  /**
   * Some finalizing procedures.
   * NOTE: This code was created by copy-past method from PDBParser.js
   * @returns {Complex} Complex structure for visualizing.
   */
  _finalize() {
    this._molecule = { _index: '', _chains: [] };
    this._molecule._index = 1;
    this._molecules.push(this._molecule);
    this._complex.finalize({
      needAutoBonding: true,
      enableEditing: this.settings.now.editing,
      serialAtomMap: this._serialAtomMap,
    });
  }

  /**
   * Main parsing procedure.
   * @returns {Complex} Complex structure for visualizing.
   */
  parseSync() {
    console.log('HERE!'); /* Temp debugging purposes */
    /* Create "Complex" variable */
    this._complex = new Complex();
    /* Parse input file line-by-line */
    const reader = new GROReader(this._data);
    let counter = 0; /* Simple counter regarding to format of .gro file */
    while (!reader.end()) {
      /* First two lines - technical information, other lines - Atoms */
      if (counter === 0) {
        this._parseTitle(reader);
      } else if (counter === 1) {
        this._parseNumberOfAtoms(reader);
      } else {
        this._parseAtom(reader); /* BOX VECTORS PARSING WILL BE HERE ASAP */
      }
      /* End of parsing, switch to next line */
      reader.next();
      counter++;
    }
    this._finalize();
    /* Return resulting Complex variable */
    return this._complex;
  }
}

GROParser.formats = ['gro'];
GROParser.extensions = ['.gro'];

export default GROParser;
