

import * as THREE from 'three';
import SecondaryStructureColorer from './colorers/SecondaryStructureColorer';
var cDataOffset = 12;
var cFirstMask = 0x0FFFFF00;
var cFirstShift = 8;
var cSecMask1   = 0x000000FF;
var cSecShift1  = 12;
var cSecMask2   = 0xFFF00000;
var cSecShift2  = 20;
var cThirdMask  = 0x000FFFFF;
var cStrMask = 0xF0000000;
var cStrShift = 28;
var c219 = 1 << 19;
var c220 = 1 << 20;

var cHelixIdx = 1;
var cSheetIdx = 2;
var secTypes = ['helix', 'strand'];
var cSecNames = ['fs', 'ps', 'ns', 'us'];

function _createSecondary(strArray, complex) {
  var residues = complex._residues;
  var nRes = residues.length;
  var resid = new Uint8Array(nRes);

  var atoms = complex._atoms;
  for (var i = 0, n = strArray.length; i < n; ++i) {
    var atom = atoms[i];
    resid[atom._residue._index] = strArray[i];
  }

  var secondary = [];
  var rIdx = 0;
  while (rIdx < nRes) {
    if (resid[rIdx] !== 0) {
      var start = rIdx;
      var val = resid[rIdx];
      while (rIdx < nRes - 1 && resid[rIdx + 1] === val &&
        residues[rIdx].isConnected(residues[rIdx + 1])) {
        ++rIdx;
      }
      secondary.push({start: start, end: rIdx, type: secTypes[val - 1]});
    }
    ++rIdx;
  }
  return secondary;
}

function fromUInt20ToInt20(uint20) {
  return uint20 >= c219 ? uint20 - c220 : uint20;
}

