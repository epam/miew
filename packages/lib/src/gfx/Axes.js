import * as THREE from 'three';

class Axes {
  constructor(target, targetCamera) {
    this._target = target;
    this._targetCamera = targetCamera;
    this._camera = new THREE.PerspectiveCamera(targetCamera.fov, targetCamera.aspect, 1, 100);
    this._object = new THREE.AxesHelper(1);
    this._scene = new THREE.Scene();
    this._scene.add(this._object);
    this._full = new THREE.Vector2();

    this._update();
  }

  _update() {
    const { fov } = this._targetCamera;
    const camera = this._camera;
    camera.aspect = this._targetCamera.aspect;
    camera.setMinimalFov(fov);
    camera.setDistanceToFit(1.0, fov);
    camera.updateProjectionMatrix();

    this._object.quaternion.copy(this._target.quaternion);
  }

  render(renderer) {
    this._update();

    renderer.getSize(this._full);
    const width = this._full.width * 0.25;
    const height = this._full.height * 0.25;

    const { autoClear } = renderer;
    renderer.autoClear = false;
    renderer.setViewport(0.0, 0.0, width, height);
    renderer.clear(false, true, false);
    renderer.render(this._scene, this._camera);
    renderer.setViewport(0, 0, this._full.width, this._full.height);
    renderer.autoClear = autoClear;
  }
}
export default Axes;
