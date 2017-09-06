

import utils from '../../utils';
import IsoSurfaceMode from './IsoSurfaceMode';

function IsoSurfaceSESMode(opts) {
  IsoSurfaceMode.call(this, true, opts);
}

utils.deriveClass(IsoSurfaceSESMode, IsoSurfaceMode, {
  id: 'SE',
  name: 'Solvent Excluded Surface',
  shortName: 'SES',
});

export default IsoSurfaceSESMode;

