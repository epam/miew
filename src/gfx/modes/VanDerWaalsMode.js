

import utils from '../../utils';
import Mode from './Mode';

function VanDerWaalsMode(opts) {
  Mode.call(this, opts);
}

utils.deriveClass(VanDerWaalsMode, Mode, {
  id: 'VW',
  name: 'Van der Waals',
  shortName: 'VDW',
  depGroups: ['AtomsSpheres'],
});

VanDerWaalsMode.prototype.calcAtomRadius = function(atom) {
  return atom.element.radius;
};

export default VanDerWaalsMode;

