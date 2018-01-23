

import _ from 'lodash';
import * as THREE from 'three';
import utils from './utils';
import logger from './utils/logger';
import chem from './chem';
import settings from './settings';
import gfxutils from './gfx/gfxutils';
import modes from './gfx/modes';
import colorers from './gfx/colorers';
import palettes from './gfx/palettes';
import materials from './gfx/materials';
import Representation from './gfx/Representation';
import Visual from './Visual';
import ComplexVisualEdit from './ComplexVisualEdit';

var selectors = chem.selectors;

function ComplexVisual(name, dataSource) {
  Visual.call(this, name, dataSource);

  this._complex = dataSource;

  /** @type {Representation[]} */
  this._reprList = [];
  /** @type {?Representation} */
  this._repr = null;
  this._reprListChanged = true;

  this._selectionBit = 0;
  this._reprUsedBits = 0;
  this._selectionCount = 0;

  this._selectionGeometry = new THREE.Group();

}

// 32 bits = 30 bits for reps + 1 for selection + 1 for selection expansion
ComplexVisual.NUM_REPRESENTATION_BITS = 30;

utils.deriveClass(ComplexVisual, Visual);

ComplexVisual.prototype.getBoundaries = function() {
  return this._complex.getBoundaries();
};

ComplexVisual.prototype.release = function() {
  if (this._selectionGeometry.parent) {
    this._selectionGeometry.remove(this._selectionGeometry);
  }

  Visual.prototype.release.call(this);
};

ComplexVisual.prototype.getComplex = function() {
  return this._complex;
};

ComplexVisual.prototype.getSelectionCount = function() {
  return this._selectionCount;
};

ComplexVisual.prototype.getSelectionGeo = function() {
  return this._selectionGeometry;
};

ComplexVisual.prototype.getSelectionBit = function() {
  return this._selectionBit;
};

ComplexVisual.prototype.getEditor = function() {
  return this._editor;
};

ComplexVisual.prototype.resetReps = function(reps) {
  // Create all necessary representations
  if (this._complex) {
    this._complex.resetAtomMask(0);
  }
  this._reprListChanged = true;
  this._reprUsedBits = 0;
  this._reprList.length = reps.length;
  for (var i = 0, n = reps.length; i < n; ++i) {
    var rep = reps[i];

    var selector, selectorString;
    if (typeof rep.selector === 'string') {
      selectorString = rep.selector;
      selector = selectors.parse(selectorString).selector;
    } else if (typeof rep.selector === 'undefined') {
      selectorString = settings.now.presets.default[0].selector;
      selector = selectors.parse(selectorString).selector;
    } else {
      selector = rep.selector;
      selectorString = selector.toString();
    }
    var mode = modes.create(rep.mode);
    var colorer = colorers.create(rep.colorer);
    var material = materials.get(rep.material) || materials.any;

    this._reprList[i] = new Representation(i, mode, colorer, selector);
    this._reprList[i].setMaterialPreset(material);
    this._reprList[i].selectorString = selectorString; // FIXME: get rid of a separate selectorString

    if (this._complex) {
      this._complex.markAtoms(selector, 1 << i);
    }

    this._reprUsedBits |= 1 << i;
  }
  this._repr = reps.length > 0 ? this._reprList[0] : null;

  this._selectionBit = reps.length;
  this._reprUsedBits |= 1 << this._selectionBit; // selection uses one bit
  this._selectionCount = 0;

  if (this._complex) {
    this._complex.update();
  }
};

/**
 * Get number of representations created so far.
 * @returns {number} Number of reps.
 */
ComplexVisual.prototype.repCount = function() {
  return this._reprList.length;
};

/**
 * Get or set the current representation index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
 * @returns {number} The current index.
 */
ComplexVisual.prototype.repCurrent = function(index) {
  if (index >= 0 && index < this._reprList.length) {
    this._repr = this._reprList[index];
  } else {
    index = this._reprList.indexOf(this._repr);
  }
  return index;
};