function FrameInfo(complex, payload, callbacks) {
  this._complex = complex;
  this._secondary = null;
  this.isLoading = false;
  this._framesRange = {
    start: 0,
    end: -1
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

FrameInfo.prototype._prepareBuffer = function(framesStart, framesEnd) {
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
    var self = this;
    var onDone = function(data) {
      self.isLoading = false;
      if (self._callbacks && typeof self._callbacks.onLoadStatusChanged === 'function') {
        self._callbacks.onLoadStatusChanged();
      }
      self._buffer = {
        data: data,
        state: 'ready',
        start: framesStart,
        end: framesEnd
      };
      if (self._frameRequest !== null) {
        var idx = self._frameRequest;
        self._frameRequest = null;
        self.setFrame(idx);
      }
    };
    var onFail = function() {
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
    this._downloadDataFn({start: framesStart, end: framesEnd + 1}, onDone, onFail);
  }
};

FrameInfo.prototype._parseBuffer = function() {
  if (this._buffer && this._buffer.state === 'ready') {
    this._framesRange = {
      start: this._buffer.start,
      end: this._buffer.end
    };
    this.parseBinaryData(this._buffer.data, false);
    var _bufferRequestStart = (this._buffer.end + 1) % this._framesCount;
    if (_bufferRequestStart >= this._framesCount) {
      _bufferRequestStart = 0;
    }
    this._buffer = {
      state: 'none'
    };
    this._prepareBuffer(_bufferRequestStart, _bufferRequestStart + this._framesRequestLength);
    if (this._frameRequest !== null) {
      var idx = this._frameRequest;
      this._frameRequest = null;
      this.setFrame(idx);
    }
  }
};

FrameInfo.prototype.parseBinaryData = function(arrayBuffer) {
  var dataView = new DataView(arrayBuffer);
  var offset = 0;
  var atomsCount = dataView.getUint32(offset, true);
  offset += 4;
  var framesCount = dataView.getUint32(offset, true);
  this._framesCount = framesCount;
  this._framesRange.end = this._framesRange.end > 0 ?
    Math.min(this._framesRange.end, framesCount - 1) : framesCount - 1;
  offset += 4;
  this._atomsCount = atomsCount;
  var maxSize = 1024 * 1024; // 1 MB
  this._framesRequestLength = Math.ceil(maxSize / (atomsCount * 8));
  var chunkedFramesCount = this._framesRange.end - this._framesRange.start + 1;
  if (atomsCount !== this._complex._atoms.length ||
      arrayBuffer.byteLength !== cDataOffset + chunkedFramesCount * atomsCount * 8) {
    throw new Error();
  }
  var complex = this._complex;
  var timeStep = dataView.getUint32(offset, true);
  var iName = 0;
  while (timeStep > 1000 && iName < cSecNames.length - 1) {
    timeStep /= 1000;
    ++iName;
  }

  this._timeStep = timeStep.toString() + ' ' + cSecNames[iName];
  offset += 4;
  var secondary = [];
  var posData = new Float32Array(chunkedFramesCount * atomsCount * 3);
  var coordIdx = 0;
  var secondaryArr = new Int8Array(atomsCount);
  for (var j = 0; j < chunkedFramesCount; ++j) {
    for (var i = 0; i < atomsCount; ++i) {
      var hiWord = dataView.getUint32(offset, true);
      offset += 4;
      var loWord = dataView.getUint32(offset, true);
      offset += 4;
      var str = (loWord & cStrMask) >>> cStrShift;
      var x = fromUInt20ToInt20(((loWord & cFirstMask) >>> cFirstShift) >> 0);
      var y = fromUInt20ToInt20((((loWord & cSecMask1) << cSecShift1) | ((hiWord & cSecMask2) >>> cSecShift2)) >> 0);
      var z = fromUInt20ToInt20((hiWord & cThirdMask) >> 0);
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
};

FrameInfo.prototype.nextFrame = function() {
  this.setFrame((this._currFrame + 1) % this._framesCount);
};

FrameInfo.prototype.needsColorUpdate = function(colorer) {
  return colorer instanceof SecondaryStructureColorer;
};

FrameInfo.prototype.getAtomColor = function(colorer, atom) {
  return colorer.getResidueColor(this._residues[atom._residue._index], this._complex);
};

FrameInfo.prototype.getResidueColor = function(colorer, residue) {
  return colorer.getResidueColor(this._residues[residue._index], this._complex);
};

FrameInfo.prototype._updateSecondary = function() {
  var i;
  var myResidues = this._residues;
  var n = myResidues.length;
  for (i = 0; i < n; ++i) {
    myResidues[i]._secondary = null;
  }
  var sec = this._secondaryData[this._currFrame - this._framesRange.start];
  for (i = 0, n = sec.length; i < n; ++i) {
    var oldSec = sec[i];
    var start = oldSec.start;
    var end = oldSec.end;
    var nSec = {
      _start: myResidues[start],
      _end: myResidues[end],
      type: oldSec.type,
      _residues: [],
    };
    for (var j = start; j <= end; ++j) {
      nSec._residues.push(myResidues[j]);
      myResidues[j]._secondary = nSec;
    }
  }
};

FrameInfo.prototype.reset = function() {
  var compRes = this._complex._residues;
  var n = compRes.length;
  this._residues = new Array(n);
  var myResidues = this._residues;
  var getSec = function() {
    return this._secondary;
  };
  for (var i = 0; i < n; ++i) {
    myResidues[i] = {
      _type: compRes[i]._type,
      _isValid: compRes[i]._isValid,
      _controlPoint: null,
      _wingVector: null,
      _secondary: null,
      getSecondary: getSec,
    };
  }
};

FrameInfo.prototype.setFrame = function(frameIdx) {
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
      var self = this;
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
};

FrameInfo.prototype.disableEvents = function() {
  this._callbacks = null;
};

/**
 * Returns link to atom pos vector, clone it if needed
 */
FrameInfo.prototype.getAtomPos = (function() {
  var vec = new THREE.Vector3();

  return function(atomIdx) {
    var self = this;
    var data = self._data;
    var idx = (self._atomsCount * (self._currFrame - self._framesRange.start) + atomIdx) * 3;
    vec.set(data[idx], data[idx + 1], data[idx + 2]);
    return vec;
  };
}());

FrameInfo.prototype.getResidues = function() {
  if (this._cachedResidues) {
    return this._residues;
  }
  this._complex.updateToFrame(this);
  return this._residues;
};

export default FrameInfo;

