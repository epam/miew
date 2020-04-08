import IsoSurfaceMode from './IsoSurfaceMode';

class IsoSurfaceSESMode extends IsoSurfaceMode {
  static id = 'SE';

  constructor(opts) {
    super(true, opts);
  }
}

IsoSurfaceSESMode.prototype.id = 'SE';
IsoSurfaceSESMode.prototype.name = 'Solvent Excluded Surface';
IsoSurfaceSESMode.prototype.shortName = 'SES';

export default IsoSurfaceSESMode;
