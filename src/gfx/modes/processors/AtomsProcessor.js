

import RCGroup from '../../RCGroup';

function AtomsProcessor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
  var self = this;
  RCGroup.call(self);
  this._complex = complex;
  var atoms = complex.getAtoms();
  var transforms = complex.getTransforms();

  complex.forEachComponent(function(component) {
    var atomsIdc = [];
    var atomCount = 0;
    component.forEachAtom(function(atom) {
      if (!self._checkAtom(atom, mask)) {
        return;
      }
      atomsIdc[atomCount++] = atom._index;
    });
    if (atomCount === 0) {
      return;
    }
    var atomsGroup = new AtomsGroup(geoParams, {
      atoms: atoms,
      chunks: atomsIdc,
      parent: complex
    }, colorer, mode, transforms, polyComplexity, material);
    atomsGroup._component = component;
    self.add(atomsGroup);
  });
}

AtomsProcessor.prototype = Object.create(RCGroup.prototype);
AtomsProcessor.prototype.constructor = AtomsProcessor;

AtomsProcessor.prototype._checkAtom = function(atom, mask) {
  return atom._mask & mask;
};

AtomsProcessor.prototype.getSubset = function(mask, innerOnly) {
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

export default AtomsProcessor;

