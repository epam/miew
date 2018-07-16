/* eslint-disable no-magic-numbers */
import LabeledMode from './LabeledMode';
class LicoriceMode extends LabeledMode {
  static id = 'LC';

  constructor(opts) {
    super(opts);
  }

  calcAtomRadius(_atom) {
    return this.opts.bond;
  }

  calcStickRadius() {
    return this.opts.bond;
  }

  calcSpaceFraction() {
    return this.opts.space;
  }

  getAromRadius() {
    return this.opts.aromrad;
  }

  showAromaticLoops() {
    return this.opts.showarom;
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

LicoriceMode.prototype.id = 'LC';
LicoriceMode.prototype.name = 'Licorice';
LicoriceMode.prototype.shortName = 'Licorice';
LicoriceMode.prototype.depGroups = [
  'AtomsSpheres',
  'BondsCylinders',
  'ALoopsTorus',
];

export default LicoriceMode;