/**
 * Get or set representation by index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
 * @param {object=} rep - Optional representation description.
 * @param {string=} rep.selector - Selector string.
 * @param {string=} rep.mode - Mode id.
 * @param {string=} rep.colorer - Colorer id.
 * @param {string=} rep.material - Material id.
 * @returns {?object} Representation description.
 */
ComplexVisual.prototype.rep = function(index, rep) {
  // if index is missing then it is the current
  if (!rep && (index === undefined || index instanceof Object)) {
    rep = index;
    index = this.repCurrent();
  }

  // fail if out of bounds
  if (index < 0 || index > this._reprList.length) {
    logger.error(`Rep ${index} does not exist!`);
    return null;
  }

  // a special case of adding just after the end
  if (index === this._reprList.length) {
    this.repAdd(rep);
    rep = undefined;
    logger.warn(`Rep ${index} does not exist! New representation was created.`);
  }

  // gather description
  const target = this._reprList[index];
  const desc = {
    selector: target.selectorString, // FIXME: Hope it equals String(target.selector)
    mode:     target.mode.identify(),
    colorer:  target.colorer.identify(),
    material: target.materialPreset.id,
  };

    // if modification is requested
  if (rep) {
    let changed = false;

    // modify selector
    if (rep.selector) {
      const newSelectorObject = selectors.parse(rep.selector).selector;
      const newSelector = String(newSelectorObject);
      if (desc.selector !== newSelector) {
        target.selectorString = desc.selector = newSelector;
        target.selector = newSelectorObject;
        target.markAtoms(this._complex);
        changed = true;
        logger.debug('rep[' + index + '].selector changed to' + newSelector);
      }
    }

    // modify mode
    if (rep.mode) {
      const newMode = rep.mode;
      if (!_.isEqual(desc.mode, newMode)) {
        desc.mode = newMode;
        target.setMode(modes.create(rep.mode));
        changed = true;
        logger.debug('rep[' + index + '].mode changed to ' + newMode);

        // safety hack: lower resolution for surface modes
        if (target.mode.isSurface &&
            (settings.now.resolution === 'ultra' || settings.now.resolution === 'high')) {
          logger.report('Surface resolution was changed to "medium" to avoid hang-ups.');
          settings.now.resolution = 'medium';
        }
      }
    }

    // modify colorer
    if (rep.colorer) {
      const newColorer = rep.colorer;
      if (!_.isEqual(desc.colorer, newColorer)) {
        desc.colorer = newColorer;
        target.colorer = colorers.create(rep.colorer);
        changed = true;
        logger.debug('rep[' + index + '].colorer changed to ' + newColorer);
      }
    }

    // modify material
    if (rep.material) {
      const newMaterial = rep.material;
      if (!_.isEqual(desc.material, newMaterial)) {
        desc.material = newMaterial;
        target.setMaterialPreset(materials.get(rep.material));
        changed = true;
        logger.debug('rep[' + index + '].material changed to' + newMaterial);
      }
    }

    // finalize
    if (changed) {
      target.needsRebuild = true;
    }
  }

  return desc;
};

/**
 * Get representation (not just description) by index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
 * @returns {?object} Representation.
 */
ComplexVisual.prototype.repGet = function(index) {
  // if index is missing then it is the current
  if (index === undefined || index instanceof Object) {
    index = this.repCurrent();
  }

  // fail if out of bounds
  if (index < 0 || index >= this._reprList.length) {
    return null;
  }

  return this._reprList[index];
};

ComplexVisual.prototype._getFreeReprIdx = function() {
  var bits = this._reprUsedBits;
  for (var i = 0; i <= ComplexVisual.NUM_REPRESENTATION_BITS; ++i, bits >>= 1) {
    if ((bits & 1) === 0) {
      return i;
    }
  }
  return -1;
};

/**
 * Add new representation.
 * @param {object=} rep - Representation description.
 * @returns {number} Index of the new representation.
 */
