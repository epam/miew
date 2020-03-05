import _ from 'lodash';
import { Matrix4 } from 'three';

export default class PDBResult {
  constructor() {
    this._resultArray = [];
    this._currentStr = -1;
    this._tag = null;
    this._fixedNumeration = false;
    this._numeration = false;
    this._tagStrNum = 0;
  }

  getResult() {
    this.writeString('\n', 81, 81);
    return this._resultArray.join('');
  }

  _currentStrLength() {
    const curStr = this._resultArray[this._currentStr];
    return curStr ? curStr.length : 0;
  }

  // numeration can be number or boolean
  // if numeration is number then just put this number to 8-10 pos in string
  // if numeration is boolean then increase number for all new strings
  newTag(tag, numeration) {
    if (!tag) {
      this._tag = null;
    } else {
      this._tag = tag;
    }
    if (!_.isUndefined(numeration)) {
      if (_.isNumber(numeration)) {
        this._tagStrNum = numeration;
        this._numeration = true;
        this._fixedNumeration = true;
      } else if (_.isBoolean(numeration)) {
        this._tagStrNum = 0;
        this._numeration = numeration;
        this._fixedNumeration = false;
      }
    } else {
      this._numeration = false;
      this._fixedNumeration = false;
      this._tagStrNum = 0;
    }
  }

  newString(tag) {
    this.writeString('\n', 81, 81);
    this._currentStr++;
    this._resultArray.push('');

    if (tag) {
      this.writeString(tag, 1, 6);
    } else if (this._tag) {
      this.writeString(this._tag, 1, 6);
    }

    if (this._numeration) {
      if (!this._fixedNumeration) {
        this._tagStrNum++;
      }
      if (this._tagStrNum !== 1) {
        this.writeString(this._tagStrNum.toString(), 10, 8);
      }
    }
  }

  writeEntireString(string, maxStrPos, concat) {
    if (!maxStrPos) {
      maxStrPos = 81;
    }
    for (let j = 0; j < string.length; j++) {
      if (this._currentStrLength() === maxStrPos && j !== string.length - 1) {
        this.newString();
        if (concat) { // pretty hardcoddy
          this.writeString(concat.tag, concat.begin, concat.end);
        }
      }
      if (string[j] === '\n') {
        this.newString();
      } else {
        this.writeString(string[j]);
      }
    }
  }

  writeString(string, begin, end) {
    let curStr = this._resultArray[this._currentStr];
    let str;

    const curStrLength = curStr ? curStr.length : 0;

    if (_.isUndefined(string)) {
      return;
    }

    if (!_.isNumber(begin)) {
      begin = curStrLength + 1;
    }

    if (!_.isNumber(end)) {
      end = curStrLength + string.length;
    }

    if (!_.isString(string)) {
      str = string.toString();
    } else {
      str = string;
    }

    const finish = begin < end ? end : begin;
    const start = begin < end ? begin : end;

    if (str.length > Math.abs(begin - end) + 1) {
      str = str.substr(0, Math.abs(begin - end + 1));
    }

    // spaces before start of new data
    if (start > curStrLength + 1) {
      this._resultArray[this._currentStr] += ' '.repeat(start - curStrLength - 1);
    } else if (start <= curStrLength) {
      const cStr = this._resultArray[this._currentStr];
      this._resultArray[this._currentStr] = cStr.slice(0, start - 1);
    }

    // if reverse order
    // reverse order of end and begin means that user wants to align text right
    if (end < begin) {
      const len = begin - end + 1;
      str = ' '.repeat(len - str.length) + str;
    }

    // some hardcode fix for space between string numeration and data
    // (see pdb file format description)
    if (start === 11 && this._numeration && this._tagStrNum !== 1) {
      str = ` ${str}`;
    }

    // append new data to string
    this._resultArray[this._currentStr] += str;
    curStr = this._resultArray[this._currentStr];

    if (finish > curStr.length) {
      this._resultArray[this._currentStr] += ' '.repeat(finish - curStr.length);
    }
  }

  writeBondsArray(bonds, atom) {
    const bondsArrays = this._getSubArrays(bonds, 4);

    for (let k = 0; k < bondsArrays.length; k++) {
      this.newString();
      this.writeString(atom.serial, 11, 7);

      for (let j = 0; j < bondsArrays[k].length; j++) {
        const serial = (bondsArrays[k][j]._left.serial === atom.serial)
          ? bondsArrays[k][j]._right.serial : bondsArrays[k][j]._left.serial;

        this.writeString(serial, 16 + 5 * j, 12 + 5 * j);
      }
    }
  }

  _getSubArrays(arr, subArraySize) {
    const subArrays = [];
    for (let i = 0; i < arr.length; i += subArraySize) {
      subArrays.push(arr.slice(i, i + subArraySize));
    }
    return subArrays;
  }

  // function for writing matrix in Remark290 and Remark350 tags
  // (see pdb file description)
  writeMatrix(matrix, matrixIndx, tag) {
    for (let j = 0; j < 3; j++) {
      this.newString();
      this.writeString(tag, 14, 18);
      this.writeString((j + 1).toString(), 19, 19);
      this.writeString(matrixIndx.toString(), 23, 20);
      for (let k = 0; k < 3; k++) {
        const numb = parseFloat(matrix.elements[j * 4 + k]).toFixed(6);
        this.writeString(numb.toString(), 33 + k * 10, 24 + k * 10);
      }

      const numb = parseFloat(matrix.elements[j * 4 + 3]).toFixed(5);
      this.writeString(numb.toString(), 68, 55);
    }
  }

  writeMatrices(matrices, string) {
    if (!matrices) {
      return;
    }
    const matrix = new Matrix4();
    for (let j = 0; j < matrices.length; j++) {
      matrix.copy(matrices[j]).transpose();
      this.writeMatrix(matrix, j + 1, string);
    }
  }
}
