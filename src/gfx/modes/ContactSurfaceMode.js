import SurfaceMode from './SurfaceMode';

class ContactSurfaceMode extends SurfaceMode {
  static id = 'CS';

  getSurfaceOpts() {
    return {
      probeRadius: this.opts.probeRadius,
      radScale: this.opts.polyComplexity[this.settings.now.resolution],
      scaleFactor: this.opts.polyComplexity[this.settings.now.resolution],
      gridSpacing: 1.0 / this.opts.polyComplexity[this.settings.now.resolution],
      isoValue: this.opts.isoValue,
      probePositions: this.opts.probePositions,
      zClip: this.opts.zClip,
      visibilitySelector: this.getVisibilitySelector(),
    };
  }
}

ContactSurfaceMode.prototype.id = 'CS';
ContactSurfaceMode.prototype.name = 'Contact Surface';
ContactSurfaceMode.prototype.shortName = 'Contact Surf';
ContactSurfaceMode.prototype.isSurface = true;
ContactSurfaceMode.prototype.surfaceNames = ['ContactSurfaceGeo'];

export default ContactSurfaceMode;
