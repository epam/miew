/* eslint-disable no-magic-numbers */
import * as THREE from 'three';
import logger from '../utils/logger';
import CSS2DObject from './CSS2DObject';
import RCGroup from './RCGroup';
import vertexScreenQuadShader from './shaders/ScreenQuad.vert';
import fragmentScreenQuadFromTex from './shaders/ScreenQuadFromTex.frag';
import fragmentScreenQuadFromTexWithDistortion from './shaders/ScreenQuadFromTexWithDistortion.frag';

const LAYERS = {
  DEFAULT: 0, VOLUME: 1, TRANSPARENT: 2, PREPASS_TRANSPARENT: 3, VOLUME_BFPLANE: 4, COLOR_FROM_POSITION: 5, SHADOWMAP: 6,
};

const SELECTION_LAYERS = [ // These layers, that are used in the selection by ray casting
  LAYERS.DEFAULT, LAYERS.TRANSPARENT,
];

THREE.Object3D.prototype.resetTransform = function () {
  this.position.set(0, 0, 0);
  this.quaternion.set(0, 0, 0, 1);
  this.scale.set(1, 1, 1);
};

// update world matrix of this object and all its ancestors
THREE.Object3D.prototype.updateMatrixWorldRecursive = function () {
  if (this.parent != null) {
    this.parent.updateMatrixWorldRecursive();
  }
  this.updateMatrixWorld();
};
// add object to parent, saving objects' world transform
THREE.Object3D.prototype.addSavingWorldTransform = (function () {
  const _worldMatrixInverse = new THREE.Matrix4();

  return function (object) {
    if (object instanceof THREE.Object3D) {
      _worldMatrixInverse.copy(this.matrixWorld).invert();
      _worldMatrixInverse.multiply(object.matrixWorld);
      object.matrix.copy(_worldMatrixInverse);
      object.matrix.decompose(object.position, object.quaternion, object.scale);
      this.add(object);
    }
  };
}());

// render a tiny transparent quad in the center of the screen
THREE.WebGLRenderer.prototype.renderDummyQuad = (function () {
  const _material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.0, depthWrite: false });

  const _scene = new THREE.Scene();
  const _quad = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.01), _material);
  _scene.add(_quad);

  const _camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  _camera.position.z = 100;

  return function () {
    this.render(_scene, _camera);
  };
}());

THREE.WebGLRenderer.prototype.renderScreenQuad = (function () {
  const _scene = new THREE.Scene();
  const _quad = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0));
  _scene.add(_quad);

  const _camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
  _camera.position.z = 100;

  return function (material) {
    _quad.material = material;
    this.render(_scene, _camera);
  };
}());

THREE.Matrix4.prototype.isIdentity = (function () {
  const identity = new THREE.Matrix4();
  return function () {
    return identity.equals(this);
  };
}());

THREE.Matrix4.prototype.applyToPointsArray = function (array, stride, w) {
  if (!array || !stride || stride < 3) {
    return array;
  }
  w = w || 0; // use point as normal by default
  const e = this.elements;
  for (let i = 0; i < array.length; i += stride) {
    const x = array[i];
    const y = array[i + 1];
    const z = array[i + 2];

    const persp = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

    array[i] = (e[0] * x + e[4] * y + e[8] * z + e[12] * w) * persp;
    array[i + 1] = (e[1] * x + e[5] * y + e[9] * z + e[13] * w) * persp;
    array[i + 2] = (e[2] * x + e[6] * y + e[10] * z + e[14] * w) * persp;
  }
  return array;
};

class ScreenQuadMaterial extends THREE.RawShaderMaterial {
  constructor(params) {
    if (params.uniforms === undefined) {
      params.uniforms = {};
    }
    params.uniforms.srcTex = { type: 't', value: null };
    params.vertexShader = vertexScreenQuadShader;
    params.transparent = false;
    params.depthTest = false;
    params.depthWrite = false;
    super(params);
  }
}

THREE.WebGLRenderer.prototype.renderScreenQuadFromTex = (function () {
  const _material = new ScreenQuadMaterial({
    uniforms: { opacity: { type: 'f', value: 1.0 } },
    fragmentShader: fragmentScreenQuadFromTex,
    transparent: true,
  });

  return function (srcTex, opacity) {
    _material.uniforms.srcTex.value = srcTex;
    _material.transparent = (opacity < 1.0);
    _material.uniforms.opacity.value = opacity;
    this.renderScreenQuad(_material);
  };
}());

