/* eslint-disable no-magic-numbers */
import LabeledMode from './LabeledMode';

class BallsAndSticksMode extends LabeledMode {
  static id = 'BS';

  constructor(opts) {
    super(opts);
  }

  calcAtomRadius(atom) {
    return atom.element.radius * this.opts.atom;
  }

  calcStickRadius() {
    return this.opts.bond;
  }

  getAromRadius() {
    return this.opts.aromrad;
  }

  showAromaticLoops() {
    return this.opts.showarom;
  }

  calcSpaceFraction() {
    return this.opts.space;
  }

  drawMultiorderBonds() {
    return this.opts.multibond;
  }

  /** @deprecated Old-fashioned atom labels, to be removed in the next major version. */

  getLabelOpts() {
    return {
      fg: 'none',
      bg: '0x202020',
      showBg: false,
      labels: this.settings.now.labels,
      colors: true,
      adjustColor: true,
      transparent: true,
    };
  }
}

BallsAndSticksMode.prototype.id = 'BS';
BallsAndSticksMode.prototype.name = 'Balls and Sticks';
BallsAndSticksMode.prototype.shortName = 'Balls';
BallsAndSticksMode.prototype.depGroups = [
  'AtomsSpheres',
  'BondsCylinders',
  'ALoopsTorus',
];

export default BallsAndSticksMode;
