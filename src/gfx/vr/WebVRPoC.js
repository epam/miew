import * as THREE from 'three';
import createWebVRButton from './createWebVRButton';
import gfxutils from '../gfxutils';
import logger from '../../utils/logger';
import settings from '../../settings';
import UberMaterial from '../shaders/UberMaterial';

export default class WebVRPoC {
  constructor(onToggle) {
    this._mainCamera = new THREE.PerspectiveCamera();
    this._button = null;
    this._onToggle = onToggle;

    this._molContainer = new gfxutils.RCGroup();
    this._user = new gfxutils.RCGroup();
    this._scalingPivot = new THREE.Object3D();
    this._user.add(this._scalingPivot);

    this._controller1 = null;
    this._controller2 = null;
    this._pressedGripsCounter = 0;
    this._distance = 0;

    this._gfx = null;
  }

  startScalingByControllers() {
    // reset scale
    this._distance = this._controller1.position.distanceTo(this._controller2.position);
    gfxutils.getMiddlePoint(this._controller1.position, this._controller2.position, this._scalingPivot.position);
    this._scalingPivot.scale.set(1, 1, 1);
    this._scalingPivot.updateMatrix();
    this._scalingPivot.updateMatrixWorld();
    // link molecule to pivot
    this._scalingPivot.addSavingWorldTransform(this._molContainer);
  }

  stopScalingByControllers() {
    this._gfx.scene.addSavingWorldTransform(this._molContainer);
  }

  handleGripsDown(event) {
    this._pressedGripsCounter++;
    if (this._pressedGripsCounter === 2) {
      this.startScalingByControllers();
    } else if (this._pressedGripsCounter === 1) {
      event.target.addSavingWorldTransform(this._molContainer);
    }
  }

  handleGripsUp(event) {
    this._pressedGripsCounter--;
    if (this._pressedGripsCounter === 1) {
      this.stopScalingByControllers();
      // reattach molecule to other controller
      const anotherController = event.target === this._controller1 ? this._controller2 : this._controller1;
      anotherController.addSavingWorldTransform(this._molContainer);
    } else if (this._pressedGripsCounter === 0) {
      this._gfx.scene.addSavingWorldTransform(this._molContainer);
    }
  }

  enable(gfx) {
    if (!gfx) {
      logger.warn('WebVR couldn\'t be enabled, because gfx is not defined');
      return;
    }
    this._gfx = gfx;
    const { renderer, camera } = gfx;
    if (!renderer) {
      throw new Error('No renderer is available to toggle WebVR');
    }
    if (!camera) {
      throw new Error('No camera is available to toggle WebVR');
    }

    // enable xr in renderer
    renderer.xr.enabled = true;
    // add button for turning vr mode
    if (!this._button) {
      this._button = createWebVRButton(this);
      document.body.appendChild(this._button);
    } else {
      this._button.style.display = 'block';
    }
    // store fog setting
    this._mainFog = settings.now.fog;
    settings.set('fog', false);

    this._plugVRNodesIntoScene(gfx, renderer);
    this._setControllersListeners();

    // make some Miew job
    if (this._onToggle) {
      this._onToggle(true);
    }
  }

  _plugVRNodesIntoScene(gfx, renderer) {
    // store common scene camera
    this._mainCamera.copy(gfx.camera);
    // add hierarchical structure for webVR into scene
    gfx.scene.add(this._user);
    // turn on webvr transformation
    gfx.scene.add(this._molContainer);
    this._molContainer.add(gfx.root);

    this._controller1 = renderer.xr.getController(0);
    this._controller2 = renderer.xr.getController(1);
    const mesh = this._createControllerMesh();
    this._controller1.add(mesh);
    this._controller2.add(mesh.clone());
    this._user.add(this._controller1);
    this._user.add(this._controller2);
  }

