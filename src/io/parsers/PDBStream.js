/** Helper class for stream-like reading input files. */
class PDBStream {
  /**
   * Create a stream
   * @param {String} data Input data
   */
  constructor(data) {
    /** @type String */
    this._data = data; // Input file
    /** @type Number */
    this._start = 0; // Starting position of line
    /** @type Number */
    this._nextCR = -1; // Position of next CR (0x0D)
    /** @type Number */
    this._nextLF = -1; // Position of next LF (0x0A)
    /** @type Number */
    this._next = -1; // End position of line
    /** @type Number */
    this._end = data.length; // End of data

    this.next();
  }

  /**
   * Reading next line.
   * @returns {String} Next line in data (ending with LF or CR)
   */
  readLine() {
    return this._data.slice(this._start, this._next);
  }

  /**
   * Reading character from position.
   * @param {Number} pos - Position in current line.
   * @returns {String} Character from position
   */
  readChar(pos) {
    pos = this._start + pos - 1;
    return pos < this._next ? this._data[pos] : ' ';
  }

  /**
   * Reading character code from position.
   * @param {Number} pos - Position in current line.
   * @returns {Number} Character code from position
   */
  readCharCode(pos) {
    pos = this._start + pos - 1;
    return pos < this._next ? this._data.charCodeAt(pos) : 32;
  }

  /**
   * Reading string from begin to end points.
   * For a reason unknown, numbering assumed not to start from 0, but from 1.
   * @param {Number} begin - Begin point in current line.
   * @param {Number} end - End point in current line.
   * @returns {String} String from begin to end
   */
  readString(begin, end) {
    const from = this._start + begin - 1;
    const to = this._start + end;
    return this._data.slice(from, to < this._next ? to : this._next);
  }

  /**
   * Reading integer from begin to end points.
   * @param {Number} begin - Begin point in current line.
   * @param {Number} end - End point in current line.
   * @returns {Number} Integer from begin to end
   */
  readInt(begin, end) {
    return parseInt(this.readString(begin, end), 10);
  }

  /**
   * Reading float from begin to end points.
   * @param {Number} begin - Begin point in current line.
   * @param {Number} end - End point in current line.
   * @returns {Number} Float from begin to end
   */
  readFloat(begin, end) {
    return parseFloat(this.readString(begin, end));
  }

  /**
   * Checking for end of data.
   * @returns {boolean} True if data is ended, false otherwise
   */
  end() {
    return this._start >= this._end;
  }

  /**
   * Procedure to re-arrange current pointers in data.
   */
  next() {
    const start = this._next + 1;
    this._start = start < this._end ? start : this._end;

    // support CR, LF, CR+LF line endings
    // do not support LF+CR, CR+CR+LF, and other strange combinations

    if (this._start > this._nextCR) {
      this._nextCR = (this._data.indexOf('\r', this._start) + 1 || this._end + 1) - 1;
    }
    if (this._start > this._nextLF) {
      this._nextLF = (this._data.indexOf('\n', this._start) + 1 || this._end + 1) - 1;
    }
    this._next = this._nextCR + 1 < this._nextLF ? this._nextCR : this._nextLF;
  }
}

export default PDBStream;
