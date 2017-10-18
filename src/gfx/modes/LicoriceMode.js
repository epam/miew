

/* eslint-disable no-magic-numbers */
import utils from '../../utils';
import LabeledMode from './LabeledMode';
function LicoriceMode(opts) {
  LabeledMode.call(this, opts);
}

utils.deriveClass(LicoriceMode, LabeledMode, {
  id: 'LC',
  name: 'Licorice',
  shortName: 'Licorice',
  depGroups: [
    'AtomsSpheres',
    'BondsCylinders',
    'ALoopsTorus',
  ],
});

LicoriceMode.prototype.calcAtomRadius = function(_atom) {
  return this.opts.bond;
};

LicoriceMode.prototype.calcStickRadius = function() {
  return this.opts.bond;
};

LicoriceMode.prototype.calcSpaceFraction = function() {
  return this.opts.space;
};

LicoriceMode.prototype.getAromRadius = function() {
  return this.opts.aromrad;
};

LicoriceMode.prototype.showAromaticLoops = function() {
  return this.opts.showarom;
};

LicoriceMode.prototype.drawMultiorderBonds = function() {
  return this.opts.multibond;
};

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
LicoriceMode.prototype.getLabelOpts = function() {
  return {
    fg: 'none',
    bg: '0x202020',
    showBg: false,
    labels: this.settings.now.labels,
    colors: true,
    adjustColor: true,
    transparent: true,
  };
};

export default LicoriceMode;

