

/* eslint-disable no-magic-numbers */
import utils from '../../utils';
import LabeledMode from './LabeledMode';

function BallsAndSticksMode(opts) {
  LabeledMode.call(this, opts);
}

utils.deriveClass(BallsAndSticksMode, LabeledMode, {
  id: 'BS',
  name: 'Balls and Sticks',
  shortName: 'Balls',
  depGroups: [
    'AtomsSpheres',
    'BondsCylinders',
    'ALoopsTorus',
  ],
});

BallsAndSticksMode.prototype.calcAtomRadius = function(atom) {
  return atom.element.radius * this.opts.atom;
};

BallsAndSticksMode.prototype.calcStickRadius = function() {
  return this.opts.bond;
};

BallsAndSticksMode.prototype.getAromRadius = function() {
  return this.opts.aromrad;
};

BallsAndSticksMode.prototype.showAromaticLoops = function() {
  return this.opts.showarom;
};

BallsAndSticksMode.prototype.calcSpaceFraction = function() {
  return this.opts.space;
};

BallsAndSticksMode.prototype.drawMultiorderBonds = function() {
  return this.opts.multibond;
};

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
BallsAndSticksMode.prototype.getLabelOpts = function() {
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

export default BallsAndSticksMode;

