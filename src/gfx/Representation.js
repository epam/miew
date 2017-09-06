

import * as THREE from 'three';
import materials from './materials';
import UberMaterial from './shaders/UberMaterial';
import gfxutils from './gfxutils';
import settings from '../settings';

function Representation(index, mode, colorer, selector) {
  this.index = index;
  this.mode = mode;
  this.colorer = colorer;
  this.selector = selector;
  this.selectorString = ''; // FIXME
  this.count = 0;
  this.material = new UberMaterial();
  this.material.setValues({clipPlane: settings.now.draft.clipPlane});
  this.materialPreset = materials.any;
  this.needsRebuild = true;
  this.visible = true;

  // apply mode params & preset
  this.setMode(mode);
}

Representation.prototype.markAtoms = function(complex) {
  this.count = complex.markAtoms(this.selector, 1 << this.index);
  this.needsRebuild = true;
  return this.count;
};

Representation.prototype.unmarkAtoms = function(complex) {
  complex.clearAtomBits(1 << this.index);
  this.count = 0;
};

Representation.prototype.setMode = function(mode) {
  this.mode = mode;
};

Representation.prototype.setMaterialPreset = function(preset) {
  this.materialPreset = preset;
  this.material.setUberOptions(preset.uberOptions);
};

Representation.prototype.reset = function() {
  this.geo = null;
  this.selectionGeo = null;
};

Representation.prototype.buildGeometry = function(complex) {
  // console.time('buildGeometry');
  this.reset();
  this.needsRebuild = false;
  this.geo = this.mode.buildGeometry(complex, this.colorer, 1 << this.index, this.material);

  if (this.material.uberOptions.opacity < 0.99 && settings.now.transparency === 'prepass') {
    gfxutils.processTransparentMaterial(this.geo, this.material);
  }
  // console.timeEnd('buildGeometry');
  this.geo.visible = this.visible;

  return this.geo;
};

Representation.prototype.buildSelectionGeometry = function(mask) {
  var sg = null;

  if (this.geo && ('getSubset' in this.geo)) {
    var meshes = this.geo.getSubset(mask);
    if (meshes && meshes.length > 0) {
      sg = new THREE.Group();
      sg.matrixAutoUpdate = false;
      sg.matrix = this.geo.matrix;

      for (var j = 0; j < meshes.length; j++) {
        var m = meshes[j];
        sg.add(m);
      }
    }
  }

  if (sg) {
    sg.visible = this.visible;
  }

  this.selectionGeo = sg;
  return this.selectionGeo;
};

/**
 * Create object that represents difference between current and another rep
 * anotherRep could be undefined. In this case everything is reported.
 */
Representation.prototype.compare = function(repSettings) {
  var diff = {};

  var selStr = String(this.selector);
  if (!repSettings || selStr.valueOf() !== String(repSettings.selector).valueOf()) {
    diff.selector = selStr;
  }

  var modeDiff = this.mode.identify();
  if (!repSettings || Array.isArray(modeDiff) || modeDiff !== repSettings.mode) {
    diff.mode = modeDiff;
  }

  var colorerDiff = this.colorer.identify();
  if (!repSettings || Array.isArray(colorerDiff) || colorerDiff !== repSettings.colorer) {
    diff.colorer = colorerDiff;
  }

  if (!repSettings || this.materialPreset.id !== repSettings.material) {
    diff.material = this.materialPreset.id;
  }

  return diff;
};

Representation.prototype.show = function(visible) {
  this.visible = visible;
  if (this.geo) {
    this.geo.visible = visible;
  }
  if (this.selectionGeo) {
    this.selectionGeo.visible = visible;
  }
};

export default Representation;

