import * as THREE from 'three';

/**
 * Parser helper for PDB tag "REMARK 290".
 *
 * @exports Remark290
 * @constructor
 */
class Remark290 {
  constructor() {
    /** @type {THREE.Matrix4[]} */
    this.matrices = [];

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
    /** @type {?THREE.Matrix4} */
    let matrix = this._matrix;

    if (stream.readString(12, 18) === '  SMTRY') {
      const matrixRow = stream.readCharCode(19) - 49; // convert '1', '2', or '3' -> 0, 1, or 2
      const matrixData = stream.readString(20, 80).trim().split(/\s+/);
      const matrixIndex = parseInt(matrixData[0], 10);
      if (this._matrix === null || matrixIndex !== this._matrixIndex) {
        // TODO: assert(matrixIndex === this.matrices.length + 1);
        this._matrixIndex = matrixIndex;
        this._matrix = matrix = new THREE.Matrix4();
        this.matrices[this.matrices.length] = matrix;
      }

      const { elements } = matrix;
      elements[matrixRow] = parseFloat(matrixData[1]);
      elements[matrixRow + 4] = parseFloat(matrixData[2]);
      elements[matrixRow + 8] = parseFloat(matrixData[3]);
      elements[matrixRow + 12] = parseFloat(matrixData[4]);
    }
  }
}

Remark290.prototype.id = 290;

export default Remark290;
