

import RCGroup from '../../RCGroup';

function BondsProcessor(BondsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
  var self = this;
  RCGroup.call(self);
  this._complex = complex;
  var bonds = complex.getBonds();
  var transforms = complex.getTransforms();

  complex.forEachComponent(function(component) {
    var bondsIdc = [];
    var bondsCount = 0;
    component.forEachBond(function(bond) {
      var atom1 = bond._left;
      var atom2 = bond._right;
      if (!(atom1._mask & mask) || !(atom2._mask & mask)) {
        return;
      }
      bondsIdc[bondsCount++] = bond._index;
    });
    if (bondsCount === 0) {
      return;
    }
    var bondsGroup = new BondsGroup(geoParams, {
      bonds: bonds,
      chunks: bondsIdc,
      parent: complex
    }, colorer, mode, transforms, polyComplexity, material);
    bondsGroup._component = component;
    self.add(bondsGroup);
  });
}

BondsProcessor.prototype = Object.create(RCGroup.prototype);
BondsProcessor.prototype.constructor = BondsProcessor;

BondsProcessor.prototype.getSubset = function(mask, innerOnly) {
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

export default BondsProcessor;

