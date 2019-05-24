import SurfaceMode from './SurfaceMode';

class IsoSurfaceMode extends SurfaceMode {
  constructor(excludeProbe, opts) {
    super(opts);
    this._excludeProbe = excludeProbe;
  }

  calcAtomRadius(atom) {
    return atom.element.radius;
  }

  getSurfaceOpts() {
    return {
      gridSpacing: this.opts.polyComplexity[this.settings.now.resolution],
      radScale: this._radScale,
      zClip: this.opts.zClip,
      visibilitySelector: this.getVisibilitySelector(),
      probeRadius: this.opts.probeRadius,
      excludeProbe: this._excludeProbe,
    };
  }
}

IsoSurfaceMode.prototype.id = 'SU';
IsoSurfaceMode.prototype.name = 'Surface';
IsoSurfaceMode.prototype.shortName = 'Surface';
IsoSurfaceMode.prototype.surfaceNames = ['SASSESSurfaceGeo'];

IsoSurfaceMode.prototype._radScale = 1;
IsoSurfaceMode.prototype._excludeProbe = false;

export default IsoSurfaceMode;
