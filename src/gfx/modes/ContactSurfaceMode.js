

import utils from '../../utils';
import SurfaceMode from './SurfaceMode';

function ContactSurfaceMode(opts) {
  SurfaceMode.call(this, opts);
}

utils.deriveClass(ContactSurfaceMode, SurfaceMode, {
  id: 'CS',
  name: 'Contact Surface',
  shortName: 'Contact Surf',
  isSurface: true,
  surfaceNames: ['ContactSurfaceGeo'],
});

ContactSurfaceMode.prototype.getSurfaceOpts = function() {
  return {
    probeRadius: this.opts.probeRadius,
    radScale: this.opts.polyComplexity[this.settings.now.resolution],
    scaleFactor: this.opts.polyComplexity[this.settings.now.resolution], // TODO rename all params
    gridSpacing: 1.0 / this.opts.polyComplexity[this.settings.now.resolution], // TODO rename all params
    isoValue: this.opts.isoValue,
    probePositions: this.opts.probePositions,
    zClip: this.opts.zClip,
    visibilitySelector: this.getVisibilitySelector(),
  };
};

export default ContactSurfaceMode;

