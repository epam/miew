import * as THREE from 'three';
import logger from './utils/logger';
import gfxutils from './gfx/gfxutils';
import './gfx/modes';

function _traverseComponentGroups(root, component, callback) {
  const { children } = root;
  if (!children) {
    return;
  }

  for (let i = 0, n = children.length; i < n; ++i) {
    const child = children[i];
    if (child._component === component) {
      callback(child);
    }
    if (child instanceof gfxutils.RCGroup) {
      _traverseComponentGroups(child, component, callback);
    }
  }
}

function ComplexEditor() {
}

class ComplexComponentEditor extends ComplexEditor {
  constructor(complexVisual) {
    super();
    this._complexVisual = complexVisual;
    this._inProgress = false;
  }

  begin() {
    const complex = this._complexVisual.getComplex();

    // init component matrices
    this._componentTransforms = [];
    for (let i = 0; i < complex._components.length; ++i) {
      const component = complex._components[i];
      this._componentTransforms[component._index] = new THREE.Object3D();
    }

    this._inProgress = true;

    return true;
  }

  apply() {
    if (!this._inProgress) {
      return;
    }

    const complex = this._complexVisual.getComplex();

    for (let i = 0; i < complex._components.length; ++i) {
      this._bakeComponentTransform(complex._components[i]);
    }

    complex.onAtomPositionChanged();

    this._resetComponentTransform();

    this._complexVisual.finalizeEdit();
  }

  discard() {
    if (!this._inProgress) {
      return;
    }

    this._resetComponentTransform();

    this._complexVisual.finalizeEdit();
  }

  getAltObj() {
    const res = {
      objects: [],
      pivot: new THREE.Vector3(0, 0, 0),
    };

    const visual = this._complexVisual;
    const component = visual.getSelectedComponent();

    if (component === null) {
      return res;
    }

    const selection = this._complexVisual.getSelectionGeo();
    const selectionMask = 1 << visual.getSelectionBit();
    let i;
    let j;
    let reprNode;
    let geo;

    // find all geo nodes for this component
    _traverseComponentGroups(visual, component, (child) => {
      res.objects.push(child);
    });

    // find all selection nodes for this component
    for (i = 0; i < selection.children.length; ++i) {
      reprNode = selection.children[i];
      for (j = 0; j < reprNode.children.length; ++j) {
        geo = reprNode.children[j];
        if (geo.hasOwnProperty('_component') && geo._component === component) {
          res.objects.push(geo);
        }
      }
    }

    // add dummy object that stores component transformation
    res.objects.push(this._componentTransforms[component._index]);

    const bbmin = new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const bbmax = new THREE.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    component.forEachResidue((residue) => {
      const atoms = residue._atoms;
      for (j = 0; j < atoms.length; ++j) {
        if (atoms[j].mask & selectionMask) {
          bbmin.min(atoms[j].position);
          bbmax.max(atoms[j].position);
        }
      }
    });

    res.pivot.lerpVectors(bbmin, bbmax, 0.5);
    return res;
  }

  _bakeComponentTransform(component) {
    const t = this._componentTransforms[component._index];
    if (t && (!(t.position.x === 0 && t.position.y === 0 && t.position.z === 0)
      || !(t.quaternion.x === 0 && t.quaternion.y === 0 && t.quaternion.z === 0 && t.quaternion.w === 1))) {
      t.updateMatrix();

      component.forEachResidue((residue) => {
        const atoms = residue._atoms;
        for (let j = 0; j < atoms.length; ++j) {
          atoms[j].position.applyMatrix4(t.matrix);
        }
      });
    }
  }

  _resetComponentTransform() {
    const visual = this._complexVisual;
    const selection = this._complexVisual.getSelectionGeo();
    let i;
    let j;
    let reprNode;
    let geo;

    for (i = 0; i < this._componentTransforms.length; ++i) {
      geo = this._componentTransforms[i];
      geo.position.set(0, 0, 0);
      geo.quaternion.set(0, 0, 0, 1);
    }

    // reset all geo nodes
    for (i = 0; i < visual.children.length; ++i) {
      reprNode = visual.children[i];
      for (j = 0; j < reprNode.children.length; ++j) {
        geo = reprNode.children[j];
        if (geo.hasOwnProperty('_component')) {
          geo.position.set(0, 0, 0);
          geo.quaternion.set(0, 0, 0, 1);
        }
      }
    }

    // reset all selection nodes
    for (i = 0; i < selection.children.length; ++i) {
      reprNode = selection.children[i];
      for (j = 0; j < reprNode.children.length; ++j) {
        geo = reprNode.children[j];
        if (geo.hasOwnProperty('_component')) {
          geo.position.set(0, 0, 0);
          geo.quaternion.set(0, 0, 0, 1);
        }
      }
    }
  }
}

class ComplexFragmentEditor extends ComplexEditor {
  constructor(complexVisual) {
    super();
    this._complexVisual = complexVisual;
    this._inProgress = false;
  }

