const CRLF = '\n';
const CRLF_LENGTH = CRLF.length; // FIXME: It is always 1, isn't it?

export default class PDBStream {
  constructor(data) {
    this._data = data;
    this._start = 0;
    this._next = -CRLF_LENGTH;
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
    const start = this._next + CRLF_LENGTH;
    this._start = start < this._end ? start : this._end;
    const next = this._data.indexOf(CRLF, this._start);
    this._next = next > 0 ? next : this._end;
  }
}
