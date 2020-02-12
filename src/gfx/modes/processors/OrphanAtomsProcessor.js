import AtomsProcessor from './AtomsProcessor';

class OrphanAtomsProcessor extends AtomsProcessor {
  _checkAtom(atom, mask) {
    if (!(atom.mask & mask)) {
      return false;
    }

    const { bonds } = atom;
    for (let i = 0, n = bonds.length; i < n; ++i) {
      if ((bonds[i]._left.mask & mask) && (bonds[i]._right.mask & mask)) {
        return false;
      }
    }
    return true;
  }
}

export default OrphanAtomsProcessor;
