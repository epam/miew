import AtomsProcessor from './AtomsProcessor';

class OrphanAtomsProcessor extends AtomsProcessor {
  constructor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
    super(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material);
  }

  _checkAtom(atom, mask) {
    if (!(atom._mask & mask)) {
      return false;
    }

    /** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
    if (this._mode.settings.now.labels !== 'no' && atom.isLabelVisible()) {
      return false;
    }
    const bonds = atom._bonds;
    for (let i = 0, n = bonds.length; i < n; ++i) {
      if ((bonds[i]._left._mask & mask) && (bonds[i]._right._mask & mask)) {
        return false;
      }
    }
    return true;
  }
}

export default OrphanAtomsProcessor;
