import Strand from './Strand';

/**
 * Sheet secondary structure of a protein.
 *
 * @param {string} name -
 * @param {number} width -
 *
 * @exports Sheet
 * @constructor
 */
class Sheet {
  constructor(name, width) {
    this._name = name;
    this._width = width;

    this._strands = [];
  }

  // Getters and setters
  getName() {
    return this._name;
  }

  getWidth() {
    return this._width;
  }

  addStrand(strand) {
    this._strands.push(strand);
    this._width = this._strands.length;
  }

  addEmptyStrand() {
    this._strands.push(new Strand(null, null, null, null, null, null));
  }

  _finalize(serialAtomMap, residueHash, complex) {
    const s = this._strands;
    for (let i = 0, n = s.length; i < n; ++i) {
      s[i]._finalize(serialAtomMap, residueHash, complex);
    }
    if (!this._width) {
      this._width = s.length;
    }
    if (s.length !== this._width) {
      throw new Error(`Sheet ${this._name} is inconsistent.`);
    }
  }
}

export default Sheet;
