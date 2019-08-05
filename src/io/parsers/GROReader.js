import PDBStream from './PDBStream';

/**
 * Little helper class for GRO Parser usage.
 *
 * @param {String} data      - Input file.
 * @param {Number} next      - End position of line.
 *
 * @exports GROReader
 * @constructor
 */
export default class GROReader extends PDBStream {
  constructor(data) {
    super(data);
    this._next = -1;
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
