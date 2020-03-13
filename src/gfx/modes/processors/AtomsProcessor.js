import RCGroup from '../../RCGroup';

class AtomsProcessor extends RCGroup {
  constructor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
    super();
    const self = this;
    this._complex = complex;
    this._mode = mode;
    const atoms = complex.getAtoms();
    const transforms = complex.getTransforms();

    complex.forEachComponent((component) => {
      const atomsIdc = [];
      let atomCount = 0;
      component.forEachAtom((atom) => {
        if (!self._checkAtom(atom, mask)) {
          return;
        }
        atomsIdc[atomCount++] = atom.index;
      });
      if (atomCount === 0) {
        return;
      }
      const atomsGroup = new AtomsGroup(geoParams, {
        atoms,
        chunks: atomsIdc,
        parent: complex,
      }, colorer, mode, transforms, polyComplexity, material);
      atomsGroup._component = component;
      self.add(atomsGroup);
    });
  }

  _checkAtom(atom, mask) {
    return atom.mask & mask;
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

export default AtomsProcessor;
