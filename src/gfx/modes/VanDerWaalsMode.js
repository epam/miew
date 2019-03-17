import Mode from './Mode';

class VanDerWaalsMode extends Mode {
  static id = 'VW';

  calcAtomRadius(atom) {
    return atom.element.radius;
  }
}

VanDerWaalsMode.prototype.id = 'VW';
VanDerWaalsMode.prototype.name = 'Van der Waals';
VanDerWaalsMode.prototype.shortName = 'VDW';
VanDerWaalsMode.prototype.depGroups = ['AtomsSpheres'];

export default VanDerWaalsMode;
