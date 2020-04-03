import RCGroup from '../../RCGroup';

class BondsProcessor extends RCGroup {
  constructor(BondsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
    super();
    const self = this;
    this._complex = complex;
    const bonds = complex.getBonds();
    const transforms = complex.getTransforms();

    complex.forEachComponent((component) => {
      const bondsIdc = [];
      let bondsCount = 0;
      component.forEachBond((bond) => {
        const atom1 = bond._left;
        const atom2 = bond._right;
        if (!(atom1.mask & mask) || !(atom2.mask & mask)) {
          return;
        }
        bondsIdc[bondsCount++] = bond._index;
      });
      if (bondsCount === 0) {
        return;
      }
      const bondsGroup = new BondsGroup(geoParams, {
        bonds,
        chunks: bondsIdc,
        parent: complex,
      }, colorer, mode, transforms, polyComplexity, material);
      bondsGroup._component = component;
      self.add(bondsGroup);
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

export default BondsProcessor;
