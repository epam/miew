import PDBStream from './PDBStream';

/**
 * Little helper class for GRO Parser usage.
 * @extends PDBStream
 */
class GROReader extends PDBStream {
  constructor(data) {
    super(data);
    /** @type Number */
    this._next = -1; // End position of line
    this.next();
  }

  /**
   * Getting end of string.
   * @returns {Number} Pointer to end of string
   */
  getNext() {
    return this._next;
  }
}

export default GROReader;