  begin() {
    const visual = this._complexVisual;
    const selection = this._complexVisual.getSelectionGeo();

    const atoms = this._getSelectionBorderAtoms();
    if (atoms.length < 1 || atoms.length > 2) {
      logger.error('Can only edit fragments with one or two bound atoms.');
      return false;
    }

    this._fragmentBoundAtoms = atoms;

    const selectionMask = 1 << visual.getSelectionBit();

    // hide selected fragment in main model
    visual.disableSubset(selectionMask, true);

    // hide selection geo in main model
    for (let k = 0; k < selection.children.length; ++k) {
      selection.children[k].visible = false;
    }

    // create visible fragment representation to rotate
    const pivotPos = atoms[0].position.clone();

    if (atoms.length === 2) {
      pivotPos.lerp(atoms[1].position, 0.5);
    }

    this._fragmentGeo = new THREE.Group();
    visual.add(this._fragmentGeo);
    this._fragmentGeo.position.copy(pivotPos);

    this._fragmentSelectionGeo = new THREE.Group();
    selection.add(this._fragmentSelectionGeo);
    this._fragmentSelectionGeo.position.copy(pivotPos);

    const offset = pivotPos.clone();
    offset.negate();

    for (let i = 0; i < visual.children.length; ++i) {
      const g = visual.children[i];
      if (!('getSubset' in g)) {
        continue;
      }

      const vg = new THREE.Group();
      this._fragmentGeo.add(vg);

      const sg = new THREE.Group();
      this._fragmentSelectionGeo.add(sg);

      const meshes = g.getSubset(selectionMask, true);
      for (let j = 0; j < meshes.length; j++) {
        const m = meshes[j];
        vg.add(m);
        m.position.copy(offset);
      }

      const smeshes = g.getSubset(selectionMask, true);
      for (let h = 0; h < smeshes.length; h++) {
        const sm = smeshes[h];
        sg.add(sm);
        sm.position.copy(offset);
      }
    }

    gfxutils.applySelectionMaterial(this._fragmentSelectionGeo);

    this._inProgress = true;
    return true;
  }

  apply() {
    if (!this._inProgress) {
      return;
    }

    const visual = this._complexVisual;
    const selectionBit = visual.getSelectionBit();

    const p = this._fragmentGeo.position;
    const m = this._fragmentGeo.matrix.clone();
    m.multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));

    this._bakeAtomTransform(m, 1 << selectionBit);

    // show selected fragment in main model
    visual.enableSubset(1 << selectionBit, true);

    visual.getComplex().onAtomPositionChanged();

    visual.finalizeEdit();
  }

  discard() {
    if (!this._inProgress) {
      return;
    }

    const visual = this._complexVisual;
    const selection = this._complexVisual.getSelectionGeo();

    this._fragmentGeo.parent.remove(this._fragmentGeo);

    // show selected fragment in main model
    visual.enableSubset(1 << visual.getSelectionBit(), true);

    // show selection geo in main model (+ remove fragment selection geo)
    for (let i = 0; i < selection.children.length; ++i) {
      const node = selection.children[i];
      if (node.visible) {
        selection.remove(node);
      } else {
        node.visible = true;
      }
    }

    visual.finalizeEdit();
  }

  isFreeRotationAllowed() {
    return (this._fragmentBoundAtoms.length < 2);
  }

  getAltObj() {
    const res = {
      objects: [],
      pivot: new THREE.Vector3(0, 0, 0),
    };

    res.objects.push(this._fragmentGeo, this._fragmentSelectionGeo);

    const boundAtoms = this._fragmentBoundAtoms;
    if (boundAtoms.length === 1) {
      if (boundAtoms[0].bonds.length === 1) {
        // single external bond allows rotation about bond axis
        const bond = boundAtoms[0].bonds[0];
        res.axis = new THREE.Vector3().subVectors(bond._right.position, bond._left.position);
        res.axis.normalize();
        res.axis.transformDirection(this._complexVisual.matrixWorld);
      }
    } else if (boundAtoms.length === 2) {
      // two bound atoms allow rotation only about axis running through their centers
      res.axis = new THREE.Vector3().subVectors(boundAtoms[1].position, boundAtoms[0].position);
      res.axis.normalize();
      res.axis.transformDirection(this._complexVisual.matrixWorld);
    }

    return res;
  }

  _getSelectionBorderAtoms() {
    const complex = this._complexVisual.getComplex();

    const selectionMask = 1 << this._complexVisual.getSelectionBit();
    const atomHash = {};

    complex.forEachBond((bond) => {
      if (bond._left.mask & selectionMask) {
        if ((bond._right.mask & selectionMask) === 0) {
          atomHash[bond._left.index] = 1;
        }
      } else if (bond._right.mask & selectionMask) {
        atomHash[bond._right.index] = 1;
      }
    });

    const atoms = [];
    const keys = Object.keys(atomHash);
    for (let i = 0, n = keys.length; i < n; ++i) {
      const idx = keys[i];
      atoms.push(complex._atoms[idx]);
    }

    return atoms;
  }

  _bakeAtomTransform(matrix, mask) {
    this._complexVisual.getComplex().forEachAtom((atom) => {
      if (atom.mask & mask) {
        atom.position.applyMatrix4(matrix);
      }
    });
  }
}

export default {
  ComponentEditor: ComplexComponentEditor,
  FragmentEditor: ComplexFragmentEditor,
};
