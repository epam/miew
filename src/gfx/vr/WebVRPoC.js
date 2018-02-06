import * as THREE from 'three';
import GeoViveController from './GeoViveController';
import createWebVRButton from './createWebVRButton';
import gfxutils from '../gfxutils';
import logger from '../../utils/logger';
import settings from '../../settings';

export default class WebVRPoC {

  constructor(onToggle) {
    this._mainCamera = new THREE.PerspectiveCamera();
    this._cameraWasStored = false;
    this._button = null;
    this._onToggle = onToggle;

    this._molContainer = new gfxutils.RCGroup();
    this._user = new gfxutils.RCGroup();
    this._scalingPivot = new THREE.Object3D();
    this._user.add(this._scalingPivot);

    this._controller1 = new GeoViveController(0);
    this._controller2 = new GeoViveController(1);
    this._user.add(this._controller1);
    this._user.add(this._controller2);
    this._pressedGripsCounter = 0;
    this._distance = 0;

    this._gfx = null;

    const self = this;
    function startScalingByControllers() {
      // reset scale
      self._distance = self._controller1.position.distanceTo(self._controller2.position);
      gfxutils.getMiddlePoint(self._controller1.position, self._controller2.position, self._scalingPivot.position);
      self._scalingPivot.scale.set(1, 1, 1);
      self._scalingPivot.updateMatrix();
      self._scalingPivot.updateMatrixWorld();
      // link molecule to pivot
      self._scalingPivot.addSavingWorldTransform(self._molContainer);
    }

    function stopScalingByControllers() {
      self._gfx.scene.addSavingWorldTransform(self._molContainer);
    }

    function handleGripsDown(event) {
      self._pressedGripsCounter++;
      if (self._pressedGripsCounter === 2) {
        startScalingByControllers();
      } else if (self._pressedGripsCounter === 1) {
        event.target.addSavingWorldTransform(self._molContainer);
      }
    }

    function handleGripsUp(event) {
      self._pressedGripsCounter--;
      if (self._pressedGripsCounter === 1) {
        stopScalingByControllers();
        // reattach molecule to other controller
        const anotherController = event.target === self._controller1 ? self._controller2 : self._controller1;
        anotherController.addSavingWorldTransform(self._molContainer);
      } else if (self._pressedGripsCounter === 0) {
        self._gfx.scene.addSavingWorldTransform(self._molContainer);
      }
    }

    self._controller1.addEventListener('gripsdown', handleGripsDown);
    self._controller1.addEventListener('gripsup', handleGripsUp);
    self._controller2.addEventListener('gripsdown', handleGripsDown);
    self._controller2.addEventListener('gripsup', handleGripsUp);
  }

  /**
   * Turn the WebVR when it is supported
   * NOTE: we toggle using button.click, because VRDisplay.requestPresent should be called from user gesture
   */
  toggle(enable, gfx) {
    if (typeof gfx === 'undefined') {
      logger.warn('WebVR couldn\'t be enabled, because gfx is not defined');
    }
    const self = this;
    this._gfx = gfx;
    const  renderer = gfx ? gfx.renderer : null;
    if (!renderer) {
      throw new Error('No renderer is available to toggle WebVR');
    } else if (!gfx.camera) {
      throw new Error('No camera is available to toggle WebVR');
    }

    if (enable && !renderer.vr.enabled) {
      // store common camera
      self._mainCamera.copy(gfx.camera);
      self._cameraWasStored = true;
      // enable vr in renderer
      renderer.vr.enabled = true;
      if (!this._button) {
        self._button = createWebVRButton(this);
        document.body.appendChild(self._button);
      } else {
        self._button.style.display = 'block';
      }
      // add hierarchical structure for webVR into scene
      if (self._user) {
        gfx.scene.add(self._user);
        self._user.add(gfx.camera);
      }

      settings.now.fog = false;
      //turn on webvr transformation
      gfx.scene.add(self._molContainer);
      self._molContainer.add(gfx.root);

    } else if (!enable && renderer.vr.enabled) {
      //disable vr
      const display = self.getDevice();
      if (display && display.isPresenting) {
        display.exitPresent();
      }
      renderer.vr.enabled = false;
      if (self._button) {
        self._button.style.display = 'none';
      }
      // restore common camera
      if (self._cameraWasStored) {
        gfx.camera.copy(self._mainCamera);
      }
      settings.now.fog = true;
      //turn off webvr transformation
      const root = self._molContainer.children[0];
      if (root) gfx.scene.add(root);
      self._molContainer.parent.remove(self._molContainer);
      if (self._user) {
        gfx.scene.remove(self._user);
        self._user.remove(gfx.camera);
      }
    }
    if (self._onToggle) {
      self._onToggle(enable);
    }
  }

  updateMoleculeScale() {
    if (!this._controller1 || !this._controller2) {
      return;
    }
    this._controller1.update();
    this._controller2.update();

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

  // move slightly the molecule from the world center toward the camera direction
  translateMolecule() {
    const device = this.getDevice();
    if (!device) {
      return;
    }

    // Cam dir in CameraSpace
    let camDir = new THREE.Vector3(0, 0, -1);
    let pose;

    if (device.pose) {  // WebVR emulation
      pose = device.pose;
    } else if (device.getFrameData) {  // WebVR
      let frameData = new VRFrameData();
      device.getFrameData(frameData);
      pose = frameData.pose;
    } else {
      return;
    }
    const orient = pose.orientation;
    const quaternion = new THREE.Quaternion(orient[0], orient[1], orient[2], orient[3]);
    camDir.applyQuaternion(quaternion);
    if (pose.position === null) {
      logger.warn('VRDisplay cannot provide its position. Be sure VRDisplay is detected by sensors');
    }
    const pos = pose.position || [0, 0, 0];
    this._molContainer.position.fromArray(pos);
    this._molContainer.position.addScaledVector(camDir, 1.3);
  }

  getDevice() {
    const vr = (this._gfx && this._gfx.renderer) ? this._gfx.renderer.vr : null;
    return (vr && vr.enabled) ? vr.getDevice() : null;
  }

  setDevice(display) {
    const vr = (this._gfx && this._gfx.renderer) ? this._gfx.renderer.vr : null;
    if (vr) {
      vr.setDevice(display);
    }
  }

  getCanvas() {
    const gfx = this._gfx;
    return (gfx && gfx.renderer) ? gfx.renderer.domElement : null;
  }
}

