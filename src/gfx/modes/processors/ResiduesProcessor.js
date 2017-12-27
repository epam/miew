

import RCGroup from '../../RCGroup';

function ResiduesProcessor(
  ResidueGroup,
  geoParams,
  complex,
  colorer,
  mode,
  polyComplexity,
  mask,
  material
) {
  var self = this;
  RCGroup.call(self);
  this._complex = complex;
  var residues = complex.getResidues();
  var transforms = complex.getTransforms();

  complex.forEachComponent(function(component) {
    var chunksCount = 0;
    var resIdc = [];
    component.forEachResidue(function(residue) {
      if (self._checkResidue(residue, mask)) {
        resIdc[chunksCount++] = residue._index;
      }
    });

    if (chunksCount === 0) {
      return;
    }
    var residuesGroup = new ResidueGroup(geoParams, {
      residues: residues,
      chunks: resIdc,
      parent: complex
    }, colorer, mode, transforms, polyComplexity, material);
    residuesGroup._component = component;
    self.add(residuesGroup);
  });
}

ResiduesProcessor.prototype = Object.create(RCGroup.prototype);
ResiduesProcessor.prototype.constructor = ResiduesProcessor;

ResiduesProcessor.prototype._checkResidue = function(residue, mask) {
  return residue._mask & mask;
};

ResiduesProcessor.prototype.getSubset = function(mask, innerOnly) {
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

export default ResiduesProcessor;

