/* eslint-disable no-magic-numbers */
import Mode from './Mode';

class BallsAndSticksMode extends Mode {
  static id = 'BS';

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
