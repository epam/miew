import * as THREE from 'three';
import SecondaryStructureColorer from './colorers/SecondaryStructureColorer';

const cDataOffset = 12;
const cFirstMask = 0x0FFFFF00;
const cFirstShift = 8;
const cSecMask1 = 0x000000FF;
const cSecShift1 = 12;
const cSecMask2 = 0xFFF00000;
const cSecShift2 = 20;
const cThirdMask = 0x000FFFFF;
const cStrMask = 0xF0000000;
const cStrShift = 28;
const c219 = 1 << 19;
const c220 = 1 << 20;

const cHelixIdx = 1;
const cSheetIdx = 2;
const secTypes = ['helix', 'strand'];
const cSecNames = ['fs', 'ps', 'ns', 'us'];

function _createSecondary(strArray, complex) {
  const residues = complex._residues;
  const nRes = residues.length;
  const resid = new Uint8Array(nRes);

  const atoms = complex._atoms;
  for (let i = 0, n = strArray.length; i < n; ++i) {
    const atom = atoms[i];
    resid[atom.residue._index] = strArray[i];
  }

  const secondary = [];
  let rIdx = 0;
  while (rIdx < nRes) {
    if (resid[rIdx] !== 0) {
      const start = rIdx;
      const val = resid[rIdx];
      while (rIdx < nRes - 1 && resid[rIdx + 1] === val
      && residues[rIdx].isConnected(residues[rIdx + 1])) {
        ++rIdx;
      }
      secondary.push({ start, end: rIdx, type: secTypes[val - 1] });
    }
    ++rIdx;
  }
  return secondary;
}

function fromUInt20ToInt20(uint20) {
  return uint20 >= c219 ? uint20 - c220 : uint20;
}

class FrameInfo {
  constructor(complex, payload, callbacks) {
    this._complex = complex;
    this._secondary = null;
    this.isLoading = false;
    this._framesRange = {
      start: 0,
      end: -1,
    };
    this.frameIsReady = false;
    this._buffer = null;
    this._frameRequest = null;
    this._callbacks = callbacks;
    if (typeof payload === 'function') {
      this._framesRequestLength = 1;
      this._downloadDataFn = payload;
    } else {
      this.parseBinaryData(payload, true);
    }
    this.reset();
    this.setFrame(0);
  }

  _prepareBuffer(framesStart, framesEnd) {
    if (framesStart === undefined || framesStart === null) {
      framesStart = 0;
    }
    if (framesEnd === undefined || framesEnd === null) {
      framesEnd = framesStart + this._framesRequestLength;
    }
    if (this._framesCount !== undefined) {
      framesEnd = Math.min(this._framesCount - 1, framesEnd);
    }
    if (this._downloadDataFn) {
      const self = this;
      const onDone = function (data) {
        self.isLoading = false;
        if (self._callbacks && typeof self._callbacks.onLoadStatusChanged === 'function') {
          self._callbacks.onLoadStatusChanged();
        }
        self._buffer = {
          data,
          state: 'ready',
          start: framesStart,
          end: framesEnd,
        };
        if (self._frameRequest !== null) {
          const idx = self._frameRequest;
          self._frameRequest = null;
          self.setFrame(idx);
        }
      };
      const onFail = function () {
        self.isLoading = false;
        if (self._callbacks && typeof self._callbacks.onError === 'function') {
          self._callbacks.onError('Streaming failed');
        }
      };
      if (!this._buffer) {
        this._buffer = {};
      }
      this._buffer.state = 'downloading';
      this.isLoading = true;
      if (self._callbacks && typeof self._callbacks.onLoadStatusChanged === 'function') {
        self._callbacks.onLoadStatusChanged();
      }
      this._downloadDataFn({ start: framesStart, end: framesEnd + 1 }, onDone, onFail);
    }
  }

  _parseBuffer() {
    if (this._buffer && this._buffer.state === 'ready') {
      this._framesRange = {
        start: this._buffer.start,
        end: this._buffer.end,
      };
      this.parseBinaryData(this._buffer.data, false);
      let _bufferRequestStart = (this._buffer.end + 1) % this._framesCount;
      if (_bufferRequestStart >= this._framesCount) {
        _bufferRequestStart = 0;
      }
      this._buffer = {
        state: 'none',
      };
      this._prepareBuffer(_bufferRequestStart, _bufferRequestStart + this._framesRequestLength);
      if (this._frameRequest !== null) {
        const idx = this._frameRequest;
        this._frameRequest = null;
        this.setFrame(idx);
      }
    }
  }

