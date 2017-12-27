

import RCGroup from '../../RCGroup';

function AromaticProcessor(
  AromaticGroup,
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
  var atoms = complex.getAtoms();
  var transforms = complex.getTransforms();
  if (!mode.showAromaticLoops()) {
    return;
  }

  complex.forEachComponent(function(component) {
    var atomsIdc = [];
    var chunksCount = 0;
    var cycles = [];
    var cycleIdx = 0;
    component.forEachCycle(function(cycle) {
      var cycAtoms = cycle.atoms;
      var perCycle = 0;
      for (var i = 0, n = cycAtoms.length; i < n; ++i) {
        if ((cycAtoms[i]._mask & mask) !== 0) {
          ++perCycle;
          atomsIdc[chunksCount++] = cycAtoms[i]._index;
        }
      }
      if (perCycle > 0) {
        cycles[cycleIdx++] = cycle;
      }
    });

    var atomsGroup = new AromaticGroup(geoParams, {
      cycles: cycles,
      atoms: atoms,
      chunks: atomsIdc,
      parent: complex
    }, colorer, mode, transforms, polyComplexity, material);
    atomsGroup._component = component;
    self.add(atomsGroup);
  });
}

AromaticProcessor.prototype = Object.create(RCGroup.prototype);
AromaticProcessor.prototype.constructor = AromaticProcessor;

AromaticProcessor.prototype.getSubset = function(mask, innerOnly) {
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

export default AromaticProcessor;

