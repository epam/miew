

//////////////////////////////////////////////////////////////////////////////
/* eslint-disable no-magic-numbers */ // FIXME: Remove this?
/* eslint-disable guard-for-in */ // FIXME: Remove this?
import * as THREE from 'three';
import settings from '../settings';
import utils from '../utils';
import EventDispatcher from '../utils/EventDispatcher';

function Picker(gfxObj, camera, domElement) {
  EventDispatcher.call(this);
  var self = this;

  this.gfxObj = gfxObj;
  this.camera = camera;
  this.domElement = (typeof domElement !== 'undefined') ? domElement : document;
  this.screen = {
    left: 0, top: 0, width: 0, height: 0
  };
  this._lastMousePos = new THREE.Vector2(0, 0);
  this._mouseTotalDist = 0.0;
  this._lastClickBeginTime = -1000.0;
  this._lastClickPos = new THREE.Vector2(0, 0);
  this._clickBeginTime = 0.0;

  this._clock = new utils.Timer();
  this._clock.start();

  this._listeners = [
    {
      obj: self.domElement,
      type: 'mousedown',
      handler: function(e) {
        self.mousedown(e);
      }
    },
    {
      obj: self.domElement,
      type: 'mouseup',
      handler: function(e) {
        self.mouseup(e);
      }
    },
    {
      obj: self.domElement,
      type: 'mousemove',
      handler: function(e) {
        self.mousemove(e);
      }
    },
    {
      obj: self.domElement,
      type: 'touchstart',
      handler: function(e) {
        self.touchstart(e);
      }
    },
    {
      obj: self.domElement,
      type: 'touchend',
      handler: function(e) {
        self.touchend(e);
      }
    },
    {
      obj: window,
      type: 'resize',
      handler: function() {
        self.handleResize();
      }
    }];

  for (var i = 0; i < this._listeners.length; i++) {
    var l = this._listeners[i];
    l.obj.addEventListener(l.type, l.handler);
  }

  this.handleResize();
}

Picker.prototype = Object.create(EventDispatcher.prototype);
Picker.prototype.constructor = Picker;

Picker.prototype.reset = function() {
  this.picked = {};
  this.dispatchEvent({type: 'newpick', obj: {}});
};

Picker.prototype.handleResize = function() {

  if (this.domElement === document) {

    this.screen.left = 0;
    this.screen.top = 0;
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;

  } else {

    var box = this.domElement.getBoundingClientRect();
    // adjustments come from similar code in the jquery offset() function
    var d = this.domElement.ownerDocument.documentElement;
    this.screen.left = box.left + window.pageXOffset - d.clientLeft;
    this.screen.top = box.top + window.pageYOffset - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;

  }

};

Picker.prototype.pickObject = function(screenPos) {

  var picked = {};
  var gfxObj = this.gfxObj;
  var intersects;
  if (gfxObj) {
    var rayCaster = new THREE.Raycaster();
    rayCaster.setFromCamera(screenPos, this.camera);
    intersects = rayCaster.intersectObject(gfxObj, false);
    if (intersects.length > 0) {
      var p = intersects[0];
      var v = new THREE.Vector3();

      if (settings.now.draft.clipPlane && this.hasOwnProperty('clipPlaneValue')) {
        // find point closest to camera that doesn't get clipped
        var i;
        for (i = 0; i < intersects.length; ++i) {
          p = intersects[i];
          v.copy(p.point);
          v.applyMatrix4(this.camera.matrixWorldInverse);
          if (v.z <= -this.clipPlaneValue) {
            break;
          }
        }

        if (i === intersects.length) {
          p = null;
        }
      }

      if (p != null && settings.now.fog && this.hasOwnProperty('fogFarValue')) {
        // check that selected intersection point is not occluded by fog
        v.copy(p.point);
        v.applyMatrix4(this.camera.matrixWorldInverse);
        if (v.z <= -this.fogFarValue) {
          p = null;
        }
      }

      if (p != null && (p.residue || p.atom)) {
        var residue = p.residue || p.atom.getResidue();
        if (settings.now.pick === 'chain') {
          picked = {chain: residue.getChain()};
        } else if (settings.now.pick === 'molecule') {
          picked = {molecule: residue.getMolecule()};
        } else if (p.residue || settings.now.pick === 'residue') {
          picked = {residue: residue};
        } else if (p.atom) {
          picked = {atom: p.atom};
        }
      }
    }
  }
  this.picked = picked;

  this.dispatchEvent({type: 'newpick', obj: picked});

};

Picker.prototype.getMouseInViewport = function(pageX, pageY) {
  return new THREE.Vector2(
    (pageX - this.screen.left) / this.screen.width * 2 - 1,
    -(pageY - this.screen.top) / this.screen.height * 2 + 1
  );
};

Picker.prototype.mousedown = function(event) {

  event.preventDefault();
  event.stopPropagation();

  if (event.button === 0) {
    this._lastMousePos = this.getMouseInViewport(event.pageX, event.pageY);
    this._mouseTotalDist = 0.0;
    this._clickBeginTime = this._clock.getElapsedTime();
  }
};

Picker.prototype.mousemove = function(event) {

  event.preventDefault();
  event.stopPropagation();

  var pos = this.getMouseInViewport(event.pageX, event.pageY);
  this._mouseTotalDist += pos.sub(this._lastMousePos).length();

};

Picker.prototype.mouseup = function(event) {

  var self = this;

  event.preventDefault();
  event.stopPropagation();

  if (event.button === 0) {
    if (this._mouseTotalDist < 0.01) {
      var curTime = this._clock.getElapsedTime();
      var curPos = this.getMouseInViewport(event.pageX, event.pageY);

      var timeSinceLastClickBegin = curTime - this._lastClickBeginTime;
      if (timeSinceLastClickBegin < 0.7) {

        var clickDist = new THREE.Vector2().subVectors(curPos, this._lastClickPos);
        if (clickDist.length() < 0.01) {
          // it's a double click
          this.dispatchEvent({type: 'dblclick', obj: this.picked});

          this._lastClickPos = curPos;
          this._lastClickBeginTime = -1000; // this click cannot serve as first click in double-click
          return;
        }
      }

      setTimeout(function() {
        self.pickObject(curPos);
      }, 0);

      this._lastClickPos = curPos;
      this._lastClickBeginTime = this._clickBeginTime;
    }
  }
};

Picker.prototype.touchstart = function(event) {

  event.preventDefault();
  event.stopPropagation();

  if (event.touches.length === 1) {
    this._lastTouchdownPos = this.getMouseInViewport(event.touches[0].pageX, event.touches[0].pageY);
  }

};

Picker.prototype.touchend = function(event) {

  var self = this;

  event.preventDefault();
  event.stopPropagation();

  if (event.touches.length === 0 &&
        event.changedTouches.length === 1) {
    var pos = this.getMouseInViewport(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    var dist = pos.sub(this._lastTouchdownPos).length();
    if (dist < 0.01) {
      setTimeout(function() {
        self.pickObject(self._lastTouchdownPos);
      }, 0);
    }
  }

};

Picker.prototype.dispose = function() {

  for (var i = 0; i < this._listeners.length; i++) {
    var l = this._listeners[i];
    l.obj.removeEventListener(l.type, l.handler);
  }

};

export default Picker;

