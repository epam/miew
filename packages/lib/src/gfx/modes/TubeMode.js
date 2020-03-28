import * as THREE from 'three';
import Mode from './Mode';

class TubeMode extends Mode {
  static id = 'TU';

  getResidueRadius(_residue) {
    return this.TUBE_RADIUS;
  }

  getHeightSegmentsRatio() {
    return this.opts.heightSegmentsRatio;
  }

  getTension() {
    return this.opts.tension;
  }

  buildGeometry(complex, colorer, mask, material) {
    const rad = this.opts.radius;
    this.TUBE_RADIUS = new THREE.Vector2(rad, rad);

    return Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
  }
}

TubeMode.prototype.id = 'TU';
TubeMode.prototype.name = 'Tube';
TubeMode.prototype.shortName = 'Tube';
TubeMode.prototype.depGroups = ['CartoonChains'];

export default TubeMode;
