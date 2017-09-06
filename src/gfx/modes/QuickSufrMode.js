

import utils from '../../utils';
import SurfaceMode from './SurfaceMode';

function QuickSurfMode(opts) {
  SurfaceMode.call(this, opts);
}

utils.deriveClass(QuickSurfMode, SurfaceMode, {
  id: 'QS',
  name: 'Quick Surface',
  shortName: 'Quick Surf',
  surfaceNames: ['QuickSurfGeo'],
});

QuickSurfMode.prototype.getSurfaceOpts = function() {
  return {
    useBeads: false,
    isoValue: this.opts.isoValue,
    gaussLim: this.opts.gaussLim[this.settings.now.resolution],
    radScale: this.opts.scale,
    gridSpacing: this.opts.gridSpacing[this.settings.now.resolution],
    zClip: this.opts.zClip,
    visibilitySelector: this.getVisibilitySelector(),
  };
};

export default QuickSurfMode;

