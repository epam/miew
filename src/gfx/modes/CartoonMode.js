

import * as THREE from 'three';
import utils from '../../utils';
import Mode from './Mode';

function CartoonMode(opts) {
  Mode.call(this, opts);
  // cache for secondary structure options
  this.secCache = {};
}

utils.deriveClass(CartoonMode, Mode, {
  id: 'CA',
  name: 'Cartoon',
  shortName: 'Cartoon',
  depGroups: [
    'CartoonChains',
    'NucleicSpheres',
    'NucleicCylinders',
  ],
});

CartoonMode.prototype.getResidueStartRadius = function(residue) {
  var second = residue.getSecondary();
  if (!second || !second.type) {
    return this.TUBE_RADIUS;
  }
  var secOpts = this.secCache[second.type];
  if (!secOpts) {
    return this.TUBE_RADIUS;
  }
  if (second._end === residue) {
    return secOpts.start;
  }
  return secOpts.center;
};

CartoonMode.prototype.getResidueEndRadius = function(residue) {
  var second = residue.getSecondary();
  if (second === null || !second.type) {
    return this.TUBE_RADIUS;
  }
  var secOpts = this.secCache[second.type];
  if (!secOpts) {
    return this.TUBE_RADIUS;
  }
  if (second._end === residue) {
    return this.ARROW_END;
  }
  return secOpts.center;
};

CartoonMode.prototype.getResidueRadius = function(residue, val) {
  var startRad = this.getResidueStartRadius(residue);
  if (val === 0) {
    return startRad;
  }

  var endRad = this.getResidueEndRadius(residue);
  if (val === 2) {
    return endRad;
  }

  return startRad.clone().lerp(endRad, val / 2.0);
};

// TODO: remove when selection is rendered with actual geometry
CartoonMode.prototype.calcStickRadius = function(_res) {
  return this.opts.radius;
};

CartoonMode.prototype.getHeightSegmentsRatio = function() {
  return this.opts.heightSegmentsRatio;
};

CartoonMode.prototype.getTension = function() {
  return this.opts.tension;
};

CartoonMode.prototype.buildGeometry = function(complex, colorer, mask, material) {
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
      start:  new THREE.Vector2(secHeight, secData[prop].arrow)
    };
  }
  this.secCache = secCache;
  /* eslint-enable guard-for-in */

  return Mode.prototype.buildGeometry.call(this, complex, colorer, mask, material);
};

export default CartoonMode;