ComplexVisual.prototype.repAdd = function(rep) {
  if (this._reprList.length >= ComplexVisual.NUM_REPRESENTATION_BITS) {
    return -1;
  }

  var newSelectionBit = this._getFreeReprIdx();
  if (newSelectionBit < 0) {
    return -1; // no more slots for representations
  }

  var originalSelection = this.buildSelectorFromMask(1 << this._selectionBit);

  // Fill in default values
  var def = settings.now.presets.default[0];
  var desc = _.merge({
    selector: def.selector,
    mode:     def.mode,
    colorer:  def.colorer,
    material: def.material,
  }, rep);

  var selector = (typeof desc.selector === 'string') ? selectors.parse(desc.selector).selector : desc.selector;
  var target = new Representation(
    this._selectionBit,
    modes.create(desc.mode),
    colorers.create(desc.colorer),
    selector
  );
  target.selectorString = selector.toString();
  target.setMaterialPreset(materials.get(desc.material));
  target.markAtoms(this._complex);
  this._reprList.push(target);

  // change selection bit
  this._selectionBit = newSelectionBit;
  this._reprUsedBits |= 1 << this._selectionBit;

  // restore selection using new selection bit
  this._complex.markAtoms(originalSelection, 1 << this._selectionBit);

  return this._reprList.length - 1;
};

/**
 * Remove representation.
 * @param {number=} index - Zero-based representation index.
 */
ComplexVisual.prototype.repRemove = function(index) {
  if (index === undefined) {
    index = this.repCurrent();
  }

  // catch out of bounds case
  var count = this._reprList.length;
  if (index < 0 || index >= count || count <= 1) { // do not allow to remove the single rep
    return;
  }

  var target = this._reprList[index];
  target.unmarkAtoms(this._complex);
  this._reprUsedBits &= ~(1 << target.index);

  this._reprList.splice(index, 1);

  // update current rep
  if (target === this._repr) {
    --count;
    index = index < count ? index : count - 1;
    this._repr = this._reprList[index];
  }
  this._reprListChanged = true;
};

/**
 * Hide representation.
 * @param {number} index - Zero-based representation index.
 * @param {boolean=} hide - Specify false to make rep visible, true to hide (by default).
 */
ComplexVisual.prototype.repHide = function(index, hide) {
  if (hide === undefined) {
    hide = true;
  }

  // fail if out of bounds
  if (index < 0 || index >= this._reprList.length) {
    return;
  }

  var target = this._reprList[index];
  target.show(!hide);
};

/**
 * Select atoms with selector
 * @param {Selector} selector - selector
 * @param {boolean=} append - true to append selection atoms to current selection, false to rewrite selection
 */
ComplexVisual.prototype.select = function(selector, append) {
  if (append) {
    this._selectionCount += this._complex.markAtomsAdditionally(selector, 1 << this._selectionBit);
  } else {
    this._selectionCount = this._complex.markAtoms(selector, 1 << this._selectionBit);
  }
  this._complex.updateStructuresMask();
  this.rebuildSelectionGeometry();
};

ComplexVisual.prototype.resetSelectionMask = function() {
  if (this._selectionCount !== 0) {
    this._selectionCount = 0;
    if (this._complex) {
      this._complex.clearAtomBits(1 << this._selectionBit);
    }
  }
};

