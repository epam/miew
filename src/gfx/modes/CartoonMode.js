

import * as THREE from 'three';
import Mode from './Mode';

class CartoonMode extends Mode {
  constructor(opts) {
    super(opts);
    // cache for secondary structure options
    this.secCache = {};
  }

  getResidueStartRadius(residue) {
    var second = residue.getSecondary();
    if (!second || !second.generic) {
      return this.TUBE_RADIUS;
    }
    var secOpts = this.secCache[second.generic];
    if (!secOpts) {
      return this.TUBE_RADIUS;
    }
    if (second.term === residue) {
      return secOpts.start;
    }
    return secOpts.center;
  }

  getResidueEndRadius(residue) {
    var second = residue.getSecondary();
    if (second === null || !second.generic) {
      return this.TUBE_RADIUS;
    }
    var secOpts = this.secCache[second.generic];
    if (!secOpts) {
      return this.TUBE_RADIUS;
    }
    if (second.term === residue) {
      return this.ARROW_END;
    }
    return secOpts.center;
  }

  getResidueRadius(residue, val) {
    var startRad = this.getResidueStartRadius(residue);
    if (val === 0) {
      return startRad;
    }

    var endRad = this.getResidueEndRadius(residue);
    if (val === 2) {
      return endRad;
    }

    return startRad.clone().lerp(endRad, val / 2.0);
  }

  // TODO: remove when selection is rendered with actual geometry

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
    var tubeRad = this.opts.radius;
    var secHeight = this.opts.depth;

    this.TUBE_RADIUS = new THREE.Vector2(tubeRad, tubeRad);
    this.ARROW_END = new THREE.Vector2(secHeight, tubeRad);
    var secCache = {};
    var secData = this.opts.ss;
    /* eslint-disable guard-for-in */
    for (var prop in secData) {
      secCache[prop] = {
        center: new THREE.Vector2(secHeight, secData[prop].width),
        start: new THREE.Vector2(secHeight, secData[prop].arrow)
      };
    }
    this.secCache = secCache;
    /* eslint-enable guard-for-in */

    return Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
  }
}

CartoonMode.id = 'CA';
CartoonMode.prototype.id = 'CA';
CartoonMode.prototype.name = 'Cartoon';
CartoonMode.prototype.shortName = 'Cartoon';
CartoonMode.prototype.depGroups = [
  'CartoonChains',
  'NucleicSpheres',
  'NucleicCylinders',
];

export default CartoonMode;

