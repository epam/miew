

import ChemGroup from './ChemGroup';


function ResiduesTraceGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  var subDiv = selection.subdivs;
  var chunksCount = 0;
  for (var subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
    var subs = subDiv[subDivI].arr;
    for (var i = 0, n = subs.length; i < n; ++i) {
      chunksCount += subs[i].end - subs[i].start;
    }
  }
  this._geoArgs = [chunksCount, polyComplexity];
  ChemGroup.call(this, geoParams, selection, colorer, mode, transforms, polyComplexity, material);
}

ResiduesTraceGroup.prototype = Object.create(ChemGroup.prototype);
ResiduesTraceGroup.prototype.constructor = ResiduesTraceGroup;
ResiduesTraceGroup.prototype._build = function() {
  var residues = this._selection.residues;
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  var chunkIdx = 0;
  var chunkIdc = [];
  var subDiv = this._selection.subdivs;
  var stickRad = mode.calcStickRadius();

  for (var subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
    var subs = subDiv[subDivI].arr;
    for (var i = 0, n = subs.length; i < n; ++i) {
      var startIdx = subs[i].start;
      var endIdx = subs[i].end;
      var prevRes = residues[startIdx];
      for (var idx = startIdx + 1; idx <= endIdx; ++idx) {
        var currRes = residues[idx];
        chunkIdc[chunkIdx] = {first: prevRes._index, second: currRes._index};
        geo.setItem(chunkIdx, prevRes._controlPoint, currRes._controlPoint, stickRad);
        geo.setColor(chunkIdx, colorer.getResidueColor(prevRes, parent), colorer.getResidueColor(currRes, parent));
        chunkIdx++;
        prevRes = currRes;
      }
    }
  }

  this._chunksIdc = chunkIdc;
  geo.finalize();
};

ResiduesTraceGroup.prototype.updateToFrame = function(frameData) {
  // TODO This method looks like a copy paste. However, it
  // was decided to postpone animation refactoring until GFX is fixed.

  var residues = frameData.getResidues();
  var parent = this._selection.parent;
  var mode = this._mode;
  var colorer = this._colorer;
  var geo = this._geo;
  var chunkIdx = 0;
  var subDiv = this._selection.subdivs;
  var stickRad = mode.calcStickRadius();
  var updateColor = frameData.needsColorUpdate(colorer);

  for (var subDivI = 0, subDivN = subDiv.length; subDivI < subDivN; ++subDivI) {
    var subs = subDiv[subDivI].arr;
    for (var i = 0, n = subs.length; i < n; ++i) {
      var startIdx = subs[i].start;
      var endIdx = subs[i].end;
      var prevRes = residues[startIdx];
      for (var idx = startIdx + 1; idx <= endIdx; ++idx) {
        var currRes = residues[idx];
        geo.setItem(chunkIdx, prevRes._controlPoint, currRes._controlPoint, stickRad);
        if (updateColor) {
          geo.setColor(chunkIdx, colorer.getResidueColor(prevRes, parent), colorer.getResidueColor(currRes, parent));
        }
        chunkIdx++;
        prevRes = currRes;
      }
    }
  }

  geo.finalize();
};

ResiduesTraceGroup.prototype.raycast = function(raycaster, intersects) {
  var inters = [];
  var residues = this._selection.residues;
  this._mesh.raycast(raycaster, inters);
  var chunksToIdx = this._chunksIdc;
  // process inters array - arr object references
  for (var i = 0, n = inters.length; i < n; ++i) {
    if (!inters[i].hasOwnProperty('chunkIdx')) {
      continue;
    }
    var chunkIdx = inters[i].chunkIdx;
    var chunk = chunksToIdx[Math.floor(chunkIdx / 2)];
    var resIdx = chunkIdx % 2 === 0 ? chunk.first : chunk.second;
    if (resIdx < residues.length) {
      inters[i].residue = residues[resIdx];
      intersects.push(inters[i]);
    }
  }
};

ResiduesTraceGroup.prototype._calcChunksList = function(mask) {
  var chunksList = [];
  var chunksToIdx = this._chunksIdc;
  var residues = this._selection.residues;
  for (var i = 0, n = chunksToIdx.length; i < n; ++i) {
    var chunk = chunksToIdx[i];
    if (residues[chunk.first]._mask & mask) {
      chunksList.push(i * 2);
    }
    if (residues[chunk.second]._mask & mask) {
      chunksList.push(i * 2 + 1);
    }
  }
  return chunksList;
};

export default ResiduesTraceGroup;

