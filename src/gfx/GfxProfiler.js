

import * as THREE from 'three';
import Profiler from '../Profiler';

function GfxProfiler(renderer) {
  this._renderer = renderer;
  this._prepareTest();
}

GfxProfiler.prototype._prepareTest = function() {

  this._scene = new THREE.Scene();

  var geo = new THREE.PlaneGeometry(10, 10, 128, 128);
  var mat = new THREE.MeshBasicMaterial({color: this._renderer.getClearColor()});

  for (var j = 0; j < 300; ++j) {
    var plane = new THREE.Mesh(geo, mat);
    this._scene.add(plane);
  }

  this._camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);
  this._camera.position.z = 30;

  this._prof = new Profiler();
};

GfxProfiler.prototype.run = function() {

  for (var i = 0; i < 100; ++i) {
    this._prof.start();
    this._renderer.render(this._scene, this._camera, this._target);
    this._prof.end();
  }

};

GfxProfiler.prototype.runOnTicks = function(maxResults, skipMs, timeLimitMs) {

  var self = this;

  if (typeof maxResults === 'undefined') {
    maxResults = 50;
  }

  if (typeof skipMs === 'undefined') {
    skipMs = 1000.0;
  }

  if (typeof timeLimitMs === 'undefined') {
    timeLimitMs = 10000.0;
  }

  var count = -1;
  var startTime = this._prof.now();

  return new Promise(function(resolve) {

    function onTick() {

      self._renderer.render(self._scene, self._camera);

      var elapsedMs = self._prof.now() - startTime;

      // we're skipping some frames to get more stable FPS
      if (elapsedMs > skipMs) {
        self._prof.end();
        self._prof.start();
        ++count;
      }

      if (elapsedMs > timeLimitMs || count === maxResults) {
        resolve(Math.max(count, 0));
      } else {
        requestAnimationFrame(onTick);
      }
    }

    requestAnimationFrame(onTick);
  });
};


GfxProfiler.prototype.mean = function() {
  return this._prof ? this._prof.rawMean() : 0.0;
};

GfxProfiler.prototype.min = function() {
  return this._prof ? this._prof.min() : 0.0;
};

export default GfxProfiler;

