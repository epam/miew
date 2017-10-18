

/* eslint-disable no-magic-numbers */
import Mode from './Mode';

/** @deprecated Old-fashioned atom labels, to be removed in the next major version. */
function LabeledMode(opts) {
  Mode.call(this, opts);
  this.depGroups = this.depGroups.slice(0); // clone depGroups to prevent prototype edits
  this._staticGroups = this.depGroups.length;
}

LabeledMode.prototype = Object.create(Mode.prototype);
LabeledMode.prototype.constructor = LabeledMode;

LabeledMode.prototype.update = function() {
  var statGroups = this._staticGroups;
  if (this.settings.now.labels === 'no') {
    this.depGroups = this.depGroups.slice(0, statGroups);
  } else {
    this.depGroups[statGroups] = 'TextLabelsGeo';
    this.depGroups[statGroups + 1] = 'SGroupsLabels';
  }
};

LabeledMode.prototype.buildGeometry = function(complex, colorer, mask, material) {
  this.update();
  return  Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
};

export default LabeledMode;

