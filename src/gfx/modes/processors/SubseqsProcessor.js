import RCGroup from '../../RCGroup';

class SubseqsProcessor extends RCGroup {
  constructor(ResidueGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
    super();
    const self = this;
    this._complex = complex;
    const residues = complex.getResidues();
    const transforms = complex.getTransforms();

    complex.forEachComponent((component) => {
      const subDivs = component.getMaskedSubdivSequences(mask);

      let chunksCount = 0;
      const resIdc = [];
      for (let subDivI = 0, subDivN = subDivs.length; subDivI < subDivN; ++subDivI) {
        const subs = subDivs[subDivI].arr;
        for (let i = 0, n = subs.length; i < n; ++i) {
          for (let j = subs[i].start, jEnd = subs[i].end; j <= jEnd; ++j) {
            resIdc[chunksCount++] = residues[j]._index;
          }
        }
      }

      if (chunksCount === 0) {
        return;
      }
      const residuesGroup = new ResidueGroup(geoParams, {
        residues,
        chunks: resIdc,
        subdivs: subDivs,
        parent: complex,
      }, colorer, mode, transforms, polyComplexity, material);
      residuesGroup._component = component;
      self.add(residuesGroup);
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

export default SubseqsProcessor;
