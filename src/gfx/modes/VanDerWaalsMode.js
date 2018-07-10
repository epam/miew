import Mode from './Mode';

class VanDerWaalsMode extends Mode {
  static id = 'VW';

  constructor(opts) {
    super(opts);
  }

  calcAtomRadius(atom) {
    return atom.element.radius;
  }
}

VanDerWaalsMode.prototype.id = 'VW';
VanDerWaalsMode.prototype.name = 'Van der Waals';
VanDerWaalsMode.prototype.shortName = 'VDW';
VanDerWaalsMode.prototype.depGroups = ['AtomsSpheres'];

export default VanDerWaalsMode;
