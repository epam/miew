

import utils from '../../utils';
import SurfaceMode from './SurfaceMode';

function ContactSurfMode(opts) {
  SurfaceMode.call(this, opts);
}

utils.deriveClass(ContactSurfMode, SurfaceMode, {
  id: 'CS',
  name: 'Contact Surface',
  shortName: 'Contact Surf',
  isSurface: true,
  surfaceNames: ['ContactSurfaceGeo'],
});

ContactSurfMode.prototype.getSurfaceOpts = function() {
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

export default ContactSurfMode;

