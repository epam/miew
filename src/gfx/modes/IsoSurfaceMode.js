

import utils from '../../utils';
import SurfaceMode from './SurfaceMode';

function IsoSurfaceMode(excludeProbe, opts) {
  SurfaceMode.call(this, opts);
  this._excludeProbe = excludeProbe;
}

utils.deriveClass(IsoSurfaceMode, SurfaceMode, {
  id: 'SU',
  name: 'Surface',
  shortName: 'Surface',
  surfaceNames: ['SASSESSurfaceGeo'],
});

IsoSurfaceMode.prototype._radScale = 1;
IsoSurfaceMode.prototype._isVertexNormalsRendered = false;
IsoSurfaceMode.prototype._isSurfaceTransparent = false;

// TODO: move to advanced visualization UI next 3 params
IsoSurfaceMode.prototype._clusterViaKMeans = 0; // 0: no cluster, 1: KMeans, 2: SimplestClusterization
IsoSurfaceMode.prototype._excludeProbe = false;

IsoSurfaceMode.prototype.calcAtomRadius = function(atom) {
  return atom.element.radius;
};

IsoSurfaceMode.prototype.getSurfaceOpts = function() {
  return {
    gridSpacing: this.opts.polyComplexity[this.settings.now.resolution],
    radScale: this._radScale,
    zClip: this.opts.zClip,
    visibilitySelector: this.getVisibilitySelector(),
    probeRadius: this.opts.probeRadius,
    excludeProbe: this._excludeProbe,
    clusterizationType: this._clusterViaKMeans,
  };
};

export default IsoSurfaceMode;

