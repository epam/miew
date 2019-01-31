/* eslint-disable no-magic-numbers */
import Mode from './Mode';

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
class LabeledMode extends Mode {
  constructor(opts) {
    super(opts);
    this.depGroups = this.depGroups.slice(0); // clone depGroups to prevent prototype edits
    this._staticGroups = this.depGroups.length;
  }

  update() {
    const statGroups = this._staticGroups;
    if (this.settings.now.labels === 'no') {
      this.depGroups = this.depGroups.slice(0, statGroups);
    } else {
      this.depGroups[statGroups] = 'TextLabelsGeo';
      this.depGroups[statGroups + 1] = 'SGroupsLabels';
    }
  }

  buildGeometry(complex, colorer, mask, material) {
    this.update();
    return Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
  }
}

export default LabeledMode;
