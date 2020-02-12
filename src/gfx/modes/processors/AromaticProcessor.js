import RCGroup from '../../RCGroup';

class AromaticProcessor extends RCGroup {
  constructor(AromaticGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
    super();
    const self = this;
    this._complex = complex;
    const atoms = complex.getAtoms();
    const transforms = complex.getTransforms();
    if (!mode.showAromaticLoops()) {
      return;
    }

    complex.forEachComponent((component) => {
      const atomsIdc = [];
      let chunksCount = 0;
      const cycles = [];
      let cycleIdx = 0;
      component.forEachCycle((cycle) => {
        const cycAtoms = cycle.atoms;
        let perCycle = 0;
        for (let i = 0, n = cycAtoms.length; i < n; ++i) {
          if ((cycAtoms[i].mask & mask) !== 0) {
            ++perCycle;
            atomsIdc[chunksCount++] = cycAtoms[i].index;
          }
        }
        if (perCycle > 0) {
          cycles[cycleIdx++] = cycle;
        }
      });

      const atomsGroup = new AromaticGroup(geoParams, {
        cycles,
        atoms,
        chunks: atomsIdc,
        parent: complex,
      }, colorer, mode, transforms, polyComplexity, material);
      atomsGroup._component = component;
      self.add(atomsGroup);
    });
  }

  getSubset(mask, innerOnly) {
    const totalSubset = [];
    const { children } = this;
    let meshIdx = 0;
    for (let i = 0, n = children.length; i < n; ++i) {
      if (children[i].getSubset) {
        const chSubset = children[i].getSubset(mask, innerOnly);
        for (let j = 0, m = chSubset.length; j < m; ++j) {
          const subsetEl = chSubset[j];
          subsetEl._component = children[i]._component;
          totalSubset[meshIdx++] = subsetEl;
        }
      }
    }
    return totalSubset;
  }
}

export default AromaticProcessor;
