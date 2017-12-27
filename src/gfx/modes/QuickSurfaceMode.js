

import utils from '../../utils';
import SurfaceMode from './SurfaceMode';

function QuickSurfaceMode(opts) {
  SurfaceMode.call(this, opts);
}

utils.deriveClass(QuickSurfaceMode, SurfaceMode, {
  id: 'QS',
  name: 'Quick Surface',
  shortName: 'Quick Surf',
  surfaceNames: ['QuickSurfGeo'],
});

QuickSurfaceMode.prototype.getSurfaceOpts = function() {
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

export default QuickSurfaceMode;

