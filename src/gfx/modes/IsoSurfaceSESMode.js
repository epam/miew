

import IsoSurfaceMode from './IsoSurfaceMode';

class IsoSurfaceSESMode extends IsoSurfaceMode {
  constructor(opts) {
    super(true, opts);
  }
}

IsoSurfaceSESMode.id = 'SE';
IsoSurfaceSESMode.prototype.id = 'SE';
IsoSurfaceSESMode.prototype.name = 'Solvent Excluded Surface';
IsoSurfaceSESMode.prototype.shortName = 'SES';

export default IsoSurfaceSESMode;

