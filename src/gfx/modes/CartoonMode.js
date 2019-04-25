import * as THREE from 'three';
import Mode from './Mode';

class CartoonMode extends Mode {
  static id = 'CA';

  constructor(opts) {
    super(opts);
    // cache for secondary structure options
    this.secCache = {};
  }

  getResidueStartRadius(residue) {
    const second = residue.getSecondary();
    if (!second || !second.generic) {
      return this.TUBE_RADIUS;
    }
    const secOpts = this.secCache[second.generic];
    if (!secOpts) {
      return this.TUBE_RADIUS;
    }
    if (second.term === residue) {
      return secOpts.start;
    }
    return secOpts.center;
  }

  getResidueEndRadius(residue) {
    const second = residue.getSecondary();
    if (second === null || !second.generic) {
      return this.TUBE_RADIUS;
    }
    const secOpts = this.secCache[second.generic];
    if (!secOpts) {
      return this.TUBE_RADIUS;
    }
    if (second.term === residue) {
      return this.ARROW_END;
    }
    return secOpts.center;
  }

  getResidueRadius(residue, val) {
    const startRad = this.getResidueStartRadius(residue);
    if (val === 0) {
      return startRad;
    }

    const endRad = this.getResidueEndRadius(residue);
    if (val === 2) {
      return endRad;
    }

    return startRad.clone().lerp(endRad, val / 2.0);
  }

  calcStickRadius(_res) {
    return this.opts.radius;
  }

  getHeightSegmentsRatio() {
    return this.opts.heightSegmentsRatio;
  }

  getTension() {
    return this.opts.tension;
  }

  buildGeometry(complex, colorer, mask, material) {
    const tubeRad = this.opts.radius;
    const secHeight = this.opts.depth;

    this.TUBE_RADIUS = new THREE.Vector2(tubeRad, tubeRad);
    this.ARROW_END = new THREE.Vector2(secHeight, tubeRad);
    const secCache = {};
    const secData = this.opts.ss;
    /* eslint-disable guard-for-in */
    for (const prop in secData) {
      secCache[prop] = {
        center: new THREE.Vector2(secHeight, secData[prop].width),
        start: new THREE.Vector2(secHeight, secData[prop].arrow),
      };
    }
    this.secCache = secCache;
    /* eslint-enable guard-for-in */

    return Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
  }
}

CartoonMode.prototype.id = 'CA';
CartoonMode.prototype.name = 'Cartoon';
CartoonMode.prototype.shortName = 'Cartoon';
CartoonMode.prototype.depGroups = [
  'CartoonChains',
  'NucleicSpheres',
  'NucleicCylinders',
];

export default CartoonMode;
