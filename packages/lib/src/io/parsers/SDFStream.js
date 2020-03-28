import _ from 'lodash';

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
    while (!_.isUndefined(curStr) && curStr.trim() !== '$$$$') {
      if (curStr.match(/>\s+<(.*)>/)) {
        res = true;
        break;
      }
      curStr = this.getNextString();
    }

    return res;
  }

  findNextCompoundStart() {
    let curStr = this.getCurrentString();
    while (!_.isUndefined(curStr) && curStr.trim() !== '$$$$') {
      curStr = this.getNextString();
    }
    this.setStart(++this._currentStringIndx);
    return this.probablyHaveDataToParse();
  }

  probablyHaveDataToParse() {
    return this._currentStringIndx < this._strings.length - 2;
  }
}
