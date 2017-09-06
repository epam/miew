

import * as THREE from 'three';
import settings from '../settings';

function View() {
  this.position = new THREE.Vector3(0, 0, 0);
  this.scale = 1;
  this.orientation = new THREE.Quaternion(0, 0, 0, 1);
}

View.prototype.set = function(position, scale, orientation) {
  this.position = position;
  this.scale = scale;
  this.orientation = orientation;
};

var _transitionTime = 1.5; // in seconds

function ViewInterpolator() {
}

ViewInterpolator.prototype.setup = function(startView, endView) {

  this._startTime = undefined;
  this._endTime = undefined;

  this._srcView = startView;
  this._dstView = endView;
  this._isMoving = false;
};

ViewInterpolator.prototype.isMoving = function() {
  return this._isMoving;
};

ViewInterpolator.prototype.wasStarted = function() {
  return typeof this._startTime !== 'undefined' && typeof this._endTime !== 'undefined';
};

ViewInterpolator.prototype.start = function() {
  this._startTime = Date.now();
  var transTime = settings.now.interpolateViews ? _transitionTime * 1000 : 0;
  this._endTime = this._startTime + transTime;
  this._isMoving = true;
};

ViewInterpolator.prototype.getCurrentView = function() {

  if (typeof this._srcView === 'undefined' || typeof this._dstView === 'undefined' ||
      !this._isMoving || !this.wasStarted()) {
    return {success: false};
  }

  var view = this.createView();
  var time = Date.now();
  if (time > this._endTime) {
    view = this._dstView;
    this._reset();
    return {success: true, view: view};
  }

  var factor = (time - this._startTime) / (this._endTime - this._startTime);
  view.position.copy(this._srcView.position);
  view.position.lerp(this._dstView.position, factor);
  view.scale = (1 - factor) * this._srcView.scale +  factor * this._dstView.scale;
  view.orientation.copy(this._srcView.orientation);
  view.orientation.slerp(this._dstView.orientation, factor);
  return {success: true, view: view};
};

ViewInterpolator.prototype._reset = function() {
  this._startTime = this._endTime = 0;
  this._isMoving = false;
};

ViewInterpolator.prototype.createView = function() {
  return new View();
};

export default new ViewInterpolator();

