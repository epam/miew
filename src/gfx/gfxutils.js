

/* eslint-disable no-magic-numbers */
import * as THREE from 'three';
import CSS2DObject from './CSS2DObject';
import RCGroup from './RCGroup';
import UberMaterial from './shaders/UberMaterial';

var LAYERS = {
  DEFAULT: 0, VOLUME: 1, TRANSPARENT: 2, PREPASS_TRANSPARENT: 3, VOLUME_BFPLANE: 4
};

THREE.Object3D.prototype.resetTransform = function() {
  this.position.set(0, 0, 0);
  this.quaternion.set(0, 0, 0, 1);
  this.scale.set(1, 1, 1);
};

// update world matrix of this object and all its ancestors
THREE.Object3D.prototype.updateMatrixWorldRecursive = function() {
  if (this.parent != null) {
    this.parent.updateMatrixWorldRecursive();
  }
  this.updateMatrixWorld();
};
// add object to parent, saving objects' world transform
THREE.Object3D.prototype.addSavingWorldTransform = (function() {
  const _worldMatrixInverse = new THREE.Matrix4();

  return function(object) {
    if (object instanceof THREE.Object3D) {
      _worldMatrixInverse.getInverse(this.matrixWorld);
      _worldMatrixInverse.multiply(object.matrixWorld);
      object.matrix.copy(_worldMatrixInverse);
      object.matrix.decompose(object.position, object.quaternion, object.scale);
      this.add(object);
    }
  };
}());

// render a tiny transparent quad in the center of the screen
THREE.WebGLRenderer.prototype.renderDummyQuad = (function() {

  var _material = new THREE.MeshBasicMaterial({transparent: true, opacity: 0.0, depthWrite: false});

  var _scene = new THREE.Scene();
  var _quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(0.01, 0.01), _material);
  _scene.add(_quad);

  var _camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  _camera.position.z = 100;

  return function(renderTarget) {

    this.render(_scene, _camera, renderTarget);

  };
})();

THREE.WebGLRenderer.prototype.renderScreenQuad = (function() {

  var _scene = new THREE.Scene();
  var _quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(1.0, 1.0));
  _scene.add(_quad);

  var _camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  _camera.position.z = 100;


  return function(material, renderTarget) {

    _quad.material = material;
    this.render(_scene, _camera, renderTarget);

  };
})();

THREE.WebGLRenderer.prototype.renderScreenQuadFromTex = (function() {

  var _material = new THREE.ShaderMaterial({
    uniforms: {
      srcTex: {type: 't', value: null},
      opacity: {type: 'f', value: 1.0}
    },
    vertexShader: 'varying vec2 vUv; ' +
      'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
    fragmentShader: 'varying vec2 vUv; uniform sampler2D srcTex; uniform float opacity;' +
      'void main() { vec4 color = texture2D(srcTex, vUv); gl_FragColor = vec4(color.xyz, color.a * opacity); }',
    transparent: true,
    depthTest: false,
    depthWrite: false
  });


  return function(srcTex, opacity, renderTarget) {

    _material.uniforms.srcTex.value = srcTex;
    _material.transparent = (opacity < 1.0);
    _material.uniforms.opacity.value = opacity;
    this.renderScreenQuad(_material, renderTarget);

  };
})();

THREE.WebGLRenderer.prototype.renderScreenQuadFromTexWithDistortion = (function() {

  var _material = new THREE.ShaderMaterial({
    uniforms: {
      srcTex: {type: 't', value: null},
      coef: {type: 'f', value: 1.0}
    },
    vertexShader: 'varying vec2 vUv; ' +
      'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
    fragmentShader: 'varying vec2 vUv; uniform sampler2D srcTex; uniform float coef;' +
      'void main() {' +
      'vec2 uv = vUv * 2.0 - 1.0;' +
      'float r2 = dot(uv, uv);' +
      'vec2 tc = uv * (1.0 + coef * r2);' +
      'if (!all(lessThan(abs(tc), vec2(1.0)))) discard;' +
      'tc = 0.5 * (tc + 1.0);' +
      'gl_FragColor = texture2D(srcTex, tc);' +
      '}',
    transparent: false,
    depthTest: false,
    depthWrite: false
  });


  return function(srcTex, coef, renderTarget) {

    _material.uniforms.srcTex.value = srcTex;
    _material.uniforms.coef.value = coef;
    this.renderScreenQuad(_material, renderTarget);

  };
})();

// TODO: move to a new Camera class?

/**
 * @param {number} angle - Field of view in degrees.
 */
