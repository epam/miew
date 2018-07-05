

import IsoSurfaceMode from './IsoSurfaceMode';

class IsoSurfaceSASMode extends IsoSurfaceMode {
  constructor(opts) {
    super(false, opts);
  }
}

IsoSurfaceSASMode.id = 'SA';
IsoSurfaceSASMode.prototype.id = 'SA';
IsoSurfaceSASMode.prototype.name = 'Solvent Accessible Surface';
IsoSurfaceSASMode.prototype.shortName = 'SAS';

export default IsoSurfaceSASMode;

