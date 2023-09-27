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
import meshutils from './gfx/meshutils';

const { selectors } = chem;

function lookupAndCreate(entityList, specs) {
  if (!Array.isArray(specs)) {
    specs = [specs];
  }
  const [id, opts] = specs;
  const Entity = entityList.get(id) || entityList.first;
  return new Entity(opts);
}

class ComplexVisual extends Visual {
  constructor(name, dataSource) {
    super(name, dataSource);
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

  getBoundaries() {
    return this._complex.getBoundaries();
  }

  release() {
    if (this._selectionGeometry.parent) {
      this._selectionGeometry.remove(this._selectionGeometry);
    }
    Visual.prototype.release.call(this);
  }

  getComplex() {
    return this._complex;
  }

  getSelectionCount() {
    return this._selectionCount;
  }

  getSelectionGeo() {
    return this._selectionGeometry;
  }

  getSelectionBit() {
    return this._selectionBit;
  }

  getEditor() {
    return this._editor;
  }

  resetReps(reps) {
    // Create all necessary representations
    if (this._complex) {
      this._complex.clearAtomBits(~0);
    }
    this._reprListChanged = true;
    this._reprUsedBits = 0;
    this._reprList.length = reps.length;
    for (let i = 0, n = reps.length; i < n; ++i) {
      const rep = reps[i];

      let selector;
      let selectorString;
      if (typeof rep.selector === 'string') {
        selectorString = rep.selector;
        ({ selector } = selectors.parse(selectorString));
      } else if (typeof rep.selector === 'undefined') {
        selectorString = settings.now.presets.default[0].selector;
        ({ selector } = selectors.parse(selectorString));
      } else {
        ({ selector } = rep);
        selectorString = selector.toString();
      }
      const mode = lookupAndCreate(modes, rep.mode);
      const colorer = lookupAndCreate(colorers, rep.colorer);
      const material = materials.get(rep.material) || materials.first;

      this._reprList[i] = new Representation(i, mode, colorer, selector);
      this._reprList[i].setMaterialPreset(material);
      this._reprList[i].selectorString = selectorString;

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
  }

  /**
   * Get number of representations created so far.
   * @returns {number} Number of reps.
   */
  repCount() {
    return this._reprList.length;
  }

  /**
   * Get or set the current representation index.
   * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
   * @returns {number} The current index.
   */
  repCurrent(index) {
    if (index >= 0 && index < this._reprList.length) {
      this._repr = this._reprList[index];
    } else {
      index = this._reprList.indexOf(this._repr);
    }
    return index;
  }

  /**
   * Get or set representation by index.
   * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
   * @param {object=} rep - Optional representation description.
   * @param {string=} rep.selector - Selector string.
   * @param {string=} rep.mode - Mode id.
   * @param {string=} rep.colorer - Colorer id.
   * @param {string=} rep.material - Material id.
   * @returns {Object} {desc, index, status} field desc contains rep description, index - index of correspondent rep,
   * status - one of three strings: 'created', 'changed', ''. 'created' means new rep was created during this function,
   * 'changed' - rep was changed during this function. '' - something else.
   */
  rep(index, rep) {
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
      const res = this.repAdd(rep);
      logger.warn(`Rep ${index} does not exist! New representation was created.`);
      return { desc: res.desc, index, status: 'created' };
    }

    // gather description
    const target = this._reprList[index];
    const desc = {
      selector: target.selectorString,
      mode: target.mode.identify(),
      colorer: target.colorer.identify(),
      material: target.materialPreset.id,
    };

    // modification is requested
    if (rep) {
      // modify
      const diff = target.change(
        rep,
        this._complex,
        lookupAndCreate(modes, rep.mode),
        lookupAndCreate(colorers, rep.colorer),
      );

      // something was changed
      if (!_.isEmpty(diff)) {
        target.needsRebuild = true;
        for (const key in diff) {
          if (diff.hasOwnProperty(key)) {
            desc[key] = diff[key];
            logger.debug(`rep[${index}].${key} changed to ${diff[key]}`);
          }
        }

        // safety trick: lower resolution for surface modes
        if (diff.mode && target.mode.isSurface
          && (settings.now.resolution === 'ultra' || settings.now.resolution === 'high')) {
          logger.report('Surface resolution was changed to "medium" to avoid hang-ups.');
          settings.set('resolution', 'medium');
        }
        return { desc, index, status: 'changed' };
      }
    }
    return { desc, index, status: '' };
  }

  /**
   * Get representation (not just description) by index.
   * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
   * @returns {?object} Representation.
   */
  repGet(index) {
    // if index is missing then it is the current
    if (index === undefined || index instanceof Object) {
      index = this.repCurrent();
    }

    // fail if out of bounds
    if (index < 0 || index >= this._reprList.length) {
      return null;
    }

    return this._reprList[index];
  }

  _getFreeReprIdx() {
    let bits = this._reprUsedBits;
    for (let i = 0; i <= ComplexVisual.NUM_REPRESENTATION_BITS; ++i, bits >>= 1) {
      if ((bits & 1) === 0) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Add new representation.
   * @param {object=} rep - Representation description.
   * @returns {Object} {desc, index} field desc contains added rep description, index - index of this rep.
   */
  repAdd(rep) {
    if (this._reprList.length >= ComplexVisual.NUM_REPRESENTATION_BITS) {
      return null;
    }

    const newSelectionBit = this._getFreeReprIdx();
    if (newSelectionBit < 0) {
      return null; // no more slots for representations
    }

    const originalSelection = this.buildSelectorFromMask(1 << this._selectionBit);

    // Fill in default values
    const def = settings.now.presets.default[0];
    const desc = _.merge({
      selector: def.selector,
      mode: def.mode,
      colorer: def.colorer,
      material: def.material,
    }, rep);

    const selector = (typeof desc.selector === 'string') ? selectors.parse(desc.selector).selector : desc.selector;
    const target = new Representation(
      this._selectionBit,
      lookupAndCreate(modes, desc.mode),
      lookupAndCreate(colorers, desc.colorer),
      selector,
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

    return { desc, index: this._reprList.length - 1 };
  }

  /**
   * Remove representation.
   * @param {number=} index - Zero-based representation index.
   */
  repRemove(index) {
    if (index === undefined) {
      index = this.repCurrent();
    }

    // catch out of bounds case
    let count = this._reprList.length;
    if (index < 0 || index >= count || count <= 1) { // do not allow to remove the single rep
      return;
    }

    const target = this._reprList[index];
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
  }

  /**
   * Hide representation.
   * @param {number} index - Zero-based representation index.
   * @param {boolean=} hide - Specify false to make rep visible, true to hide (by default).
   */
  repHide(index, hide) {
    if (hide === undefined) {
      hide = true;
    }

    // fail if out of bounds
    if (index < 0 || index >= this._reprList.length) {
      return;
    }

    const target = this._reprList[index];
    target.show(!hide);
  }

  /**
   * Select atoms with selector
   * @param {Selector} selector - selector
   * @param {boolean=} append - true to append selection atoms to current selection, false to rewrite selection
   */
  select(selector, append) {
    if (append) {
      this._selectionCount += this._complex.markAtomsAdditionally(selector, 1 << this._selectionBit);
    } else {
      this._selectionCount = this._complex.markAtoms(selector, 1 << this._selectionBit);
    }
    this._complex.updateStructuresMask();
    this.rebuildSelectionGeometry();
  }

  resetSelectionMask() {
    if (this._selectionCount !== 0) {
      this._selectionCount = 0;
      if (this._complex) {
        this._complex.clearAtomBits(1 << this._selectionBit);
      }
    }
  }

  updateSelectionMask(pickedObj) {
    const self = this;
    const { atom } = pickedObj;
    let { residue, chain, molecule } = pickedObj;
    const setMask = 1 << this._selectionBit;
    const clearMask = ~setMask;

    if (atom) {
      residue = atom.residue;
      chain = residue._chain;
      molecule = residue._molecule;

      if (atom.mask & setMask) {
        atom.mask &= clearMask;
        residue._mask &= clearMask;
        chain._mask &= clearMask;
        if (molecule) {
          molecule.mask &= clearMask;
        }
        this._selectionCount--;
      } else {
        atom.mask |= setMask;
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
        residue.forEachAtom((a) => {
          if (a.mask & setMask) {
            a.mask &= clearMask;
            self._selectionCount--;
          }
        });
      } else {
        residue._mask |= setMask;
        residue.forEachAtom((a) => {
          if (!(a.mask & setMask)) {
            a.mask |= setMask;
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
        obj.forEachResidue((r) => {
          if (r._mask & setMask) {
            r._mask &= clearMask;
            r.forEachAtom((a) => {
              if (a.mask & setMask) {
                a.mask &= clearMask;
                self._selectionCount--;
              }
            });
            r._mask &= clearMask;
          }
        });
      } else {
        obj._mask |= setMask;
        obj.forEachResidue((r) => {
          if (!(r._mask & setMask)) {
            r._mask |= setMask;
            r.forEachAtom((a) => {
              if (!(a.mask & setMask)) {
                a.mask |= setMask;
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
  }

  expandSelection() {
    const self = this;
    const selectionMask = 1 << this._selectionBit;
    const tmpMask = 1 << 31;

    // mark atoms to add
    this._complex.forEachBond((bond) => {
      if (bond._left.mask & selectionMask) {
        if ((bond._right.mask & selectionMask) === 0) {
          bond._right.mask |= tmpMask;
        }
      } else if (bond._right.mask & selectionMask) {
        bond._left.mask |= tmpMask;
      }
    });

    // select marked atoms
    const deselectionMask = ~tmpMask;
    this._complex.forEachAtom((atom) => {
      if (atom.mask & tmpMask) {
        atom.mask = (atom.mask & deselectionMask) | selectionMask;
        ++self._selectionCount;
      }
    });

    this._complex.updateStructuresMask();
  }

  shrinkSelection() {
    const self = this;
    const selectionMask = 1 << this._selectionBit;
    const tmpMask = 1 << 31;

    // mark atoms neighbouring to unselected ones
    this._complex.forEachBond((bond) => {
      if (bond._left.mask & selectionMask) {
        if ((bond._right.mask & selectionMask) === 0) {
          bond._left.mask |= tmpMask;
        }
      } else if (bond._right.mask & selectionMask) {
        bond._right.mask |= tmpMask;
      }
    });

    // mark hanging atoms
    this._complex.forEachAtom((atom) => {
      if ((atom.mask & selectionMask) && (atom.bonds.length === 1)) {
        atom.mask |= tmpMask;
      }
    });

    // deselect marked atoms
    const deselectionMask = ~(selectionMask | tmpMask);
    this._complex.forEachAtom((atom) => {
      if (atom.mask & tmpMask) {
        atom.mask &= deselectionMask;
        --self._selectionCount;
      }
    });

    this._complex.updateStructuresMask();
  }

  getSelectedComponent() {
    const selectionMask = 1 << this._selectionBit;

    let component = null;
    let multiple = false;

    // find which component is selected (exclusively)
    this._complex.forEachAtom((atom) => {
      if (atom.mask & selectionMask) {
        if (component === null) {
          component = atom.residue._component;
        } else if (component !== atom.residue._component) {
          multiple = true;
        }
      }
    });

    return multiple ? null : component;
  }

  getSelectionCenter(center, includesAtom, selRule) {
    center.set(0.0, 0.0, 0.0);
    let count = 0;

    this._complex.forEachAtom((atom) => {
      if (includesAtom(atom, selRule)) {
        center.add(atom.position);
        count++;
      }
    });
    if (count === 0) {
      return false;
    }
    center.divideScalar(count);
    center.applyMatrix4(this.matrix);
    return true;
  }

  needsRebuild() {
    if (this._reprListChanged) {
      return true;
    }
    const reprList = this._reprList;
    for (let i = 0, n = reprList.length; i < n; ++i) {
      const repr = reprList[i];
      if (repr.needsRebuild) {
        return true;
      }
    }
    return false;
  }

  /**
   * Rebuild molecule geometry asynchronously.
   */
  rebuild() {
    const self = this;

    // Destroy current geometry
    gfxutils.clearTree(this);

    return new Promise(((resolve) => {
      // Nothing to do?
      const complex = self._complex;
      if (!complex) {
        resolve();
        return;
      }

      let errorOccured = false;
      setTimeout(() => {
        console.time('build');
        const reprList = self._reprList;
        const palette = palettes.get(settings.now.palette) || palettes.first;
        let hasGeometry = false;
        for (let i = 0, n = reprList.length; i < n; ++i) {
          const repr = reprList[i];
          repr.colorer.palette = palette;

          if (repr.needsRebuild) {
            repr.reset();

            try {
              repr.buildGeometry(complex);
            } catch (e) {
              if (e instanceof utils.OutOfMemoryError) {
                repr.needsRebuild = false;
                repr.reset();
                logger.error(`Not enough memory to build geometry for representation ${repr.index + 1}`);
                errorOccured = true;
              } else {
                throw e;
              }
            }

            if (DEBUG && !errorOccured) {
              logger.debug(`Triangles count: ${meshutils.countTriangles(repr.geo)}`);
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
    }));
  }

  setNeedsRebuild() {
    // invalidate all representations
    const reprList = this._reprList;
    for (let i = 0, n = reprList.length; i < n; ++i) {
      reprList[i].needsRebuild = true;
    }
  }

  rebuildSelectionGeometry() {
    const mask = 1 << this._selectionBit;

    gfxutils.clearTree(this._selectionGeometry);

    for (let i = 0, n = this._reprList.length; i < n; ++i) {
      const repr = this._reprList[i];
      const sg = repr.buildSelectionGeometry(mask);
      if (!sg) {
        continue;
      }

      this._selectionGeometry.add(sg);
      for (let j = 0; j < sg.children.length; j++) {
        const m = sg.children[j];

        // copy component transform (that's not applied yet)
        // TODO make this code obsolete, accessing editor is bad
        if (this._editor && this._editor._componentTransforms) {
          const t = this._editor._componentTransforms[m._component._index];
          if (t) {
            m.position.copy(t.position);
            m.quaternion.copy(t.quaternion);
          }
        }
      }

      gfxutils.applySelectionMaterial(sg);
    }
  }

  _buildSelectorFromSortedLists(atoms, residues, chains) {
    const complex = this._complex;

    function optimizeList(list) {
      const result = [];
      let k = 0;
      let first = NaN;
      let last = NaN;
      for (let i = 0, n = list.length; i < n; ++i) {
        const value = list[i];
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

    let expression = null;
    if (chains.length === complex._chains.length) {
      expression = selectors.all();
    } else {
      let selector;
      if (chains.length > 0) {
        selector = selectors.chain(chains);
        expression = expression ? selectors.or(expression, selector) : selector;// NOSONAR
      }
      if (Object.keys(residues).length > 0) {
        for (const ch in residues) {
          if (residues.hasOwnProperty(ch)) {
            selector = selectors.and(
              selectors.chain(ch),
              selectors.residx(optimizeList(residues[ch])),
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
  }

  buildSelectorFromMask(mask) {
    const complex = this._complex;
    const chains = [];
    const residues = {};
    const atoms = [];

    complex.forEachChain((chain) => {
      if (chain._mask & mask) {
        chains.push(chain._name);
      }
    });

    complex.forEachResidue((residue) => {
      if (residue._mask & mask && !(residue._chain._mask & mask)) {
        const c = residue._chain._name;
        if (!(c in residues)) {
          residues[c] = [residue._index];
        } else {
          residues[c].push(residue._index);
        }
      }
    });

    complex.forEachAtom((atom) => {
      if (atom.mask & mask && !(atom.residue._mask & mask)) {
        atoms.push(atom.serial);
      }
    });

    return this._buildSelectorFromSortedLists(atoms, residues, chains);
  }

  forSelectedResidues(process) {
    const selectionMask = 1 << this._selectionBit;
    this._complex.forEachResidue((residue) => {
      if (residue._mask & selectionMask) {
        process(residue);
      }
    });
  }

  beginComponentEdit() {
    if (this._editor) {
      return null;
    }

    const editor = new ComplexVisualEdit.ComponentEditor(this);
    if (!editor.begin()) {
      return null;
    }

    this._editor = editor;
    return editor;
  }

  beginFragmentEdit() {
    if (this._editor) {
      return null;
    }

    const editor = new ComplexVisualEdit.FragmentEditor(this);
    if (!editor.begin()) {
      return null;
    }

    this._editor = editor;
    return editor;
  }

  // should only be called by editors
  finalizeEdit() {
    this._editor = null;
  }

  setMaterialValues(values, needTraverse = false, process = undefined) {
    for (let i = 0, n = this._reprList.length; i < n; ++i) {
      const rep = this._reprList[i];
      rep.material.setValues(values);
      if (needTraverse) {
        rep.geo.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.material.setValues(values);

            if (process !== undefined) {
              process(object);
            }

            object.material.needsUpdate = true;
          }
        });
      }
    }
  }

  setUberOptions(values) {
    for (let i = 0, n = this._reprList.length; i < n; ++i) {
      const rep = this._reprList[i];
      rep.material.setUberOptions(values);
    }
  }

  /**
   * Build selector that contains all atoms within given distance from group of atoms
   * @param {Selector} selector - selector describing source group of atoms
   * @param {number} radius - distance
   * @returns {Selector} selector describing result group of atoms
   */
  within(selector, radius) {
    const vw = this._complex.getVoxelWorld();
    if (vw === null) {
      return false;
    }

    // mark atoms of the group as selected
    const selectionMask = 1 << this._selectionBit;
    this._complex.markAtoms(selector, selectionMask);

    // mark all atoms within distance as selected
    if (vw) {
      vw.forEachAtomWithinDistFromMasked(this._complex, selectionMask, Number(radius), (atom) => {
        atom.mask |= selectionMask;
      });
    }

    // update selection count
    this._selectionCount = this._complex.countAtomsByMask(selectionMask);

    // update secondary structure mask
    this._complex.updateStructuresMask();

    return this.buildSelectorFromMask(selectionMask);
  }
}
// 32 bits = 30 bits for reps + 1 for selection + 1 for selection expansion
ComplexVisual.NUM_REPRESENTATION_BITS = 30;

export default ComplexVisual;
