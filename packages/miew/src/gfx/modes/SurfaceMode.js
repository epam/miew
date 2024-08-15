import chem from '../../chem';
import Mode from './Mode';

const { selectors } = chem;

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
    const surfaces = this.surfaceNames;
    const groups = this.depGroups;
    for (let i = 0, n = surfaces.length; i < n; ++i) {
      groups[groups.length] = [surfaces[i], getRenderParams];
    }
  }

  calcAtomRadius(atom) {
    return atom.element.radius;
  }

  getVisibilitySelector() {
    let visibilitySelector = null;
    if (this.opts.subset !== '') {
      const res = selectors.parse(this.opts.subset);
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
