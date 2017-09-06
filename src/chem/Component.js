

//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////

/**
 * This class represents connected component as a part of a complex.
 * WARNING! The whole component entity is build under the assumption that residues
 * are placed in the chains and complex in ascending order of indices
 *
 * @param {Complex} complex - Molecular complex this chain belongs to.
 *
 * @exports Component
 * @constructor
 */
function Component(complex) {
  this._complex = complex;
  this._index = -1;
  this._residueIndices = [];
  this._cycles = [];
  this._subDivs = [];
  this._residueCount = 0;
}

Component.prototype.getResidues = function() {
  return this._complex._residues;
};

Component.prototype.getResidueCount = function() {
  return this._residueCount;
};

Component.prototype.forEachResidue = function(process) {
  var residues = this._complex._residues;
  var resIdc = this._residueIndices;
  for (var idIdc = 0, idCount = resIdc.length; idIdc < idCount; ++idIdc) {
    for (var idx = resIdc[idIdc].start, last = resIdc[idIdc].end; idx <= last; ++idx) {
      process(residues[idx]);
    }
  }
};

Component.prototype.setSubDivs = function(subDivs) {
  this._subDivs = subDivs;
  var curr = 0;
  var resIdc = [];
  var resCnt = 0;
  for (var i = 0, n = subDivs.length; i < n; ++i) {
    if (i === n - 1 || subDivs[i].end + 1 !== subDivs[i + 1].start) {
      var start = subDivs[curr].start;
      var end = subDivs[i].end;
      resIdc[resIdc.length] = {
        start: start,
        end: end
      };
      resCnt += end - start + 1;
      curr = i + 1;
    }
  }

  this._residueIndices = resIdc;
  this._residueCount = resCnt;
};

Component.prototype.getComplex = function() {
  return this._complex;
};

Component.prototype.forEachBond = function(process) {
  var bonds = this._complex._bonds;

  for (var i = 0, n = bonds.length; i < n; ++i) {
    var bond = bonds[i];
    if (bond._left._residue._component === this) {
      process(bond);
    }
  }
};

Component.prototype.update = function() {
  this.forEachCycle(function(cycle) {
    cycle.update();
  });
};

Component.prototype.forEachAtom = function(process) {
  this.forEachResidue(function(residue) {
    residue.forEachAtom(process);
  });
};

Component.prototype.addCycle = function(cycle) {
  this._cycles.push(cycle);
};

Component.prototype.forEachCycle = function(process) {
  var cycles = this._cycles;
  for (var i = 0, n = cycles.length; i < n; ++i) {
    process(cycles[i]);
  }
};

Component.prototype.markResidues = function() {
  var self = this;
  self.forEachResidue(function(residue) {
    residue._component = self;
  });
};

Component.prototype._forEachSubChain = function(mask, process) {
  var residues = this._complex._residues;
  var subs = this._subDivs;
  for (var i = 0, n = subs.length; i < n; ++i) {
    for (var idx = subs[i].start, last = subs[i].end; idx <= last; ++idx) {
      var currRes = residues[idx];
      if (mask & currRes._mask && currRes._isValid) {
        var end = idx + 1;
        for (; end <= last; ++end) {
          var endRes = residues[end];
          if (!(mask & endRes._mask && endRes._isValid)) {
            break;
          }
        }
        process(i, idx, end - 1);
        idx = end;
      }
    }
  }
};

Component.prototype.getMaskedSequences = function(mask) {
  var subs = [];
  var idx = 0;
  this._forEachSubChain(mask, function(_subIdx, start, end) {
    subs[idx++] = {start: start, end: end};
  });

  return subs;
};

Component.prototype.getMaskedSubdivSequences = function(mask) {
  var subs = [];
  var currIdx = -1;
  var lastSubIdx = -1;
  var subDivs = this._subDivs;

  this._forEachSubChain(mask, function(subIdx, start, end) {
    if (lastSubIdx !== subIdx) {
      ++currIdx;
      subs[currIdx] = {
        arr: [],
        boundaries: subDivs[subIdx]
      };
      lastSubIdx = subIdx;
    }
    subs[currIdx].arr[subs[currIdx].arr.length] = {start: start, end: end};
  });

  return subs;
};

export default Component;

