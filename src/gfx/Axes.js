

import * as THREE from 'three';

function Axes(target, targetCamera) {
  this._target = target;
  this._targetCamera = targetCamera;
  this._camera = new THREE.PerspectiveCamera(targetCamera.fov, targetCamera.aspect, 1, 100);
  this._object = new THREE.AxisHelper(1);
  this._scene = new THREE.Scene();
  this._scene.add(this._object);

  this._update();
}

Axes.prototype._update = function() {
  var fov = this._targetCamera.fov;
  var camera = this._camera;
  camera.aspect = this._targetCamera.aspect;
  camera.setMinimalFov(fov);
  camera.setDistanceToFit(1.0, fov);
  camera.updateProjectionMatrix();

  this._object.quaternion.copy(this._target.quaternion);
};

Axes.prototype.render = function(renderer) {
  this._update();

  var full = renderer.getSize();
  var width = full.width * 0.25;
  var height = full.height * 0.25;

  var autoClear = renderer.autoClear;
  renderer.autoClear = false;
  renderer.setViewport(0.0, full.height - height, width, height); // use left bottom corner
  renderer.clear(false, true, false);
  renderer.render(this._scene, this._camera);
  renderer.setViewport(0, 0, full.width, full.height);
  renderer.autoClear = autoClear;
};

export default Axes;

