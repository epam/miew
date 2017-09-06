

import * as THREE from 'three';

/**
 * Parser helper for PDB tag "REMARK 290".
 *
 * @exports Remark290
 * @constructor
 */
function Remark290() {
  /** @type {THREE.Matrix4[]} */
  this.matrices = [];

  /** @type {?THREE.Matrix4} */
  this._matrix = null;
  /** @type {number} */
  this._matrixIndex = -1;
}

Remark290.prototype.id = 290;

/**
 * Parse a single line of a stream.
 * @param {PDBStream} stream - stream to parse
 */
Remark290.prototype.parse = function(stream) {
  /** @type {?THREE.Matrix4} */
  var matrix = this._matrix;

  if (stream.readString(12, 18) === '  SMTRY') {
    var matrixRow = stream.readCharCode(19) - 49; // convert '1', '2', or '3' -> 0, 1, or 2
    var matrixData = stream.readString(20, 80).trim().split(/\s+/);
    var matrixIndex = matrixData[0];
    if (this._matrix === null || matrixIndex !== this._matrixIndex) {
      // TODO: assert(matrixIndex === this.matrices.length + 1);
      this._matrixIndex = matrixIndex;
      this._matrix = matrix = new THREE.Matrix4();
      this.matrices[this.matrices.length] = matrix;
    }

    var elements = matrix.elements;
    elements[matrixRow]      = matrixData[1];
    elements[matrixRow + 4]  = matrixData[2];
    elements[matrixRow + 8]  = matrixData[3];
    elements[matrixRow + 12] = matrixData[4];
  }
};

export default Remark290;

