import _ from 'lodash';
import * as THREE from 'three';
import UberMaterial from './shaders/UberMaterial';
import gfxutils from './gfxutils';
import settings from '../settings';
import modes from './modes';
import colorers from './colorers';
import materials from './materials';
import chem from '../chem';

const { selectors } = chem;

function lookupAndCreate(entityList, specs) {
  if (!Array.isArray(specs)) {
    specs = [specs];
  }
  const [id, opts] = specs;
  const Entity = entityList.get(id) || entityList.first;
  return new Entity(opts);
}

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
      this.material.setValues({ normalsToGBuffer: settings.now.ao });
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

  /**
   * Change representation. Write fields what was changed into new object, return it.
   */
  change(repSettings, complex) {
    const diff = {};

    // modify selector
    if (repSettings.selector) {
      const newSelectorObject = selectors.parse(repSettings.selector).selector;
      const newSelector = String(newSelectorObject);
      if (this.selectorString !== newSelector) {
        diff.selector = newSelector;
        this.selectorString = newSelector;
        this.selector = newSelectorObject;
        this.markAtoms(complex);
      }
    }

    // modify mode
    if (repSettings.mode) {
      const newMode = repSettings.mode;
      if (!_.isEqual(this.mode, newMode)) {
        diff.mode = newMode;
        this.setMode(lookupAndCreate(modes, repSettings.mode));
      }
    }

    // modify colorer
    if (repSettings.colorer) {
      const newColorer = repSettings.colorer;
      if (!_.isEqual(this.colorer, newColorer)) {
        diff.colorer = newColorer;
        this.colorer = lookupAndCreate(colorers, repSettings.colorer);
      }
    }

    // modify material
    if (repSettings.material) {
      const newMaterial = repSettings.material;
      if (!_.isEqual(this.material, newMaterial)) {
        diff.material = newMaterial;
        this.setMaterialPreset(materials.get(repSettings.material));
      }
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
