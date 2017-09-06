

import * as THREE from 'three';
import utils from '../../utils';
import Mode from './Mode';

function TubeMode(opts) {
  Mode.call(this, opts);
}

utils.deriveClass(TubeMode, Mode, {
  id: 'TU',
  name: 'Tube',
  shortName: 'Tube',
  depGroups: ['CartoonChains'],
});

TubeMode.prototype.getResidueRadius = function(_residue) {
  return this.TUBE_RADIUS;
};

TubeMode.prototype.getHeightSegmentsRatio = function() {
  return this.opts.heightSegmentsRatio;
};

TubeMode.prototype.getTension = function() {
  return this.opts.tension;
};

TubeMode.prototype.buildGeometry = function(complex, colorer, mask, material) {
  var rad = this.opts.radius;
  this.TUBE_RADIUS = new THREE.Vector2(rad, rad);

  return Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
};

export default TubeMode;