THREE.PerspectiveCamera.prototype.setMinimalFov = function(angle) {
  if (this.aspect >= 1.0) {
    this.fov = angle;
  } else {
    this.fov = THREE.Math.radToDeg(2 * Math.atan(Math.tan(THREE.Math.degToRad(angle) * 0.5) / this.aspect));
  }
};

/**
 * @param {number} radius - Radius of bounding sphere in angstroms to fit on screen.
 * @param {number} angle - Field of view in degrees.
 */
THREE.PerspectiveCamera.prototype.setDistanceToFit = function(radius, angle) {
  this.position.z = radius / Math.sin(0.5 * THREE.Math.degToRad(angle));
};


function _calcCylinderMatrix(posBegin, posEnd, radius) {
  var posCenter = posBegin.clone().lerp(posEnd, 0.5);
  var matScale = new THREE.Matrix4();
  matScale.makeScale(radius, posBegin.distanceTo(posEnd), radius);

  var matRotHalf = new THREE.Matrix4();
  matRotHalf.makeRotationX(Math.PI / 2);

  var matRotLook = new THREE.Matrix4();
  var vUp = new THREE.Vector3(0, 1, 0);
  matRotLook.lookAt(posCenter, posEnd, vUp);

  matRotLook.multiply(matRotHalf);
  matRotLook.multiply(matScale);
  matRotLook.setPosition(posCenter);
  return matRotLook;
}

function _calcChunkMatrix(eye, target, up, rad) {
  var matScale = new THREE.Matrix4();
  matScale.makeScale(rad.x, rad.y, 0);

  var matRotLook = new THREE.Matrix4();
  matRotLook.lookAt(eye, target, up);
  matRotLook.multiply(matScale);
  matRotLook.setPosition(eye);

  return matRotLook;
}

function _forEachMeshInGroup(group, process) {
  function processObj(object) {
    if (object instanceof THREE.Mesh) {
      process(object);
    }
    for (var i = 0, l = object.children.length; i < l; i++) {
      processObj(object.children[i]);
    }
  }
  processObj(group);
}

function _countMeshTriangles(mesh) {
  var geom = mesh.geometry;
  if (geom instanceof THREE.InstancedBufferGeometry) {
    var attribs = geom.attributes;
    for (var property in attribs) {
      if (attribs.hasOwnProperty(property) && attribs[property] instanceof THREE.InstancedBufferAttribute) {
        var currAttr = attribs[property];
        var indexSize = geom.index ? geom.index.array.length / 3 : 0;
        return indexSize * currAttr.array.length / currAttr.itemSize;
      }
    }
    return 0;
  }
  if (geom instanceof THREE.BufferGeometry) {
    return geom.index ? geom.index.array.length / 3 : 0;
  }
  return geom.faces ? geom.faces.length : 0;
}

function _countTriangles(group) {
  var totalCount = 0;
  _forEachMeshInGroup(group, function(mesh) {
    totalCount += _countMeshTriangles(mesh);
  });
  return totalCount;
}

function _groupHasGeometryToRender(group) {
  var hasGeoms = false;
  group.traverse(function(node) {
    if (node.hasOwnProperty('geometry') || node instanceof CSS2DObject) {
      hasGeoms = true;
    }
  });
  return hasGeoms;
}

function _buildDistorionMesh(widthSegments, heightSegements, coef) {

  // solve equation r_u = r_d * (1 + k * r_d^2)
  // for r_d using iterations
  // takes: r_u^2
  // returns: r_d / r_u  factor that can be used to distort point coords
  function calcInverseBarrel(r2) {
    var epsilon = 1e-5;
    var prevR2 = 0.0;
    var curR2 = r2;
    var dr = 1.0;
    while (Math.abs(curR2 - prevR2) > epsilon) {
      dr = 1.0 + coef * curR2;
      prevR2 = curR2;
      curR2 = r2 / (dr * dr);
    }

    return 1.0 / dr;
  }

  var geo = new THREE.PlaneBufferGeometry(2.0, 2.0, widthSegments, heightSegements);

  var pos = geo.getAttribute('position');
  for (var i = 0; i < pos.count; ++i) {
    var x = pos.array[3 * i];
    var y = pos.array[3 * i + 1];
    var c = calcInverseBarrel(x * x + y * y);
    pos.setXY(i, c * x, c * y);
  }

  return geo;
}

THREE.BufferAttribute.prototype.copyAtList = function(attribute, indexList) {
  console.assert(
    this.itemSize === attribute.itemSize,
    'DEBUG: BufferAttribute.copyAtList buffers have different item size.'
  );
  var itemSize = this.itemSize;
  for (var i = 0, n = indexList.length; i < n; ++i) {
    for (var j = 0; j < itemSize; ++j) {
      this.array[i * itemSize + j] = attribute.array[indexList[i] * itemSize + j];
    }
  }
  return this;
};

