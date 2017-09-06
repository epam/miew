

import chem from '../../chem';
import utils from '../../utils';
import Mode from './Mode';

var selectors = chem.selectors;

function getRenderParams() {
  return {
    wireframe: this.opts.wireframe,
    zClip: this.opts.zClip,
  };
}

function SurfaceMode(opts) {
  Mode.call(this, opts);
  this.depGroups = this.depGroups.slice(0); // clone depGroups to prevent prototype edits
  var surfaces = this.surfaceNames;
  var groups = this.depGroups;
  for (var i = 0, n = surfaces.length; i < n; ++i) {
    groups[groups.length] = [surfaces[i], getRenderParams];
  }
}

utils.deriveClass(SurfaceMode, Mode, {
  isSurface: true,
  surfaceNames: [],
});

SurfaceMode.prototype.calcAtomRadius = function(atom) {
  return atom.element.radius;
};

SurfaceMode.prototype.getVisibilitySelector = function() {
  var visibilitySelector = null;
  if (this.opts.subset !== '') {
    var res = selectors.parse(this.opts.subset);
    if (!res.error) {
      visibilitySelector = res.selector;
    }
  }
  return visibilitySelector;
};

export default SurfaceMode;