THREE.WebGLRenderer.prototype.renderScreenQuadFromTexWithDistortion = (function () {
  const _material = new ScreenQuadMaterial({
    uniforms: { coef: { type: 'f', value: 1.0 } },
    fragmentShader: fragmentScreenQuadFromTexWithDistortion,
  });

  return function (srcTex, coef) {
    _material.uniforms.srcTex.value = srcTex;
    _material.uniforms.coef.value = coef;
    this.renderScreenQuad(_material);
  };
}());

/**
 * @param {number} angle - Field of view in degrees.
 */
THREE.PerspectiveCamera.prototype.setMinimalFov = function (angle) {
  if (this.aspect >= 1.0) {
    this.fov = angle;
  } else {
    this.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(angle) * 0.5) / this.aspect));
  }
};

/**
 * @param {THREE.PerspectiveCamera} camera - Base camera for this stereo camera.
 * @param {number} angle - Field of view in degrees.
 */
THREE.StereoCamera.prototype.updateHalfSized = function (camera, angle) {
  const originalAspect = camera.aspect;
  const originalFov = camera.fov;

  camera.aspect = originalAspect / 2.0;
  camera.setMinimalFov(angle);
  camera.updateProjectionMatrix();

  this.update(camera);

  camera.aspect = originalAspect;
  camera.fov = originalFov;
  camera.updateProjectionMatrix();
};

/**
 * @param {number} radius - Radius of bounding sphere in angstroms to fit on screen.
 * @param {number} angle - Field of view in degrees.
 */
THREE.PerspectiveCamera.prototype.setDistanceToFit = function (radius, angle) {
  this.position.z = radius / Math.sin(0.5 * THREE.MathUtils.degToRad(angle));
};

/**
 * @param {RCGroup} gfxObj - All objects on scene.
 * @param {THREE.PerspectiveCamera} camera - Camera used for rendering.
 * @param {number} clipPlane - Distance to clip plane.
 * @param {number} fogFarPlane - Distance to fog far plane.
 */
THREE.Raycaster.prototype.intersectVisibleObject = function (gfxObj, camera, clipPlane, fogFarPlane) {
  const intersects = this.intersectObject(gfxObj, false);
  if (intersects.length === 0) {
    return null;
  }

  // find point closest to camera that doesn't get clipped by camera near plane or clipPlane (if it exists)
  const nearPlane = Math.min(camera.near, clipPlane);
  let i;
  let p = intersects[0];
  const v = new THREE.Vector3();
  for (i = 0; i < intersects.length; ++i) {
    p = intersects[i];
    v.copy(p.point);
    v.applyMatrix4(camera.matrixWorldInverse);
    if (v.z <= -nearPlane) {
      break;
    }
  }
  if (i === intersects.length) {
    return null;
  }

  // check that selected intersection point is not clipped by camera far plane or occluded by fog (if it exists)
  const farPlane = Math.min(camera.far, fogFarPlane);
  v.copy(p.point);
  v.applyMatrix4(camera.matrixWorldInverse);
  if (v.z <= -farPlane) {
    return null;
  }
  return p;
};

THREE.Matrix4.prototype.extractScale = (function () {
  const _v = new THREE.Vector3();

  return function (scale) {
    if (scale === undefined) {
      logger.debug('extractScale(): new is too expensive operation to do it on-the-fly');
      scale = _v.clone();
    }

    const te = this.elements;
    scale.x = _v.set(te[0], te[1], te[2]).length();
    scale.y = _v.set(te[4], te[5], te[6]).length();
    scale.z = _v.set(te[8], te[9], te[10]).length();

    // if determine is negative, we need to invert one scale
    const det = this.determinant();
    if (det < 0) {
      scale.x = -scale.x;
    }
    return scale;
  };
}());

function _calcCylinderMatrix(posBegin, posEnd, radius) {
  const posCenter = posBegin.clone().lerp(posEnd, 0.5);
  const matScale = new THREE.Matrix4();
  matScale.makeScale(radius, posBegin.distanceTo(posEnd), radius);

  const matRotHalf = new THREE.Matrix4();
  matRotHalf.makeRotationX(Math.PI / 2);

  const matRotLook = new THREE.Matrix4();
  const vUp = new THREE.Vector3(0, 1, 0);
  matRotLook.lookAt(posCenter, posEnd, vUp);

  matRotLook.multiply(matRotHalf);
  matRotLook.multiply(matScale);
  matRotLook.setPosition(posCenter);
  return matRotLook;
}

