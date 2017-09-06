

import utils from '../../utils';
import IsoSurfaceMode from './IsoSurfaceMode';

function IsoSurfaceSASMode(opts) {
  IsoSurfaceMode.call(this, false, opts);
}

utils.deriveClass(IsoSurfaceSASMode, IsoSurfaceMode, {
  id: 'SA',
  name: 'Solvent Accessible Surface',
  shortName: 'SAS',
});

export default IsoSurfaceSASMode;

