import * as THREE from 'three';
import settings from '../settings';
import Timer from '../Timer';
import EventDispatcher from '../utils/EventDispatcher';

function Picker(gfxObj, camera, domElement) {
  EventDispatcher.call(this);
  const self = this;

  this.gfxObj = gfxObj;
  this.camera = camera;
  this.domElement = (typeof domElement !== 'undefined') ? domElement : document;
  this.screen = {
    left: 0, top: 0, width: 0, height: 0,
  };
  this._lastMousePos = new THREE.Vector2(0, 0);
  this._mouseTotalDist = 0.0;
  this._lastClickBeginTime = -1000.0;
  this._lastClickPos = new THREE.Vector2(0, 0);
  this._clickBeginTime = 0.0;

  this._clock = new Timer();
  this._clock.start();

  this._listeners = [
    {
      obj: self.domElement,
      type: 'mousedown',
      handler(e) {
        self.mousedown(e);
      },
    },
    {
      obj: self.domElement,
      type: 'mouseup',
      handler(e) {
        self.mouseup(e);
      },
    },
    {
      obj: self.domElement,
      type: 'mousemove',
      handler(e) {
        self.mousemove(e);
      },
    },
    {
      obj: self.domElement,
      type: 'touchstart',
      handler(e) {
        self.touchstart(e);
      },
    },
    {
      obj: self.domElement,
      type: 'touchend',
      handler(e) {
        self.touchend(e);
      },
    },
    {
      obj: window,
      type: 'resize',
      handler() {
        self.handleResize();
      },
    }];

  for (let i = 0; i < this._listeners.length; i++) {
    const l = this._listeners[i];
    l.obj.addEventListener(l.type, l.handler);
  }

  this.handleResize();
}

Picker.prototype = Object.create(EventDispatcher.prototype);
Picker.prototype.constructor = Picker;

Picker.prototype.reset = function () {
  this.picked = {};
  this.dispatchEvent({ type: 'newpick', obj: {} });
};

Picker.prototype.handleResize = function () {
  if (this.domElement === document) {
    this.screen.left = 0;
    this.screen.top = 0;
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  } else {
    const box = this.domElement.getBoundingClientRect();
    // adjustments come from similar code in the jquery offset() function
    const d = this.domElement.ownerDocument.documentElement;
    this.screen.left = box.left + window.pageXOffset - d.clientLeft;
    this.screen.top = box.top + window.pageYOffset - d.clientTop;
    this.screen.width = box.width;
    this.screen.height = box.height;
  }
};

Picker.prototype.pickObject = function (screenPos) {
  if (!this.gfxObj) {
    this.picked = {};
    this.dispatchEvent({ type: 'newpick', obj: {} });
    return;
  }

  const { gfxObj } = this;
  const rayCaster = new THREE.Raycaster();
  rayCaster.ray.origin.setFromMatrixPosition(this.camera.matrixWorld);
  rayCaster.ray.direction.set(screenPos.x, screenPos.y, 0.5).unproject(this.camera).sub(rayCaster.ray.origin).normalize();

  const clipPlane = (settings.now.draft.clipPlane && this.clipPlaneValue) ? this.clipPlaneValue : Infinity;
  const fogFarPlane = (settings.now.fog && this.fogFarValue) ? this.fogFarValue : Infinity;
  const point = rayCaster.intersectVisibleObject(gfxObj, this.camera, clipPlane, fogFarPlane);
  if (!point) {
    this.picked = {};
    this.dispatchEvent({ type: 'newpick', obj: {} });
    return;
  }

  let picked = {};
  if (point.residue || point.atom) {
    const residue = point.residue || point.atom.residue;
    if (settings.now.pick === 'chain') {
      picked = { chain: residue.getChain() };
    } else if (settings.now.pick === 'molecule') {
      picked = { molecule: residue.getMolecule() };
    } else if (point.residue || settings.now.pick === 'residue') {
      picked = { residue };
    } else if (point.atom) {
      picked = { atom: point.atom };
    }
  }
  this.picked = picked;
  this.dispatchEvent({ type: 'newpick', obj: picked });
};

Picker.prototype.getMouseInViewport = function (pageX, pageY) {
  return new THREE.Vector2(
    (pageX - this.screen.left) / this.screen.width * 2 - 1,
    -(pageY - this.screen.top) / this.screen.height * 2 + 1,
  );
};

Picker.prototype.mousedown = function (event) {
  event.preventDefault();
  event.stopPropagation();

  if (event.button === 0) {
    this._lastMousePos = this.getMouseInViewport(event.pageX, event.pageY);
    this._mouseTotalDist = 0.0;
    this._clickBeginTime = this._clock.getElapsedTime();
  }
};

Picker.prototype.mousemove = function (event) {
  event.preventDefault();
  event.stopPropagation();

  const pos = this.getMouseInViewport(event.pageX, event.pageY);
  this._mouseTotalDist += pos.sub(this._lastMousePos).length();
};

Picker.prototype.mouseup = function (event) {
  const self = this;

  event.preventDefault();
  event.stopPropagation();

  if (event.button === 0) {
    if (this._mouseTotalDist < 0.01) {
      const curTime = this._clock.getElapsedTime();
      const curPos = this.getMouseInViewport(event.pageX, event.pageY);

      const timeSinceLastClickBegin = curTime - this._lastClickBeginTime;
      if (timeSinceLastClickBegin < 0.7) {
        const clickDist = new THREE.Vector2().subVectors(curPos, this._lastClickPos);
        if (clickDist.length() < 0.01) {
          // it's a double click
          this.dispatchEvent({ type: 'dblclick', obj: this.picked });

          this._lastClickPos = curPos;
          this._lastClickBeginTime = -1000; // this click cannot serve as first click in double-click
          return;
        }
      }

      setTimeout(() => {
        self.pickObject(curPos);
      }, 0);

      this._lastClickPos = curPos;
      this._lastClickBeginTime = this._clickBeginTime;
    }
  }
};

Picker.prototype.touchstart = function (event) {
  event.preventDefault();
  event.stopPropagation();

  if (event.touches.length === 1) {
    this._lastTouchdownPos = this.getMouseInViewport(event.touches[0].pageX, event.touches[0].pageY);
  }
};

Picker.prototype.touchend = function (event) {
  const self = this;

  event.preventDefault();
  event.stopPropagation();

  if (event.touches.length === 0
        && event.changedTouches.length === 1) {
    const pos = this.getMouseInViewport(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    const dist = pos.sub(this._lastTouchdownPos).length();
    if (dist < 0.01) {
      setTimeout(() => {
        self.pickObject(self._lastTouchdownPos);
      }, 0);
    }
  }
};

Picker.prototype.dispose = function () {
  for (let i = 0; i < this._listeners.length; i++) {
    const l = this._listeners[i];
    l.obj.removeEventListener(l.type, l.handler);
  }
};

export default Picker;
