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
class Component {
  constructor(complex) {
    this._complex = complex;
    this._index = -1;
    this._residueIndices = [];
    this._cycles = [];
    this._subDivs = [];
    this._residueCount = 0;
  }

  getResidues() {
    return this._complex._residues;
  }

  getResidueCount() {
    return this._residueCount;
  }

  forEachResidue(process) {
    const residues = this._complex._residues;
    const resIdc = this._residueIndices;
    for (let idIdc = 0, idCount = resIdc.length; idIdc < idCount; ++idIdc) {
      for (let idx = resIdc[idIdc].start, last = resIdc[idIdc].end; idx <= last; ++idx) {
        process(residues[idx]);
      }
    }
  }

  setSubDivs(subDivs) {
    this._subDivs = subDivs;
    let curr = 0;
    const resIdc = [];
    let resCnt = 0;
    for (let i = 0, n = subDivs.length; i < n; ++i) {
      if (i === n - 1 || subDivs[i].end + 1 !== subDivs[i + 1].start) {
        const { start } = subDivs[curr];
        const { end } = subDivs[i];
        resIdc[resIdc.length] = {
          start,
          end,
        };
        resCnt += end - start + 1;
        curr = i + 1;
      }
    }

    this._residueIndices = resIdc;
    this._residueCount = resCnt;
  }

  getComplex() {
    return this._complex;
  }

  forEachBond(process) {
    const bonds = this._complex._bonds;

    for (let i = 0, n = bonds.length; i < n; ++i) {
      const bond = bonds[i];
      if (bond._left.residue._component === this) {
        process(bond);
      }
    }
  }

  update() {
    this.forEachCycle((cycle) => {
      cycle.update();
    });
  }

  forEachAtom(process) {
    this.forEachResidue((residue) => {
      residue.forEachAtom(process);
    });
  }

  addCycle(cycle) {
    this._cycles.push(cycle);
  }

  forEachCycle(process) {
    const cycles = this._cycles;
    for (let i = 0, n = cycles.length; i < n; ++i) {
      process(cycles[i]);
    }
  }

  markResidues() {
    const self = this;
    self.forEachResidue((residue) => {
      residue._component = self;
    });
  }

  _forEachSubChain(mask, process) {
    const residues = this._complex._residues;
    const subs = this._subDivs;
    for (let i = 0, n = subs.length; i < n; ++i) {
      for (let idx = subs[i].start, last = subs[i].end; idx <= last; ++idx) {
        const currRes = residues[idx];
        if (mask & currRes._mask && currRes._isValid) {
          let end = idx + 1;
          for (; end <= last; ++end) {
            const endRes = residues[end];
            if (!(mask & endRes._mask && endRes._isValid)) {
              break;
            }
          }
          process(i, idx, end - 1);
          idx = end;
        }
      }
    }
  }

  getMaskedSequences(mask) {
    const subs = [];
    let idx = 0;
    this._forEachSubChain(mask, (_subIdx, start, end) => {
      subs[idx++] = { start, end };
    });

    return subs;
  }

  getMaskedSubdivSequences(mask) {
    const subs = [];
    let currIdx = -1;
    let lastSubIdx = -1;
    const subDivs = this._subDivs;

    this._forEachSubChain(mask, (subIdx, start, end) => {
      if (lastSubIdx !== subIdx) {
        ++currIdx;
        subs[currIdx] = {
          arr: [],
          boundaries: subDivs[subIdx],
        };
        lastSubIdx = subIdx;
      }
      subs[currIdx].arr[subs[currIdx].arr.length] = { start, end };
    });

    return subs;
  }
}

export default Component;
