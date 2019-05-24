import * as THREE from 'three';
import chem from '../../../chem';

const { Assembly } = chem;

/**
 * Parser helper for PDB tag "REMARK 350".
 *
 * @exports Remark350
 * @constructor
 */
class Remark350 {
  constructor(complex) {
    /** @type {Complex} */
    this._complex = complex;
    /** @type {Assembly[]} */
    this.assemblies = [];

    /** @type {?Assembly} */
    this._assembly = null;
    /** @type {?THREE.Matrix4} */
    this._matrix = null;
    /** @type {number} */
    this._matrixIndex = -1;
  }

  /**
   * Parse a single line of a stream.
   * @param {PDBStream} stream - stream to parse
   */

  parse(stream) {
    /** @type {?Assembly} */
    let assembly = this._assembly;
    /** @type {?THREE.Matrix4} */
    let matrix = this._matrix;

    if (assembly && stream.readString(12, 18) === '  BIOMT') {
      const matrixRow = stream.readCharCode(19) - 49; // convert '1', '2', or '3' -> 0, 1, or 2
      const matrixData = stream.readString(20, 80).trim().split(/\s+/);
      const matrixIndex = parseInt(matrixData[0], 10);
      if (this._matrix === null || matrixIndex !== this._matrixIndex) {
        // TODO: assert(matrixIndex === assembly.matrices.length + 1);
        this._matrixIndex = matrixIndex;
        this._matrix = matrix = new THREE.Matrix4();
        assembly.addMatrix(matrix);
      }

      const { elements } = matrix;
      elements[matrixRow] = parseFloat(matrixData[1]);
      elements[matrixRow + 4] = parseFloat(matrixData[2]);
      elements[matrixRow + 8] = parseFloat(matrixData[3]);
      elements[matrixRow + 12] = parseFloat(matrixData[4]);
    } else if (assembly && stream.readString(35, 41) === 'CHAINS:') {
      const entries = stream.readString(42, 80).split(',');
      for (let i = 0, n = entries.length; i < n; ++i) {
        const chain = entries[i].trim();
        if (chain.length > 0) {
          assembly.addChain(chain);
        }
      }
    } else if (stream.readString(12, 23) === 'BIOMOLECULE:') {
      // assert molIndex === this.assemblies.length + 1
      this._matrix = null;
      this._matrixIndex = -1;
      this._assembly = assembly = new Assembly(this._complex);
      this.assemblies.push(assembly);
    }
  }
}

Remark350.prototype.id = 350;

export default Remark350;
