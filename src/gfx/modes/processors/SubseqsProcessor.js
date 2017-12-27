

import RCGroup from '../../RCGroup';

function SubseqsProcessor(ResidueGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
  var self = this;
  RCGroup.call(self);
  this._complex = complex;
  var residues = complex.getResidues();
  var transforms = complex.getTransforms();

  complex.forEachComponent(function(component) {
    var subDivs = component.getMaskedSubdivSequences(mask);

    var chunksCount = 0;
    var resIdc = [];
    for (var subDivI = 0, subDivN = subDivs.length; subDivI < subDivN; ++subDivI) {
      var subs = subDivs[subDivI].arr;
      for (var i = 0, n = subs.length; i < n; ++i) {
        for (var j = subs[i].start, jEnd = subs[i].end; j <= jEnd; ++j) {
          resIdc[chunksCount++] = residues[j]._index;
        }
      }
    }

    if (chunksCount === 0) {
      return;
    }
    var residuesGroup = new ResidueGroup(geoParams, {
      residues: residues,
      chunks: resIdc,
      subdivs: subDivs,
      parent: complex
    }, colorer, mode, transforms, polyComplexity, material);
    residuesGroup._component = component;
    self.add(residuesGroup);
  });
}

SubseqsProcessor.prototype = Object.create(RCGroup.prototype);
SubseqsProcessor.prototype.constructor = SubseqsProcessor;

SubseqsProcessor.prototype.getSubset = function(mask, innerOnly) {
  var totalSubset = [];
  var children = this.children;
  var meshIdx = 0;
  for (var i = 0, n = children.length; i < n; ++i) {
    if (children[i].getSubset) {
      var chSubset = children[i].getSubset(mask, innerOnly);
      for (var j = 0, m = chSubset.length; j < m; ++j) {
        var subsetEl = chSubset[j];
        subsetEl._component = children[i]._component;
        totalSubset[meshIdx++] = subsetEl;
      }
    }
  }
  return totalSubset;
};

export default SubseqsProcessor;