ComplexVisual.prototype.updateSelectionMask = function(pickedObj) {
  var self = this;
  var atom = pickedObj.atom;
  var residue = pickedObj.residue;
  var chain = pickedObj.chain;
  var molecule = pickedObj.molecule;
  var setMask = 1 << this._selectionBit;
  var clearMask = ~setMask;

  if (atom) {
    residue = atom._residue;
    chain = residue._chain;
    molecule = residue._molecule;

    if (atom._mask & setMask) {
      atom._mask &= clearMask;
      residue._mask &= clearMask;
      chain._mask &= clearMask;
      if (molecule) {
        molecule._mask &= clearMask;
      }
      this._selectionCount--;
    } else {
      atom._mask |= setMask;
      this._selectionCount++;

      // select residue if all atoms in it are selected
      residue.collectMask();
      // select chain and molecule if all residues in it are selected
      chain.collectMask();
      if (molecule) {
        molecule.collectMask();
      }
    }
  } else if (residue) {
    chain = residue._chain;
    molecule = residue._molecule;

    if (residue._mask & setMask) {
      residue._mask &= clearMask;
      chain._mask &= clearMask;
      residue.forEachAtom(function(a) {
        if (a._mask & setMask) {
          a._mask &= clearMask;
          self._selectionCount--;
        }
      });
    } else {
      residue._mask |= setMask;
      residue.forEachAtom(function(a) {
        if (!(a._mask & setMask)) {
          a._mask |= setMask;
          self._selectionCount++;
        }
      });

      // select chain and molecule if all residues in it are selected
      chain.collectMask();
      if (molecule) {
        molecule.collectMask();
      }
    }
  } else if (chain || molecule) {
    const obj = chain || molecule;
    if (obj._mask & setMask) {
      obj._mask &= clearMask;
      obj.forEachResidue(function(r) {
        if (r._mask & setMask) {
          r._mask &= clearMask;
          r.forEachAtom(function(a) {
            if (a._mask & setMask) {
              a._mask &= clearMask;
              self._selectionCount--;
            }
          });
          r._mask &= clearMask;
        }
      });
    } else {
      obj._mask |= setMask;
      obj.forEachResidue(function(r) {
        if (!(r._mask & setMask)) {
          r._mask |= setMask;
          r.forEachAtom(function(a) {
            if (!(a._mask & setMask)) {
              a._mask |= setMask;
              self._selectionCount++;
            }
          });
          const otherObj = chain ? r.getMolecule() : r.getChain();
          if (otherObj) {
            otherObj.collectMask();
          }
        }
      });
    }
  } else {
    this.resetSelectionMask();
  }
};

ComplexVisual.prototype.expandSelection = function() {
  var self = this;
  var selectionMask = 1 << this._selectionBit;
  var tmpMask = 1 << 31;

  // mark atoms to add
  this._complex.forEachBond(function(bond) {
    if (bond._left._mask & selectionMask) {
      if ((bond._right._mask & selectionMask) === 0) {
        bond._right._mask |= tmpMask;
      }
    } else if (bond._right._mask & selectionMask) {
      bond._left._mask |= tmpMask;
    }
  });

  // select marked atoms
  var deselectionMask = ~tmpMask;
  this._complex.forEachAtom(function(atom) {
    if (atom._mask & tmpMask) {
      atom._mask = (atom._mask & deselectionMask) | selectionMask;
      ++self._selectionCount;
    }
  });

  this._complex.updateStructuresMask();
};

ComplexVisual.prototype.shrinkSelection = function() {
  var self = this;
  var selectionMask = 1 << this._selectionBit;
  var tmpMask = 1 << 31;

  // mark atoms neighbouring to unselected ones
  this._complex.forEachBond(function(bond) {
    if (bond._left._mask & selectionMask) {
      if ((bond._right._mask & selectionMask) === 0) {
        bond._left._mask |= tmpMask;
      }
    } else if (bond._right._mask & selectionMask) {
      bond._right._mask |= tmpMask;
    }
  });

  // mark hanging atoms
  this._complex.forEachAtom(function(atom) {
    if ((atom._mask & selectionMask) && (atom._bonds.length === 1)) {
      atom._mask |= tmpMask;
    }
  });

  // deselect marked atoms
  var deselectionMask = ~(selectionMask | tmpMask);
  this._complex.forEachAtom(function(atom) {
    if (atom._mask & tmpMask) {
      atom._mask &= deselectionMask;
      --self._selectionCount;
    }
  });

  this._complex.updateStructuresMask();
};

ComplexVisual.prototype.getSelectedComponent = function() {

  var selectionMask = 1 << this._selectionBit;

  var component = null;
  var multiple = false;

  // find which component is selected (exclusively)
  this._complex.forEachAtom(function(atom) {
    if (atom._mask & selectionMask) {
      if (component === null) {
        component = atom._residue._component;
      } else if (component !== atom._residue._component) {
        multiple = true;
      }
    }
  });

  return multiple ? null : component;
};

