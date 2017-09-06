

import * as THREE from 'three';
import ResiduesGroup from './ResiduesGroup';
import CartoonHelper from './CartoonHelper';

function _createShape(rad, parts) {
  var pts = [];

  for (var i = 0; i < parts; ++i) {

    var a = 2 * i / parts * Math.PI;

    pts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad, 0));
  }
  return pts;
}

function _loopThrough(subDiv, residues, segmentsHeight, tension, mode, callback) {
  for (var subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
    var subs = subDiv[subDivI].arr;
    var boundaries = subDiv[subDivI].boundaries;
    for (var i = 0, n = subs.length; i < n; ++i) {
      var idc = [subs[i].start, subs[i].end];
      var matrixHelper = new CartoonHelper(residues, idc[0], idc[1], segmentsHeight, tension, boundaries);
      var prevLast = null;
      var startIdx = subs[i].start * 2;
      var endIdx = subs[i].end * 2 + 1;
      for (var idx = startIdx; idx <= endIdx; ++idx) {
        var resIdx = (idx / 2 | 0);
        var currRes = residues[resIdx];
        var firstRad = mode.getResidueRadius(currRes, idx % 2);
        var secondRad = mode.getResidueRadius(currRes, 1 + idx % 2);

        var mtc = matrixHelper.prepareMatrices(idx - idc[0] * 2, firstRad, secondRad);
        mtc.unshift(prevLast === null ? mtc[0] : prevLast);

        callback(currRes, mtc, resIdx);
        prevLast = mtc[segmentsHeight];
      }
    }
  }
}

function ResiduesSubseqGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  var cmpMultiplier = mode.getHeightSegmentsRatio();
  this._segmentsHeight = polyComplexity * cmpMultiplier | 0;
  this._geoArgs = [_createShape(1.0, polyComplexity), this._segmentsHeight + 1, selection.chunks.length * 2];
  ResiduesGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

ResiduesSubseqGroup.prototype = Object.create(ResiduesGroup.prototype);
ResiduesSubseqGroup.prototype.constructor = ResiduesSubseqGroup;
ResiduesSubseqGroup.prototype._build = function() {
  var residues = this._selection.residues;
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var tension = mode.getTension();
  var geo = this._geo;
  var chunkIdx = 0;
  var chunkIdc = [];
  _loopThrough(this._selection.subdivs, residues, this._segmentsHeight, tension, mode, function(currRes, mtc) {
    var color = colorer.getResidueColor(currRes, parent);
    chunkIdc[chunkIdx] = currRes._index;
    geo.setItem(chunkIdx, mtc);
    geo.setColor(chunkIdx++, color);
  });
  this._chunksIdc = chunkIdc;
  geo.finalize();
};

ResiduesSubseqGroup.prototype.updateToFrame = function(frameData) {
  // TODO This method looks like a copy paste. However, it
  // was decided to postpone animation refactoring until GFX is fixed.
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var tension = mode.getTension();
  var geo = this._geo;
  var frameRes = frameData.getResidues();
  var chunkIdx = 0;
  var updateColor = frameData.needsColorUpdate(colorer);
  _loopThrough(this._selection.subdivs, frameRes, this._segmentsHeight, tension, mode, function(currRes, mtc) {
    geo.setItem(chunkIdx, mtc);
    if (updateColor) {
      geo.setColor(chunkIdx, colorer.getResidueColor(currRes, parent));
    }
    chunkIdx++;
  });
  geo.finalize();
};

export default ResiduesSubseqGroup;

