

import AtomsProcessor from './AtomsProcessor';

function OrphanAtomsProcessor(AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material) {
  this._mode = mode;
  AtomsProcessor.call(this, AtomsGroup, geoParams, complex, colorer, mode, polyComplexity, mask, material);
}

OrphanAtomsProcessor.prototype = Object.create(AtomsProcessor.prototype);
OrphanAtomsProcessor.prototype.constructor = OrphanAtomsProcessor;

OrphanAtomsProcessor.prototype._checkAtom = function(atom, mask) {
  if (!(atom._mask & mask)) {
    return false;
  }

  /** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
  if (this._mode.settings.now.labels !== 'no' && atom.isLabelVisible()) {
    return false;
  }
  var bonds = atom._bonds;
  for (var i = 0, n = bonds.length; i < n; ++i) {
    if ((bonds[i]._left._mask & mask) && (bonds[i]._right._mask & mask)) {
      return false;
    }
  }
  return true;
};

export default OrphanAtomsProcessor;