function _calcChunkMatrix(eye, target, up, rad) {
  const matScale = new THREE.Matrix4();
  matScale.makeScale(rad.x, rad.y, 0);

  const matRotLook = new THREE.Matrix4();
  matRotLook.lookAt(eye, target, up);
  matRotLook.multiply(matScale);
  matRotLook.setPosition(eye);

  return matRotLook;
}

function _groupHasGeometryToRender(group) {
  let hasGeoms = false;
  group.traverse((node) => {
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
    const epsilon = 1e-5;
    let prevR2 = 0.0;
    let curR2 = r2;
    let dr = 1.0;
    while (Math.abs(curR2 - prevR2) > epsilon) {
      dr = 1.0 + coef * curR2;
      prevR2 = curR2;
      curR2 = r2 / (dr * dr);
    }

    return 1.0 / dr;
  }

  const geo = new THREE.PlaneGeometry(2.0, 2.0, widthSegments, heightSegements);

  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; ++i) {
    const x = pos.array[3 * i];
    const y = pos.array[3 * i + 1];
    const c = calcInverseBarrel(x * x + y * y);
    pos.setXY(i, c * x, c * y);
  }

  return geo;
}

THREE.BufferAttribute.prototype.copyAtList = function (attribute, indexList) {
  console.assert(
    this.itemSize === attribute.itemSize,
    'DEBUG: BufferAttribute.copyAtList buffers have different item size.',
  );
  const { itemSize } = this;
  for (let i = 0, n = indexList.length; i < n; ++i) {
    for (let j = 0; j < itemSize; ++j) {
      this.array[i * itemSize + j] = attribute.array[indexList[i] * itemSize + j];
    }
  }
  return this;
};

function fillArray(array, value, startIndex, endIndex) {
  startIndex = (typeof startIndex !== 'undefined') ? startIndex : 0;
  endIndex = (typeof endIndex !== 'undefined') ? endIndex : array.length;
  for (let i = startIndex; i < endIndex; ++i) {
    array[i] = value;
  }
}

/** @param {THREE.Object3D} object - Parent object. */
function removeChildren(object) {
  const { children } = object;
  for (let i = 0, n = children.length; i < n; ++i) {
    const child = children[i];
    child.parent = null;
    child.dispatchEvent({ type: 'removed' });
  }
  object.children = [];
}

function clearTree(object) {
  object.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) {
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
    object.dispatchEvent({ type: 'removed' });
  }
}

function belongToSelectLayers(object) {
  for (let i = 0; i < SELECTION_LAYERS.length; i++) {
    if (((object.layers.mask >> SELECTION_LAYERS[i]) & 1) === 1) {
      return true;
    }
  }
  return false;
}

function processObjRenderOrder(root, idMaterial) {
  // set renderOrder to 0 for Backdrop and to 1 in other cases to render Backdrop earlier all other materials
  const renderOrder = +(idMaterial !== 'BA');
  root.traverse((object) => {
    if (object.isGroup) {
      object.renderOrder = renderOrder;
    }
  });
}

function applySelectionMaterial(geo) {
  geo.traverse((node) => {
    if ('material' in node) {
      node.material = node.material.clone(true);
      // using z-offset to magically fix selection rendering artifact (on z-sprites)
      node.material.setValues({
        depthFunc: THREE.LessEqualDepth,
        overrideColor: true,
        fog: false,
        lights: false,
        shadowmap: false,
      });
      node.material.setUberOptions({ fixedColor: new THREE.Color(0xFFFF00), zOffset: -1e-6 });
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

// Monkey-patch for "InstancedBufferGeometry.instanceCount becomes undefined after copy()"
// https://github.com/mrdoob/three.js/issues/22151
const _oldInstancedBufferGeometryCopy = THREE.InstancedBufferGeometry.prototype.copy;

THREE.InstancedBufferGeometry.prototype.copy = function (source) {
  _oldInstancedBufferGeometryCopy.call(this, source);
  if (this.instanceCount === undefined) {
    this.instanceCount = Infinity;
  }
};

export default {
  calcCylinderMatrix: _calcCylinderMatrix,
  calcChunkMatrix: _calcChunkMatrix,
  groupHasGeometryToRender: _groupHasGeometryToRender,
  buildDistorionMesh: _buildDistorionMesh,
  RCGroup,
  fillArray,
  clearTree,
  destroyObject,
  belongToSelectLayers,
  processObjRenderOrder,
  applySelectionMaterial,
  getMiddlePoint,
  LAYERS,
};
