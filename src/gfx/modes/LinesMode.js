

import utils from '../../utils';
import LabeledMode from './LabeledMode';

function getRenderParams() {
  return {
    lineWidth: this.opts.lineWidth,
  };
}

function LinesMode(opts) {
  LabeledMode.call(this, opts);
  var groups = this.depGroups;
  for (var i = 0, n = groups.length; i < n; ++i) {
    groups[i] = [groups[i], getRenderParams];
  }
}

utils.deriveClass(LinesMode, LabeledMode, {
  id: 'LN',
  name: 'Lines',
  shortName: 'Lines',
  depGroups: [
    'ALoopsLines',
    'BondsLines',
    'OrphanedAtomsCrosses',
  ],
});

LinesMode.prototype.drawMultiorderBonds = function() {
  return this.opts.multibond;
};

LinesMode.prototype.calcAtomRadius = function() {
  return this.opts.atom;
};

LinesMode.prototype.getAromaticOffset = function() {
  return this.opts.offsarom;
};

LinesMode.prototype.getAromaticArcChunks = function() {
  return this.opts.chunkarom;
};

LinesMode.prototype.showAromaticLoops = function() {
  return this.opts.showarom;
};

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
LinesMode.prototype.getLabelOpts = function() {
  return {
    fg: 'none',
    bg: '0x202020',
    showBg: true,
    labels: this.settings.now.labels,
    colors: true,
    adjustColor: true,
    transparent: true,
  };
};

export default LinesMode;

