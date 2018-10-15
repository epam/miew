export default class SDFStream {
  constructor(data) {
    this._strings = data.split(/\r?\n|\r/);
    this._currentStart = 0;
    this._currentString = 0;
  }

  setStart(start) {
    if (start >= this._strings.length) {
      this._currentStart = this._strings.length - 1;
      this._currentString = this._strings.length - 1;
    } else {
      this._currentStart = start;
      this._currentString = start;
    }
  }

  getNextString() {
    return this._strings[++this._currentString];
  }

  getStringByIndx(indx) {
    return this._strings[indx];
  }

  getCurrentString() {
    return this._strings[this._currentString];
  }

  getStringFromStart(numb) {
    this._currentString += numb;
    return this._strings[this._currentStart + numb];
  }

  findNextCompoundStart() {
    let curStr = this.getNextString();
    while (curStr !== '$$$$' && !_.isUndefined(curStr)) {
      this._currentStart++;
      curStr = this.getNextString();
    }
    this._currentString++;
    this.setStart(this._currentString);
  }

  haveStrings() {
    if (this._currentString >= this._strings.length - 4) {
      return false;
    } else {
      return true;
    }
  }
}
