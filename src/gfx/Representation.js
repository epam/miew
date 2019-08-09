import * as THREE from 'three';
import materials from './materials';
import UberMaterial from './shaders/UberMaterial';
import gfxutils from './gfxutils';
import settings from '../settings';

class Representation {
  constructor(index, mode, colorer, selector) {
    const startMaterialValues = {
      clipPlane: settings.now.draft.clipPlane,
      fogTransparent: settings.now.bg.transparent,
      shadowmap: settings.now.shadow.on,
      shadowmapType: settings.now.shadow.type,
    };
    this.index = index;
    this.mode = mode;
    this.colorer = colorer;
    this.selector = selector;
    this.selectorString = '';
    this.count = 0;
    this.material = new UberMaterial();
    this.material.setValues(startMaterialValues);
    this.material.setUberOptions({ fogAlpha: settings.now.fogAlpha });
    this.materialPreset = materials.first;
    this.needsRebuild = true;
    this.visible = true;

    // apply mode params & preset
    this.setMode(mode);
  }


  markAtoms(complex) {
    this.count = complex.markAtoms(this.selector, 1 << this.index);
    this.needsRebuild = true;
    return this.count;
  }

  unmarkAtoms(complex) {
    complex.clearAtomBits(1 << this.index);
    this.count = 0;
  }

  setMode(mode) {
    this.mode = mode;
  }

  setMaterialPreset(preset) {
    this.materialPreset = preset;
    this.material.setUberOptions(preset.uberOptions);
    this.material.setValues(preset.values);
  }

  reset() {
    this.geo = null;
    this.selectionGeo = null;
  }

  buildGeometry(complex) {
    this.reset();
    this.needsRebuild = false;

    if (settings.now.ao) {
      this.material.setValues({ normalsToGBuffer: settings.now.ao, doubleSidedGBuffer: settings.now.ao });
    }

    this.geo = this.mode.buildGeometry(complex, this.colorer, 1 << this.index, this.material);

    if (this.material.uberOptions.opacity < 0.99 && settings.now.transparency === 'prepass') {
      gfxutils.processTransparentMaterial(this.geo, this.material);
    }
    this.geo.visible = this.visible;

    if (settings.now.shadow.on) {
      gfxutils.processMaterialForShadow(this.geo, this.material);
    }

    gfxutils.processObjRenderOrder(this.geo, this.materialPreset.id);
    gfxutils.processColFromPosMaterial(this.geo, this.material);

    return this.geo;
  }

  buildSelectionGeometry(mask) {
    let sg = null;

    if (this.geo && ('getSubset' in this.geo)) {
      const meshes = this.geo.getSubset(mask);
      if (meshes && meshes.length > 0) {
        sg = new THREE.Group();
        sg.matrixAutoUpdate = false;
        sg.matrix = this.geo.matrix;

        for (let j = 0; j < meshes.length; j++) {
          const m = meshes[j];
          sg.add(m);
        }
      }
    }

    if (sg) {
      sg.visible = this.visible;
    }

    this.selectionGeo = sg;
    return this.selectionGeo;
  }

  /**
 * Create object that represents difference between current and another rep
 * anotherRep could be undefined. In this case everything is reported.
 */
  compare(repSettings) {
    const diff = {};

    const selStr = String(this.selector);
    if (!repSettings || selStr.valueOf() !== String(repSettings.selector).valueOf()) {
      diff.selector = selStr;
    }

    const modeDiff = this.mode.identify();
    if (!repSettings || Array.isArray(modeDiff) || modeDiff !== repSettings.mode) {
      diff.mode = modeDiff;
    }

    const colorerDiff = this.colorer.identify();
    if (!repSettings || Array.isArray(colorerDiff) || colorerDiff !== repSettings.colorer) {
      diff.colorer = colorerDiff;
    }

    if (!repSettings || this.materialPreset.id !== repSettings.material) {
      diff.material = this.materialPreset.id;
    }

    return diff;
  }

  show(visible) {
    this.visible = visible;
    if (this.geo) {
      this.geo.visible = visible;
    }
    if (this.selectionGeo) {
      this.selectionGeo.visible = visible;
    }
  }
}

export default Representation;
