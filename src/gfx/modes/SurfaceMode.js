

import chem from '../../chem';
import Mode from './Mode';

var selectors = chem.selectors;

function getRenderParams() {
  return {
    wireframe: this.opts.wireframe,
    zClip: this.opts.zClip,
  };
}

class SurfaceMode extends Mode {
  constructor(opts) {
    super(opts);
    this.depGroups = this.depGroups.slice(0); // clone depGroups to prevent prototype edits
    var surfaces = this.surfaceNames;
    var groups = this.depGroups;
    for (var i = 0, n = surfaces.length; i < n; ++i) {
      groups[groups.length] = [surfaces[i], getRenderParams];
    }
  }

  calcAtomRadius(atom) {
    return atom.element.radius;
  }

  getVisibilitySelector() {
    var visibilitySelector = null;
    if (this.opts.subset !== '') {
      var res = selectors.parse(this.opts.subset);
      if (!res.error) {
        visibilitySelector = res.selector;
      }
    }
    return visibilitySelector;
  }
}

SurfaceMode.prototype.isSurface = true;
SurfaceMode.prototype.surfaceNames = [];

export default SurfaceMode;

