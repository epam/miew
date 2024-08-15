/* eslint-disable no-magic-numbers */
import Mode from './Mode';

class LicoriceMode extends Mode {
  static id = 'LC';

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
