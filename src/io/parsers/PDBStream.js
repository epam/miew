export default class PDBStream {
  constructor(data) {
    this._data = data;
    this._start = 0;
    this._nextCR = -1;
    this._nextLF = -1;
    this._next = -1;
    this._end = data.length;

    this.next();
  }

  readLine() {
    return this._data.slice(this._start, this._next);
  }

  readChar(pos) {
    pos = this._start + pos - 1;
    return pos < this._next ? this._data[pos] : ' ';
  }

  readCharCode(pos) {
    pos = this._start + pos - 1;
    return pos < this._next ? this._data.charCodeAt(pos) : 32;
  }

  readString(begin, end) {
    const from = this._start + begin - 1;
    const to = this._start + end;
    return this._data.slice(from, to < this._next ? to : this._next);
  }

  readInt(begin, end) {
    return parseInt(this.readString(begin, end), 10);
  }

  readFloat(begin, end) {
    return parseFloat(this.readString(begin, end));
  }

  end() {
    return this._start >= this._end;
  }

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