function fillArray(array, value, startIndex, endIndex) {
  startIndex = (typeof startIndex !== 'undefined') ? startIndex : 0;
  endIndex = (typeof endIndex !== 'undefined') ? endIndex : array.length;
  for (var i = startIndex; i < endIndex; ++i) {
    array[i] = value;
  }
}

/** @param {THREE.Object3D} object - Parent object. */
function removeChildren(object) {
  var children = object.children;
  for (var i = 0, n = children.length; i < n; ++i) {
    var child = children[i];
    child.parent = null;
    child.dispatchEvent({type: 'removed'});
  }
  object.children = [];
}

function clearTree(object) {
  object.traverse(function(obj) {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
    }
  });
  removeChildren(object);
}

function destroyObject(object) {
  clearTree(object);
  if (object.parent) {
    object.parent.remove(object);
  } else {
    object.dispatchEvent({type: 'removed'});
  }
}

function applyTransformsToMeshes(root, mtc) {
  var meshes = [];

  var mtcCount = mtc.length;
  if (mtcCount < 1) {
    return;
  }
  root.traverse(function(object) {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments ||
          object instanceof THREE.Line) {
      meshes[meshes.length] = object;
    }
  });

  for (var i = 0, n = meshes.length; i < n; ++i) {
    var mesh = meshes[i];
    var parent = mesh.parent;
    if (!parent) {
      continue;
    }
    mesh.applyMatrix(mtc[0]);
    for (var j = 1; j < mtcCount; ++j) {
      var newMesh = new mesh.constructor(mesh.geometry, mesh.material);
      newMesh.material.forceUniformsUpdate = true;
      parent.add(newMesh);
      newMesh.applyMatrix(mtc[j]);
    }
  }
}

function processTransparentMaterial(root, material) {

  if (!(material instanceof UberMaterial)) {
    return;
  }

  var meshes = [];
  root.traverse(function(object) {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      meshes[meshes.length] = object;
    }
  });

  for (var i = 0, n = meshes.length; i < n; ++i) {
    var mesh = meshes[i];
    var parent = mesh.parent;
    if (!parent) {
      continue;
    }
    mesh.material.setValues({prepassTransparancy: false, fakeOpacity: false});
    mesh.material.needsUpdate = true;
    mesh.layers.set(LAYERS.TRANSPARENT);

    // copy of geometry with prepass material
    var prepassMat = mesh.material.createInstance();
    prepassMat.setValues({prepassTransparancy: true, fakeOpacity: false});
    var prepassMesh = new mesh.constructor(mesh.geometry, prepassMat);
    prepassMesh.material.transparent = false;
    prepassMesh.material.needsUpdate = true;
    prepassMesh.applyMatrix(mesh.matrix);
    prepassMesh.layers.set(LAYERS.PREPASS_TRANSPARENT);
    parent.add(prepassMesh);
  }
}

/** Traverse tree and make visible only needed meshes*/
function makeVisibleMeshes(object, checker) {
  if (object && object.traverse) {
    object.traverse(function(obj) {
      if (obj instanceof THREE.Mesh) {
        obj.visible = checker(obj);
      }
    });
  }
}

function applySelectionMaterial(geo) {
  geo.traverse(function(node) {
    if ('material' in node) {
      node.material = node.material.clone(true);
      // HACK: using z-offset to magically fix selection rendering artifact (on z-sprites)
      node.material.setValues({depthFunc: THREE.LessEqualDepth, overrideColor: true, fog: false});
      node.material.setUberOptions({fixedColor: new THREE.Color(0xFFFF00), zOffset: -1e-6});
    }
  });
}

function getMiddlePoint(point1, point2, optionalTarget) {
  const result = optionalTarget || new THREE.Vector3();

  result.set(0, 0, 0);
  result.addScaledVector(point1, 0.5);
  result.addScaledVector(point2, 0.5);

  return result;
}


export default {
  calcCylinderMatrix : _calcCylinderMatrix,
  calcChunkMatrix : _calcChunkMatrix,
  forEachMeshInGroup : _forEachMeshInGroup,
  countTriangles : _countTriangles,
  groupHasGeometryToRender : _groupHasGeometryToRender,
  buildDistorionMesh: _buildDistorionMesh,
  RCGroup : RCGroup,
  fillArray: fillArray,
  clearTree: clearTree,
  destroyObject: destroyObject,
  applyTransformsToMeshes: applyTransformsToMeshes,
  processTransparentMaterial: processTransparentMaterial,
  makeVisibleMeshes: makeVisibleMeshes,
  applySelectionMaterial: applySelectionMaterial,
  getMiddlePoint: getMiddlePoint,
  LAYERS: LAYERS,
};

