import IsoSurfaceMode from './IsoSurfaceMode';

class IsoSurfaceSASMode extends IsoSurfaceMode {
  static id = 'SA';

  constructor(opts) {
    super(false, opts);
  }
}

IsoSurfaceSASMode.prototype.id = 'SA';
IsoSurfaceSASMode.prototype.name = 'Solvent Accessible Surface';
IsoSurfaceSASMode.prototype.shortName = 'SAS';

export default IsoSurfaceSASMode;