  parseBinaryData(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    let offset = 0;
    const atomsCount = dataView.getUint32(offset, true);
    offset += 4;
    const framesCount = dataView.getUint32(offset, true);
    this._framesCount = framesCount;
    this._framesRange.end = this._framesRange.end > 0
      ? Math.min(this._framesRange.end, framesCount - 1) : framesCount - 1;
    offset += 4;
    this._atomsCount = atomsCount;
    const maxSize = 1024 * 1024; // 1 MB
    this._framesRequestLength = Math.ceil(maxSize / (atomsCount * 8));
    const chunkedFramesCount = this._framesRange.end - this._framesRange.start + 1;
    if (atomsCount !== this._complex._atoms.length
      || arrayBuffer.byteLength !== cDataOffset + chunkedFramesCount * atomsCount * 8) {
      throw new Error();
    }
    const complex = this._complex;
    let timeStep = dataView.getUint32(offset, true);
    let iName = 0;
    while (timeStep > 1000 && iName < cSecNames.length - 1) {
      timeStep /= 1000;
      ++iName;
    }

    this._timeStep = `${timeStep.toString()} ${cSecNames[iName]}`;
    offset += 4;
    const secondary = [];
    const posData = new Float32Array(chunkedFramesCount * atomsCount * 3);
    let coordIdx = 0;
    const secondaryArr = new Int8Array(atomsCount);
    for (let j = 0; j < chunkedFramesCount; ++j) {
      for (let i = 0; i < atomsCount; ++i) {
        const hiWord = dataView.getUint32(offset, true);
        offset += 4;
        const loWord = dataView.getUint32(offset, true);
        offset += 4;
        const str = (loWord & cStrMask) >>> cStrShift;
        const x = fromUInt20ToInt20(((loWord & cFirstMask) >>> cFirstShift) >> 0);
        const y = fromUInt20ToInt20((((loWord & cSecMask1) << cSecShift1)
          | ((hiWord & cSecMask2) >>> cSecShift2)) >> 0);
        const z = fromUInt20ToInt20((hiWord & cThirdMask) >> 0);
        secondaryArr[i] = 0;
        if (str > 0 && str < 4) {
          secondaryArr[i] = cHelixIdx;
        } else if (str === 4) {
          secondaryArr[i] = cSheetIdx;
        }
        posData[coordIdx++] = x / 100;
        posData[coordIdx++] = y / 100;
        posData[coordIdx++] = z / 100;
      }
      secondary.push(_createSecondary(secondaryArr, complex));
    }
    this._secondaryData = secondary;
    this._data = posData;
  }

  nextFrame() {
    this.setFrame((this._currFrame + 1) % this._framesCount);
  }

  needsColorUpdate(colorer) {
    return colorer instanceof SecondaryStructureColorer;
  }

  getAtomColor(colorer, atom) {
    return colorer.getResidueColor(this._residues[atom.residue._index], this._complex);
  }

  getResidueColor(colorer, residue) {
    return colorer.getResidueColor(this._residues[residue._index], this._complex);
  }

  _updateSecondary() {
    let i;
    const myResidues = this._residues;
    let n = myResidues.length;
    for (i = 0; i < n; ++i) {
      myResidues[i]._secondary = null;
    }
    const sec = this._secondaryData[this._currFrame - this._framesRange.start];
    for (i = 0, n = sec.length; i < n; ++i) {
      const oldSec = sec[i];
      const { start, end } = oldSec;
      const nSec = {
        _start: myResidues[start],
        _end: myResidues[end],
        type: oldSec.type,
        generic: oldSec.generic,
      };
      for (let j = start; j <= end; ++j) {
        myResidues[j]._secondary = nSec;
      }
    }
  }

  reset() {
    const compRes = this._complex._residues;
    const n = compRes.length;
    this._residues = new Array(n);
    const myResidues = this._residues;
    const getSec = function () {
      return this._secondary;
    };
    for (let i = 0; i < n; ++i) {
      myResidues[i] = {
        _type: compRes[i]._type,
        _isValid: compRes[i]._isValid,
        _controlPoint: null,
        _wingVector: null,
        _secondary: null,
        getSecondary: getSec,
      };
    }
  }

  setFrame(frameIdx) {
    this.frameIsReady = false;
    if (frameIdx >= this._framesRange.start && frameIdx <= this._framesRange.end) {
      this._currFrame = frameIdx;
      this._cachedResidues = false;
      this._updateSecondary();
      this.frameIsReady = true;
    } else {
      this._frameRequest = frameIdx;
      if (!this._buffer) {
        this._prepareBuffer(frameIdx);
      } else {
        const self = this;
        switch (this._buffer.state) {
          case 'none':
            this._prepareBuffer(frameIdx);
            break;
          case 'ready':
            self._parseBuffer();
            break;
          default:
            break;
        }
      }
    }
  }

  disableEvents() {
    this._callbacks = null;
  }

  /**
   * Returns link to atom pos vector, clone it if needed
   */

  static _vec = new THREE.Vector3();

  getAtomPos(atomIdx) {
    const vec = FrameInfo._vec;
    const self = this;
    const data = self._data;
    const idx = (self._atomsCount * (self._currFrame - self._framesRange.start) + atomIdx) * 3;
    vec.set(data[idx], data[idx + 1], data[idx + 2]);
    return vec;
  }

  getResidues() {
    if (this._cachedResidues) {
      return this._residues;
    }
    this._complex.updateToFrame(this);
    return this._residues;
  }
}
export default FrameInfo;
