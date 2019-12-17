import AtomsProcessor from './AtomsProcessor';

class OrphanAtomsProcessor extends AtomsProcessor {
  _checkAtom(atom, mask) {
    if (!(atom._mask & mask)) {
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