  _setControllersListeners() {
    this._controller1.addEventListener('selectstart', (event) => {
      this.handleGripsDown(event);
    });
    this._controller1.addEventListener('selectend', (event) => {
      this.handleGripsUp(event);
    });
    this._controller2.addEventListener('selectstart', (event) => {
      this.handleGripsDown(event);
    });
    this._controller2.addEventListener('selectend', (event) => {
      this.handleGripsUp(event);
    });

    this._controller1.addEventListener('squeezestart', (event) => {
      this.handleGripsDown(event);
    });
    this._controller1.addEventListener('squeezeend', (event) => {
      this.handleGripsUp(event);
    });
    this._controller2.addEventListener('squeezestart', (event) => {
      this.handleGripsDown(event);
    });
    this._controller2.addEventListener('squeezeend', (event) => {
      this.handleGripsUp(event);
    });
  }

  disable() {
    if (!this._gfx) {
      return;
    }
    const { renderer, camera } = this._gfx;
    if (!renderer) {
      throw new Error('No renderer is available to toggle WebVR');
    }

    // nullify webxr callback for animation frame
    renderer.setAnimationLoop(null);
    const session = renderer.xr.getSession();
    if (session) {
      session.end();
    }
    renderer.xr.enabled = false;
    // remove button of VR entering
    if (this._button) {
      this._button.style.display = 'none';
    }
    // restore fog param
    settings.set('fog', this._mainFog);

    this._unplugVRNodesFromScene(camera);

    // make some Miew job
    if (this._onToggle) {
      this._onToggle(false);
    }
  }

  _unplugVRNodesFromScene(camera) {
    // restore common camera
    if (this._mainCamera && camera) {
      camera.copy(this._mainCamera);
    }
    // turn off webvr transformation
    const root = this._molContainer.children[0];
    if (root) {
      this._gfx.scene.add(root);
    }
    this._molContainer.parent.remove(this._molContainer);
    if (this._user) {
      this._gfx.scene.remove(this._user);
    }
    // free scene nodes
    this._molContainer = null;
    this._user = null;
    this._scalingPivot = null;
    this._user = null;
    this._controller1 = null;
    this._controller2 = null;
  }

  _createControllerMesh() {
    // visualize controllers with cylinders
    const geometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3);
    const material = new UberMaterial({ lights: false, overrideColor: true });
    material.setUberOptions({ fixedColor: new THREE.Color(0x4444ff) });
    material.updateUniforms();
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.rotateX(-Math.PI / 2);
    return cylinder;
  }

  updateMoleculeScale() {
    if (!this._controller1 || !this._controller2) {
      return;
    }

    const self = this;
    // update molecule scaling by controllers
    if (self._pressedGripsCounter === 2) {
      // recalc scaling pivot
      gfxutils.getMiddlePoint(self._controller1.position, self._controller2.position, self._scalingPivot.position);
      // recalc scaler
      const dist = self._controller1.position.distanceTo(self._controller2.position);
      const scaler = dist / self._distance;
      self._scalingPivot.scale.multiplyScalar(scaler);
      // save cur distance for next frame
      self._distance = dist;
    }
  }

  /**
   * Reposition molecule right before the camera.
   * @note The proper way is to initiate headset in the place of common Miew's camera.
   * But threejs limitations on setting new XRReferenceSpace enforce the molecule repositioning
   * Hope, something will change.
   */
  moveSceneBehindHeadset() {
    const gfx = this._gfx;
    const { camera } = gfx;

    // set container position in camera space
    const container = this._molContainer;
    container.matrix.identity();
    container.position.set(0, 0, -4.0);
    container.updateMatrix();

    // update container world matrix
    container.matrixWorld.multiplyMatrices(camera.matrixWorld, container.matrix);
    // readd to scene
    gfx.scene.addSavingWorldTransform(container);
    if (this._onToggle) {
      this._onToggle(true);
    }
  }

  getCanvas() {
    const gfx = this._gfx;
    return (gfx && gfx.renderer) ? gfx.renderer.domElement : null;
  }
}
