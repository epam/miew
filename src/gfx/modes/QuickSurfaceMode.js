import SurfaceMode from './SurfaceMode';

class QuickSurfaceMode extends SurfaceMode {
  static id = 'QS';

  getSurfaceOpts() {
    return {
      useBeads: false,
      isoValue: this.opts.isoValue,
      gaussLim: this.opts.gaussLim[this.settings.now.resolution],
      radScale: this.opts.scale,
      gridSpacing: this.opts.gridSpacing[this.settings.now.resolution],
      zClip: this.opts.zClip,
      visibilitySelector: this.getVisibilitySelector(),
    };
  }
}

QuickSurfaceMode.prototype.id = 'QS';
QuickSurfaceMode.prototype.name = 'Quick Surface';
QuickSurfaceMode.prototype.shortName = 'Quick Surf';
QuickSurfaceMode.prototype.surfaceNames = ['QuickSurfGeo'];

export default QuickSurfaceMode;
