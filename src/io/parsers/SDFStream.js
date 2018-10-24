export default class SDFStream {
  constructor(data) {
    this._strings = data.split(/\r?\n|\r/);
    this._currentStart = 0;
    this._currentStringIndx = 0;
  }

  setStart(start) {
    if (start >= this._strings.length) {
      this._currentStart = this._strings.length - 1;
      this._currentStringIndx = this._strings.length - 1;
    } else {
      this._currentStart = start;
      this._currentStringIndx = start;
    }
  }

  getNextString() {
    return this._strings[++this._currentStringIndx];
  }

  getStringByIndx(indx) {
    return this._strings[indx];
  }

  getCurrentString() {
    return this._strings[this._currentStringIndx];
  }

  getStringFromStart(numb) {
    this._currentStringIndx = this._currentStart + numb;
    return this._strings[this._currentStart + numb];
  }

  findNextDataItem() {
    let curStr = this.getNextString();
    let res = false;
    while (!_.isUndefined(curStr) && !curStr.match(/>\s+<(.*)>/) && curStr.trim() !== '$$$$') {
      curStr = this.getNextString();
    }

    if (this.probablyHaveDataToParse() && curStr.trim() !== '$$$$') {
      res = true;
    }

    return res;
  }

  findNextCompoundStart() {
    let curStr = this.getCurrentString()
    let res = false;
    while (curStr !== '$$$$' && !_.isUndefined(curStr)) {
      this._currentStart++;
      curStr = this.getNextString();
    }
    this._currentStringIndx++;
    this.setStart(this._currentStringIndx);

    if (this.probablyHaveDataToParse()) {
      res = true;
    }

    return res;
  }

  probablyHaveDataToParse() {
    if (this._currentStringIndx >= this._strings.length - 2) {
      return false;
    } else {
      return true;
    }
  }
}