ComplexVisual.prototype.needsRebuild = function() {
  if (this._reprListChanged) {
    return true;
  }
  var reprList = this._reprList;
  for (var i = 0, n = reprList.length; i < n; ++i) {
    var repr = reprList[i];
    if (repr.needsRebuild) {
      return true;
    }
  }
  return false;
};

/**
 * Rebuild molecule geometry asynchronously.
 */
ComplexVisual.prototype.rebuild = function() {
  var self = this;

  // Destroy current geometry
  gfxutils.clearTree(this);

  return new Promise(function(resolve, _reject) { // TODO: `reject` is not used
    // Nothing to do?
    var complex = self._complex;
    if (!complex) {
      resolve();
      return;
    }

    var errorOccured = false;
    setTimeout(function _rebuild() {
      console.time('build');
      var reprList = self._reprList;
      var palette = palettes.get(settings.now.palette) || palettes.any;
      var hasGeometry = false;
      for (var i = 0, n = reprList.length; i < n; ++i) {
        var repr = reprList[i];
        repr.colorer.palette = palette;

        if (repr.needsRebuild) {
          repr.reset();

          try {
            repr.buildGeometry(complex);
          } catch (e) {
            if (e instanceof utils.OutOfMemoryError) {
              repr.needsRebuild = false;
              repr.reset();
              logger.error('Not enough memory to build geometry for representation ' + (repr.index + 1));
              errorOccured = true;
            } else {
              throw e;
            }
          }

          if (DEBUG && !errorOccured) {
            logger.debug('Triangles count: ' + gfxutils.countTriangles(repr.geo));
          }
        }

        hasGeometry = errorOccured || hasGeometry || gfxutils.groupHasGeometryToRender(repr.geo);

        if (repr.geo) {
          self.add(repr.geo);
        }
      }

      self._reprListChanged = false;

      console.timeEnd('build');
      resolve();
    }, 10);
  });
};

ComplexVisual.prototype.setNeedsRebuild = function() {
  // invalidate all representations
  var reprList = this._reprList;
  for (var i = 0, n = reprList.length; i < n; ++i) {
    reprList[i].needsRebuild = true;
  }
};

ComplexVisual.prototype.rebuildSelectionGeometry = function() {
  var mask = 1 << this._selectionBit;

  gfxutils.clearTree(this._selectionGeometry);

  for (var i = 0, n = this._reprList.length; i < n; ++i) {
    var repr = this._reprList[i];
    var sg = repr.buildSelectionGeometry(mask);
    if (!sg) {
      continue;
    }

    this._selectionGeometry.add(sg);
    for (var j = 0; j < sg.children.length; j++) {
      var m = sg.children[j];

      // copy component transform (that's not applied yet)
      // TODO make this code obsolete, accessing editor is bad
      if (this._editor && this._editor._componentTransforms) {
        var t = this._editor._componentTransforms[m._component._index];
        if (t) {
          m.position.copy(t.position);
          m.quaternion.copy(t.quaternion);
        }
      }
    }

    gfxutils.applySelectionMaterial(sg);
  }
};

ComplexVisual.prototype._buildSelectorFromSortedLists = function(atoms, residues, chains) {
  var complex = this._complex;

  function optimizeList(list) {
    var result = [], k = 0;
    var first = NaN, last = NaN;
    for (var i = 0, n = list.length; i < n; ++i) {
      var value = list[i];
      if (value === last + 1) {
        last = value;
      } else {
        if (!Number.isNaN(first)) {
          result[k++] = new selectors.Range(first, last);
        }
        first = last = value;
      }
    }
    if (!Number.isNaN(first)) {
      result[k] = new selectors.Range(first, last);
    }
    return result;
  }

  var expression = null;
  if (chains.length === complex._chains.length) {
    expression = selectors.all();
  } else {
    var selector;
    if (chains.length > 0) {
      selector = selectors.chain(chains);
      expression = expression ? selectors.or(expression, selector) : selector;// NOSONAR
    }
    if (Object.keys(residues).length > 0) {
      for (var ch in residues) {
        if (residues.hasOwnProperty(ch)) {
          selector = selectors.and(
            selectors.chain(ch),
            selectors.residx(optimizeList(residues[ch]))
          );
          expression = expression ? selectors.or(expression, selector) : selector;
        }
      }
    }
    if (atoms.length > 0) {
      selector = selectors.serial(optimizeList(atoms));
      expression = expression ? selectors.or(expression, selector) : selector;
    }

    if (!expression) {
      expression = selectors.none();
    }
  }

  return expression;
};

