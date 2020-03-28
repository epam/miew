import * as THREE from 'three';
import settings from '../settings';

class View {
  constructor() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.scale = 1;
    this.orientation = new THREE.Quaternion(0, 0, 0, 1);
  }

  set(position, scale, orientation) {
    this.position = position;
    this.scale = scale;
    this.orientation = orientation;
  }
}

const _transitionTime = 1.5; // in seconds

export default class ViewInterpolator {
  setup(startView, endView) {
    this._startTime = undefined;
    this._endTime = undefined;
    this._isPaused = false;

    this._srcView = startView;
    this._dstView = endView;
    this._isMoving = false;
  }

  isMoving() {
    return this._isMoving;
  }

  wasStarted() {
    return typeof this._startTime !== 'undefined' && typeof this._endTime !== 'undefined';
  }

  start() {
    this._startTime = Date.now();
    const transTime = settings.now.interpolateViews ? _transitionTime * 1000 : 0;
    this._endTime = this._startTime + transTime;
    this._isMoving = true;
  }

  getCurrentView() {
    if (typeof this._srcView === 'undefined' || typeof this._dstView === 'undefined'
      || !this._isMoving || !this.wasStarted()) {
      return { success: false };
    }

    let view = this.createView();
    const time = Date.now();
    if (time > this._endTime) {
      view = this._dstView;
      this.reset();
      return { success: true, view };
    }

    const factor = (time - this._startTime) / (this._endTime - this._startTime);
    view.position.copy(this._srcView.position);
    view.position.lerp(this._dstView.position, factor);
    view.scale = (1 - factor) * this._srcView.scale + factor * this._dstView.scale;
    view.orientation.copy(this._srcView.orientation);
    view.orientation.slerp(this._dstView.orientation, factor);
    return { success: true, view };
  }

  reset() {
    this._startTime = this._endTime = 0;
    this._isMoving = false;
  }

  pause() {
    if (!this._isPaused) {
      this.setup(this.getCurrentView().view, this._dstView);
      this._isPaused = true;
    }
  }

  resume() {
    this._isPaused = false;
  }

  createView() {
    return new View();
  }
}
