

import * as THREE from 'three';
import utils from './utils';
import logger from './utils/logger';
import gfxutils from './gfx/gfxutils';
import './gfx/modes';

function _traverseComponentGroups(root, component, callback) {
  var children = root.children;
  if (!children) {
    return;
  }

  for (var i = 0, n = children.length; i < n; ++i) {
    var child = children[i];
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

function ComplexComponentEditor(complexVisual) {
  this._complexVisual = complexVisual;
  this._inProgress = false;
}

utils.deriveClass(ComplexComponentEditor, ComplexEditor);

ComplexComponentEditor.prototype.begin = function() {
  var complex = this._complexVisual.getComplex();

  // init component matrices
  this._componentTransforms = [];
  for (var i = 0; i < complex._components.length; ++i) {
    var component = complex._components[i];
    this._componentTransforms[component._index] = new THREE.Object3D();
  }

  this._inProgress = true;

  return true;
};

ComplexComponentEditor.prototype.apply = function() {
  if (!this._inProgress) {
    return;
  }

  var complex = this._complexVisual.getComplex();

  for (var i = 0; i < complex._components.length; ++i) {
    this._bakeComponentTransform(complex._components[i]);
  }

  complex.onAtomPositionChanged();

  this._resetComponentTransform();

  this._complexVisual.finalizeEdit();

  // TODO: rebuild in Miew
  // this.rebuildAll();
};

ComplexComponentEditor.prototype.discard = function() {
  if (!this._inProgress) {
    return;
  }

  this._resetComponentTransform();

  this._complexVisual.finalizeEdit();

  // TODO: Make sure this is set in Miew
  // this._needRender = true;
};

ComplexComponentEditor.prototype.getAltObj = function() {
  var res = {
    objects: [],
    pivot: new THREE.Vector3(0, 0, 0)
  };

  var visual = this._complexVisual;
  var component = visual.getSelectedComponent();

  if (component === null) {
    return res;
  }

  var selection = this._complexVisual.getSelectionGeo();
  var selectionMask = 1 << visual.getSelectionBit();
  var i, j, reprNode, geo;

  // find all geo nodes for this component
  _traverseComponentGroups(visual, component, function(child) {
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

  var bbmin = new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
  var bbmax = new THREE.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

  component.forEachResidue(function(residue) {
    var atoms = residue._atoms;
    for (j = 0; j < atoms.length; ++j) {
      if (atoms[j]._mask & selectionMask) {
        bbmin.min(atoms[j]._position);
        bbmax.max(atoms[j]._position);
      }
    }
  });

  res.pivot.lerpVectors(bbmin, bbmax, 0.5);
  return res;
};

ComplexComponentEditor.prototype._bakeComponentTransform = function(component) {
  var t = this._componentTransforms[component._index];
  if (t && (!(t.position.x === 0 && t.position.y === 0 && t.position.z === 0) ||
      !(t.quaternion.x === 0 && t.quaternion.y === 0 && t.quaternion.z === 0 && t.quaternion.w === 1))) {

    t.updateMatrix();

    component.forEachResidue(function(residue) {
      var atoms = residue._atoms;
      for (var j = 0; j < atoms.length; ++j) {
        atoms[j]._position.applyMatrix4(t.matrix);
      }
    });
  }
};

ComplexComponentEditor.prototype._resetComponentTransform = function() {
  var visual = this._complexVisual;
  var selection = this._complexVisual.getSelectionGeo();
  var i, j, reprNode, geo;

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
};

function ComplexFragmentEditor(complexVisual) {
  this._complexVisual = complexVisual;
  this._inProgress = false;
}

utils.deriveClass(ComplexFragmentEditor, ComplexEditor);

ComplexFragmentEditor.prototype.begin = function() {
  var visual = this._complexVisual;
  var selection = this._complexVisual.getSelectionGeo();

  var atoms = this._getSelectionBorderAtoms();
  if (atoms.length < 1 || atoms.length > 2) {
    logger.error('Can only edit fragments with one or two bound atoms.');
    return false;
  }

  this._fragmentBoundAtoms = atoms;

  var selectionMask = 1 << visual.getSelectionBit();

  // hide selected fragment in main model
  visual.disableSubset(selectionMask, true);

  // hide selection geo in main model
  for (var k = 0; k < selection.children.length; ++k) {
    selection.children[k].visible = false;
  }

  // create visible fragment representation to rotate
  var pivotPos = atoms[0]._position.clone();

  if (atoms.length === 2) {
    pivotPos.lerp(atoms[1]._position, 0.5);
  }

  this._fragmentGeo = new THREE.Group();
  visual.add(this._fragmentGeo);
  this._fragmentGeo.position.copy(pivotPos);

  this._fragmentSelectionGeo = new THREE.Group();
  selection.add(this._fragmentSelectionGeo);
  this._fragmentSelectionGeo.position.copy(pivotPos);

  var offset = pivotPos.clone();
  offset.negate();

  for (var i = 0; i < visual.children.length; ++i) {
    var g = visual.children[i];
    if (!('getSubset' in g)) {
      continue;
    }

    var vg = new THREE.Group();
    this._fragmentGeo.add(vg);

    var sg = new THREE.Group();
    this._fragmentSelectionGeo.add(sg);

    var meshes = g.getSubset(selectionMask, true);
    for (var j = 0; j < meshes.length; j++) {
      var m = meshes[j];
      vg.add(m);
      m.position.copy(offset);
    }

    var smeshes = g.getSubset(selectionMask, true);
    for (var h = 0; h < smeshes.length; h++) {
      var sm = smeshes[h];
      sg.add(sm);
      sm.position.copy(offset);
    }
  }

  gfxutils.applySelectionMaterial(this._fragmentSelectionGeo);

  // TODO: Make sure this is set in Miew
  // this._needRender = true;

  this._inProgress = true;
  return true;
};

ComplexFragmentEditor.prototype.apply = function() {
  if (!this._inProgress) {
    return;
  }

  var visual = this._complexVisual;
  var selectionBit = visual.getSelectionBit();

  var p = this._fragmentGeo.position;
  var m = this._fragmentGeo.matrix.clone();
  m.multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));

  this._bakeAtomTransform(m, 1 << selectionBit);

  // show selected fragment in main model
  visual.enableSubset(1 << selectionBit, true);

  visual.getComplex().onAtomPositionChanged();

  visual.finalizeEdit();

  // TODO: rebuild in Miew
  // this.rebuildAll();
};

ComplexFragmentEditor.prototype.discard = function() {
  if (!this._inProgress) {
    return;
  }

  var visual = this._complexVisual;
  var selection = this._complexVisual.getSelectionGeo();

  this._fragmentGeo.parent.remove(this._fragmentGeo);

  // show selected fragment in main model
  visual.enableSubset(1 << visual.getSelectionBit(), true);

  // show selection geo in main model (+ remove fragment selection geo)
  for (var i = 0; i < selection.children.length; ++i) {
    var node = selection.children[i];
    if (node.visible) {
      selection.remove(node);
    } else {
      node.visible = true;
    }
  }

  visual.finalizeEdit();

  // TODO: Make sure this is set in Miew
  // this._needRender = true;
};

ComplexFragmentEditor.prototype.isFreeRotationAllowed = function() {
  return (this._fragmentBoundAtoms.length < 2);
};

ComplexFragmentEditor.prototype.getAltObj = function() {
  var res = {
    objects: [],
    pivot: new THREE.Vector3(0, 0, 0)
  };

  res.objects.push(this._fragmentGeo, this._fragmentSelectionGeo);

  var boundAtoms = this._fragmentBoundAtoms;
  if (boundAtoms.length === 1) {
    if (boundAtoms[0]._bonds.length === 1) {
      // single external bond allows rotation about bond axis
      var bond = boundAtoms[0]._bonds[0];
      res.axis = new THREE.Vector3().subVectors(bond._right._position, bond._left._position);
      res.axis.normalize();
      res.axis.transformDirection(this._complexVisual.matrixWorld);
    }
  } else if (boundAtoms.length === 2) {
    // two bound atoms allow rotation only about axis running through their centers
    res.axis = new THREE.Vector3().subVectors(boundAtoms[1]._position, boundAtoms[0]._position);
    res.axis.normalize();
    res.axis.transformDirection(this._complexVisual.matrixWorld);
  }

  return res;
};

ComplexFragmentEditor.prototype._getSelectionBorderAtoms = function() {
  var complex = this._complexVisual.getComplex();

  var selectionMask = 1 << this._complexVisual.getSelectionBit();
  var atomHash = {};

  complex.forEachBond(function(bond) {
    if (bond._left._mask & selectionMask) {
      if ((bond._right._mask & selectionMask) === 0) {
        atomHash[bond._left._index] = 1;
      }
    } else if (bond._right._mask & selectionMask) {
      atomHash[bond._right._index] = 1;
    }
  });

  var atoms = [];
  var keys = Object.keys(atomHash);
  for (var i = 0, n = keys.length; i < n; ++i) {
    var idx = keys[i];
    atoms.push(complex._atoms[idx]);
  }

  return atoms;
};

ComplexFragmentEditor.prototype._bakeAtomTransform = function(matrix, mask) {
  this._complexVisual.getComplex().forEachAtom(function(atom) {
    if (atom._mask & mask) {
      atom._position.applyMatrix4(matrix);
    }
  });
};


export default {
  ComponentEditor: ComplexComponentEditor,
  FragmentEditor: ComplexFragmentEditor
};