ComplexVisual.prototype.buildSelectorFromMask = function(mask) {
  var complex = this._complex;
  var chains = [];
  var residues = {};
  var atoms = [];

  complex.forEachChain(function(chain) {
    if (chain._mask & mask) {
      chains.push(chain._name);
    }
  });

  complex.forEachResidue(function(residue) {
    if (residue._mask & mask && !(residue._chain._mask & mask)) {
      var c = residue._chain._name;
      if (!(c in residues)) {
        residues[c] = [residue._index];
      } else {
        residues[c].push(residue._index);
      }
    }
  });

  complex.forEachAtom(function(atom) {
    if (atom._mask & mask && !(atom._residue._mask & mask)) {
      atoms.push(atom._serial);
    }
  });

  return this._buildSelectorFromSortedLists(atoms, residues, chains);
};

ComplexVisual.prototype.getSelectedComponent = function() {

  var selectionMask = 1 << this._selectionBit;

  var component = null;
  var multiple = false;

  // find which component is selected (exclusively)
  this._complex.forEachAtom(function(atom) {
    if (atom._mask & selectionMask) {
      if (component === null) {
        component = atom._residue._component;
      } else if (component !== atom._residue._component) {
        multiple = true;
      }
    }
  });

  return multiple ? null : component;
};

ComplexVisual.prototype.beginComponentEdit = function() {
  if (this._editor) {
    return null;
  }

  var editor = new ComplexVisualEdit.ComponentEditor(this);
  if (!editor.begin()) {
    return null;
  }

  this._editor = editor;
  return editor;
};

ComplexVisual.prototype.beginFragmentEdit = function() {
  if (this._editor) {
    return null;
  }

  var editor = new ComplexVisualEdit.FragmentEditor(this);
  if (!editor.begin()) {
    return null;
  }

  this._editor = editor;
  return editor;
};

// should only be called by editors
ComplexVisual.prototype.finalizeEdit = function() {
  this._editor = null;
};

ComplexVisual.prototype.setMaterialValues = function(values) {
  for (var i = 0, n = this._reprList.length; i < n; ++i) {
    var rep = this._reprList[i];
    rep.material.setValues(values);
  }
};

ComplexVisual.prototype.setUberOptions = function(values) {
  for (var i = 0, n = this._reprList.length; i < n; ++i) {
    var rep = this._reprList[i];
    rep.material.setUberOptions(values);
  }
};

/**
 * Build selector that contains all atoms within given distance from group of atoms
 * @param {Selector} selector - selector describing source group of atoms
 * @param {number} radius - distance
 * @returns {Selector} selector describing result group of atoms
 */
ComplexVisual.prototype.within = function(selector, radius) {
  let vw = this._complex.getVoxelWorld();
  if (vw === null) {
    return false;
  }

  // mark atoms of the group as selected
  var selectionMask = 1 << this._selectionBit;
  this._complex.markAtoms(selector, selectionMask);

  // mark all atoms within distance as selected
  if (vw) {
    vw.forEachAtomWithinDistFromMasked(this._complex, selectionMask, Number(radius), function(atom) {
      atom._mask |= selectionMask;
    });
  }

  // update selection count
  this._selectionCount = this._complex.countAtomsByMask(selectionMask);

  // update secondary structure mask
  this._complex.updateStructuresMask();

  return this.buildSelectorFromMask(selectionMask);
};

export default ComplexVisual;

