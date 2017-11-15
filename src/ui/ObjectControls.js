

//////////////////////////////////////////////////////////////////////////////
/* eslint-disable no-magic-numbers */ // FIXME: Remove this?
/* eslint-disable guard-for-in */ // FIXME: Remove this?
import * as THREE from 'three';
import utils from '../utils';
import settings from '../settings';
import EventDispatcher from '../utils/EventDispatcher';

var VK_LEFT = 37;
var VK_UP = 38;
var VK_RIGHT = 39;
var VK_DOWN = 40;

var STATE = {
  NONE: -1, ROTATE: 0, TRANSLATE: 1, SCALE_PAN: 2, TRANSLATE_PIVOT: 3
};

// pausing for this amount of time before releasing mouse button prevents inertial rotation (seconds)
var FULL_STOP_THRESHOLD = 0.1;

var PAN_SPEED = 10.0;
var PINCH_PAN_COEF = 0.1;

// pivot -- local offset of the rotation pivot point
function ObjectHandler(objects, camera, pivot, options) {

  this.objects = objects;
  this.object = objects[0];
  this.camera = camera;
  this.pivot = pivot;
  this.axis = new THREE.Vector3(0, 0, 1);
  this.options = options;

  this.lastRotation = {
    axis: new THREE.Vector3(),
    angle: 0.0
  };
}

ObjectHandler.prototype._rotate = function(quaternion) {

  var zeroPivot = (this.pivot.x === 0.0 && this.pivot.y === 0.0 && this.pivot.z === 0.0);

  var m = this.object.matrix.clone();

  if (zeroPivot) {
    m.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
  } else {
    m.multiply(new THREE.Matrix4().makeTranslation(this.pivot.x, this.pivot.y, this.pivot.z));
    m.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
    m.multiply(new THREE.Matrix4().makeTranslation(-this.pivot.x, -this.pivot.y, -this.pivot.z));
  }

  var p = new THREE.Vector3();
  var q = new THREE.Quaternion();
  var s = new THREE.Vector3();
  m.decompose(p, q, s);

  // update objects
  if (!zeroPivot) {
    for (var i = 0; i < this.objects.length; ++i) {
      this.objects[i].position.copy(p);
    }
  }

  for (var j = 0; j < this.objects.length; ++j) {
    this.objects[j].quaternion.copy(q);
    this.objects[j].updateMatrix();
  }
};

ObjectHandler.prototype.setObjects = function(objects) {
  this.objects = objects;
  this.object = objects[0];
};

ObjectHandler.prototype.rotate = function(mousePrevPos, mouseCurPos, aboutAxis) {

  var rot = this.mouse2rotation(mousePrevPos, mouseCurPos, aboutAxis);

  if (rot.angle) {
    this._rotate(new THREE.Quaternion().setFromAxisAngle(rot.axis, rot.angle));
  }

  this.lastRotation = rot;
};

ObjectHandler.prototype.translate = function(delta) {
  // reverse-project viewport movement to view coords (compensate for screen aspect ratio)
  var d = new THREE.Vector3(
    delta.x / this.camera.projectionMatrix.elements[0],
    delta.y / this.camera.projectionMatrix.elements[5], 0
  );
  var dist = d.length();
  d.normalize();

  // transform movement direction to object local coords
  var invWorldMat = new THREE.Matrix4().getInverse(this.object.matrixWorld);
  d.transformDirection(invWorldMat);

  // visible translate distance shouldn't depend on camera-to-object distance
  var pivot = this.pivot.clone();
  this.object.localToWorld(pivot);
  dist *= Math.abs(pivot.z - this.camera.position.z);

  // visible translate distance shouldn't depend on object scale
  dist /= this.object.matrixWorld.getMaxScaleOnAxis();

  // all objects are translated similar to principal object
  // (we assume they all have identical pivot and scale)
  for (var i = 0; i < this.objects.length; ++i) {
    this.objects[i].translateOnAxis(d, dist);
  }
};

ObjectHandler.prototype.update = function(timeSinceLastUpdate, timeSinceMove) {

  if (settings.now.autoRotation !== 0.0) {
    // auto-rotation with constant speed
    var axis;

    // if rotation axis is fixed or hasn't been defined yet
    if (settings.now.autoRotationAxisFixed || this.lastRotation.axis.length() === 0.0) {
      // use Y-axis (transformed to local object coords)
      var invM = new THREE.Matrix4().getInverse(this.object.matrixWorld);
      axis = new THREE.Vector3(0, 1, 0).transformDirection(invM);
    } else {
      // use axis defined by last user rotation
      axis = this.lastRotation.axis;
    }

    this._rotate(new THREE.Quaternion().setFromAxisAngle(axis, settings.now.autoRotation * timeSinceLastUpdate));
    return true;
  }

  if (this.options.intertia && this.lastRotation.angle) {

    // inertial object rotation
    var angle = this.lastRotation.angle * Math.pow(1.0 - this.options.dynamicDampingFactor, 40.0 * timeSinceMove);

    if (Math.abs(angle) <= this.options.intertiaThreshold) {
      this.lastRotation.angle = 0.0;
    } else {
      this._rotate(new THREE.Quaternion().setFromAxisAngle(this.lastRotation.axis, angle));
      return true;
    }
  }

  return false;
};

ObjectHandler.prototype.stop = function() {
  this.lastRotation.angle = 0.0;
};

// calculate (axis, angle) pair from mouse/touch movement
ObjectHandler.prototype.mouse2rotation = function(mousePrev, mouseCur, aboutAxis) {

  var res = {
    axis: new THREE.Vector3(),
    angle: 0.0
  };

  if (aboutAxis) {
    res.axis.copy(this.axis);
    res.angle = this.options.axisRotateFactor * (mouseCur.y - mousePrev.y);

    /* cool method that allows rotation around Z axis to be "tied" to mouse cursor

      res.axis.copy(this.axis);

      var pivot = this.pivot.clone();
      this.object.localToWorld(pivot);
      pivot.project(this.camera);

      var v1 = new THREE.Vector3(mousePrev.x, mousePrev.y, this.camera.position.z);
      v1.sub(pivot);
      var v2 = new THREE.Vector3(mouseCur.x, mouseCur.y, this.camera.position.z);
      v2.sub(pivot);

      v1.sub(res.axis.clone().multiplyScalar(v1.dot(res.axis)));
      v2.sub(res.axis.clone().multiplyScalar(v2.dot(res.axis)));

      var abs = v1.length() * v2.length();
      if (abs > 0) {
        res.angle = res.axis.dot(v1.cross(v2)) / abs;
      }
    */
  } else {
    var mouseDelta = mouseCur.clone().sub(mousePrev);
    var angle = mouseDelta.length();
    if (angle === 0.0) {
      return res;
    }

    var center = this.pivot.clone();
    this.object.localToWorld(center);
    var eye = new THREE.Vector3().subVectors(this.camera.position, center);
    var eyeDirection = eye.clone().normalize();

    var cameraUpDirection = this.camera.up.clone().normalize();
    var cameraSidewaysDirection = new THREE.Vector3().crossVectors(cameraUpDirection, eyeDirection).normalize();

    cameraUpDirection.setLength(mouseDelta.y);
    cameraSidewaysDirection.setLength(mouseDelta.x);

    var moveDirection = new THREE.Vector3().copy(cameraUpDirection.add(cameraSidewaysDirection));

    res.axis.crossVectors(moveDirection, eye);

    res.angle = -angle * this.options.rotateFactor;
  }

  var invWorldMat = new THREE.Matrix4().getInverse(this.object.matrixWorld);
  res.axis.transformDirection(invWorldMat);

  // make sure angle is always positive (thus 'axis' defines both axis and direction of rotation)
  if (res.angle < 0.0) {
    res.axis.negate();
    res.angle = -res.angle;
  }

  return res;
};

function ObjectControls(object, objectPivot, camera, domElement, getAltObj) {
  EventDispatcher.call(this);
  var self = this;

  this.object = object;
  this.objectPivot = objectPivot;
  this.camera = camera;
  this.domElement = (typeof domElement !== 'undefined') ? domElement : document;
  this.getAltObj = getAltObj;

  // API

  this.enabled = true;
  this.hotkeysEnabled = true;

  this.screen = {
    left: 0, top: 0, width: 0, height: 0
  };

  this.options = {
    rotateFactor: Math.PI, // full screen slide (along short side) would roughly mean 180 deg. rotation
    axisRotateFactor: 4 * Math.PI, // full screen slide (along short side) would roughly mean 720 deg. rotation
    intertia: true,
    dynamicDampingFactor: 0.1,
    intertiaThreshold: 1e-3
  };

  // internals

  this._state = STATE.NONE;

  this._mousePrevPos = new THREE.Vector2();
  this._mouseCurPos = new THREE.Vector2();

  this._originalCameraPos = new THREE.Vector3();

  this._mainObj = new ObjectHandler([this.object], this.camera, new THREE.Vector3(0, 0, 0), this.options);
  this._altObj = new ObjectHandler([this.object], this.camera, new THREE.Vector3(0, 0, 0), this.options);
  this._affectedObj = this._mainObj;
  this._isAltObjFreeRotationAllowed = true;
  this._isTranslationAllowed = true;
  this._isKeysTranslatingObj = false;

  this._pressedKeys = [];

  this._clock = new utils.Timer();
  this._clock.start();
  this._lastUpdateTime = this._clock.getElapsedTime();

  // events
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
      type: 'mousewheel',
      handler: function(e) {
        self.mousewheel(e);
      }
    },
    {
      obj: self.domElement,
      type: 'DOMMouseScroll',
      handler: function(e) {
        self.mousewheel(e);
      }
    },
    {
      obj: self.domElement,
      type: 'mouseout',
      handler: function(e) {
        self.mouseup(e);
      }
    },
    {
      obj: self.domElement,
      type: 'touchstart',
      handler: function(e) {
        self.touchstartend(e);
      }
    },
    {
      obj: self.domElement,
      type: 'touchend',
      handler: function(e) {
        self.touchstartend(e);
      }
    },
    {
      obj: self.domElement,
      type: 'touchmove',
      handler: function(e) {
        self.touchmove(e);
      }
    },
    {
      obj: self.getKeyBindObject(),
      type: 'keydown',
      handler: function(e) {
        self.keydownup(e);
      }
    },
    {
      obj: self.getKeyBindObject(),
      type: 'keyup',
      handler: function(e) {
        self.keydownup(e);
      }
    },
    {
      obj: window,
      type: 'resize',
      handler: function() {
        self.handleResize();
      }
    },
    {
      obj: window,
      type: 'blur',
      handler: function() {
        self.resetKeys();
      }
    },
    {
      obj: self.domElement,
      type: 'contextmenu',
      handler: function(e) {
        self.contextmenu(e);
      }
    }];

  for (var i = 0; i < this._listeners.length; i++) {
    var l = this._listeners[i];
    l.obj.addEventListener(l.type, l.handler);
  }

  this.handleResize();

  this.resetKeys();

  // force an update at start
  this.update();
}

// methods

ObjectControls.prototype = Object.create(EventDispatcher.prototype);
ObjectControls.prototype.constructor = ObjectControls;

ObjectControls.prototype.resetKeys = function() {
  this._pressedKeys[VK_LEFT] = false;
  this._pressedKeys[VK_UP] = false;
  this._pressedKeys[VK_RIGHT] = false;
  this._pressedKeys[VK_DOWN] = false;
};

ObjectControls.prototype.contextmenu = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

ObjectControls.prototype.handleResize = function() {

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

ObjectControls.prototype.enable = function(enable) {
  this.enabled = enable;
};

ObjectControls.prototype.enableHotkeys = function(enable) {
  this.hotkeysEnabled = enable;
};

ObjectControls.prototype.allowTranslation = function(allow) {
  this._isTranslationAllowed = allow;
};

ObjectControls.prototype.allowAltObjFreeRotation = function(allow) {
  this._isAltObjFreeRotationAllowed = allow;
};

ObjectControls.prototype.keysTranslateObj = function(on) {
  this._isKeysTranslatingObj = on;
};

ObjectControls.prototype.isEditingAltObj = function() {
  return ((this._state === STATE.ROTATE) || (this._state === STATE.TRANSLATE)) &&
            (this._affectedObj === this._altObj);
};

// convert page coords of mouse/touch to uniform coords with smaller side being [-0.5, 0.5]
// (uniform coords keep direct proportion with screen distance travelled by mouse regardless of screen aspect ratio)
ObjectControls.prototype.getMouseOnCircle = function(pageX, pageY) {

  var screenSize = Math.min(this.screen.width, this.screen.height);

  if (screenSize === 0) {
    return new THREE.Vector2(0, 0);
  }

  return new THREE.Vector2(
    ((pageX - this.screen.width * 0.5 - this.screen.left) / screenSize),
    ((0.5 * this.screen.height + this.screen.top - pageY) / screenSize)
  );

};

// convert page coords of mouse/touch to viewport coords with both sides being [-1, 1]
// (those are non-uniform coords affected by screen aspect ratio)
ObjectControls.prototype.getMouseViewport = function(pageX, pageY) {

  if (this.screen.width === 0 || this.screen.height === 0) {
    return new THREE.Vector2(0, 0);
  }

  return new THREE.Vector2(
    (2.0 * (pageX - this.screen.width * 0.5 - this.screen.left) / this.screen.width),
    (2.0 * (0.5 * this.screen.height + this.screen.top - pageY) / this.screen.height)
  );

};

ObjectControls.prototype.stop = function() {
  this._mainObj.stop();
  this._altObj.stop();
};

// rotate object based on latest mouse/touch movement
ObjectControls.prototype.rotateByMouse = function(aboutZAxis) {

  this._affectedObj.rotate(this._mousePrevPos, this._mouseCurPos, aboutZAxis);
  this.dispatchEvent({type: 'change', action: 'rotate', angle: this._affectedObj.lastRotation.angle});
};

// rotate object by specified quaternion
ObjectControls.prototype.rotate = function(quat) {

  this.object.quaternion.multiply(quat);
};

// get object's orientation
ObjectControls.prototype.getOrientation = function() {

  return this.object.quaternion;
};

// set object's orientation
ObjectControls.prototype.setOrientation = function(quat) {

  this.object.quaternion.copy(quat);
};

// translate object based on latest mouse/touch movement
ObjectControls.prototype.translate = function() {

  var delta = this._mouseCurPos.clone();
  delta.sub(this._mousePrevPos);
  this._affectedObj.translate(delta);
  this.dispatchEvent({type: 'change', action: 'translate'});
};

// get object scale
ObjectControls.prototype.getScale = function() {
  return this.object.scale.x;
};

// set uniform object scale
ObjectControls.prototype.setScale = function(scale) {
  this.object.scale.set(scale, scale, scale);
};

// scale object by factor
ObjectControls.prototype.scale = function(factor) {
  this.setScale(this.object.scale.x * factor);
};

ObjectControls.prototype.update = function() {

  var curTime = this._clock.getElapsedTime();
  var timeSinceLastUpdate = curTime - this._lastUpdateTime;

  // update object handler
  if (this._state === STATE.NONE) {
    var timeSinceMove = curTime - this._lastMouseMoveTime;
    if (this._mainObj.update(timeSinceLastUpdate, timeSinceMove) ||
          this._altObj.update(timeSinceLastUpdate, timeSinceMove)) {
      this.dispatchEvent({type: 'change', action: 'auto'});
    }
  }

  // apply arrow keys
  if (settings.now.panning || this._isKeysTranslatingObj) {
    var speedX = Number(this._pressedKeys[VK_RIGHT]) - Number(this._pressedKeys[VK_LEFT]);
    var speedY = Number(this._pressedKeys[VK_UP]) - Number(this._pressedKeys[VK_DOWN]);
    if (speedX !== 0.0 || speedY !== 0.0) {
      var delta = timeSinceLastUpdate;

      if (this._isKeysTranslatingObj) {
        // update object translation
        var altObj = this.getAltObj();
        if (altObj.objects.length > 0) {
          this._altObj.setObjects(altObj.objects);
          this._altObj.pivot = altObj.pivot;

          if ('axis' in altObj) {
            this._altObj.axis = altObj.axis.clone();
          } else {
            this._altObj.axis.set(0, 0, 1);
          }

          this._altObj.translate(new THREE.Vector2(delta * speedX, delta * speedY));
          this.dispatchEvent({type: 'change', action: 'translate'});
        }
      } else {
        // update camera panning
        // @deprecated
        delta *= PAN_SPEED * (settings.now.inversePanning ? -1 : 1);
        this.camera.translateX(delta * speedX);
        this.camera.translateY(delta * speedY);
        this.dispatchEvent({type: 'change', action: 'pan'});
      }
    }
  }

  this._lastUpdateTime = curTime;
};

ObjectControls.prototype.reset = function() {

  this._state = STATE.NONE;

  this.object.quaternion.copy(new THREE.Quaternion(0, 0, 0, 1));

};

// listeners

ObjectControls.prototype.mousedown = function(event) {

  if (this.enabled === false || this._state !== STATE.NONE) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (this._state === STATE.NONE) {
    if (event.button === 0) {
      this._affectedObj.stop(); // can edit only one object at a time

      var workWithAltObj = false;

      if (event.altKey) {
        var altObj = this.getAltObj();
        workWithAltObj = (altObj.objects.length > 0);
        if (workWithAltObj) {
          this._altObj.setObjects(altObj.objects);
          this._altObj.pivot = altObj.pivot;

          if ('axis' in altObj) {
            this._altObj.axis = altObj.axis.clone();
          } else {
            this._altObj.axis.set(0, 0, 1);
          }
        }
      }

      this._affectedObj = workWithAltObj ? this._altObj : this._mainObj;

      this._state = (workWithAltObj && event.ctrlKey && this._isTranslationAllowed) ? STATE.TRANSLATE : STATE.ROTATE;
    } else if (event.button === 2) {
      this._state = STATE.TRANSLATE_PIVOT;
    }
  }

  if (this._state === STATE.ROTATE) {
    this._mouseCurPos.copy(this.getMouseOnCircle(event.pageX, event.pageY));
    this._mousePrevPos.copy(this._mouseCurPos);
  }

  if (this._state === STATE.TRANSLATE || this._state === STATE.TRANSLATE_PIVOT) {
    this._mouseCurPos.copy(this.getMouseViewport(event.pageX, event.pageY));
    this._mousePrevPos.copy(this._mouseCurPos);
  }
};

ObjectControls.prototype.mousemove = function(event) {

  if (this.enabled === false || this._state === STATE.NONE) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  switch (this._state) {
  case STATE.ROTATE:
    this._mousePrevPos.copy(this._mouseCurPos);
    this._mouseCurPos.copy(this.getMouseOnCircle(event.pageX, event.pageY));
    this.rotateByMouse((event.altKey && !this._isAltObjFreeRotationAllowed) || event.shiftKey);
    this._lastMouseMoveTime = this._clock.getElapsedTime();
    break;

  case STATE.TRANSLATE:
    this._mousePrevPos.copy(this._mouseCurPos);
    this._mouseCurPos.copy(this.getMouseViewport(event.pageX, event.pageY));
    this.translate();
    break;

  case STATE.TRANSLATE_PIVOT:
    this._mousePrevPos.copy(this._mouseCurPos);
    this._mouseCurPos.copy(this.getMouseViewport(event.pageX, event.pageY));
    this.translatePivotByMouse();
    break;

  default: break;
  }

};

ObjectControls.prototype.mousewheel = function(event) {

  if (this.enabled === false || !settings.now.zooming || this._state !== STATE.NONE || event.shiftKey) {
    return;
  }

  event.preventDefault();

  var delta = 0;

  if (event.wheelDelta) {
    // WebKit / Opera / Explorer 9
    delta = event.wheelDelta / 40;
  } else if (event.detail) {
    // Firefox
    delta = -event.detail / 3;
  }

  var factor = 1.0 + delta * 0.05;
  this.scale(factor);

  this.dispatchEvent({type: 'change', action: 'zoom', factor: factor});
};

ObjectControls.prototype.mouseup = function(event) {

  if (this.enabled === false || this._state === STATE.NONE) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  this._state = STATE.NONE;

  if (this._clock.getElapsedTime() - this._lastMouseMoveTime > FULL_STOP_THRESHOLD) {
    this._affectedObj.stop();
  }

};

ObjectControls.prototype.touchstartend = function(event) {

  if (this.enabled === false) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  switch (event.touches.length) {
  case 1:
    this._state = STATE.ROTATE;
    this._mouseCurPos.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
    this._mousePrevPos.copy(this._mouseCurPos);
    break;

  case 2:
    // prevent inertial rotation
    this._mainObj.stop();
    this._altObj.stop();

    this._state = STATE.SCALE_PAN;
    var dx = event.touches[0].pageX - event.touches[1].pageX;
    var dy = event.touches[0].pageY - event.touches[1].pageY;
    this._touchDistanceCur = this._touchDistanceStart = Math.sqrt(dx * dx + dy * dy);
    this._scaleStart = this.object.scale.x;
    this._originalPinchCenter = new THREE.Vector2(
      0.5 * (event.touches[0].pageX + event.touches[1].pageX),
      0.5 * (event.touches[0].pageY + event.touches[1].pageY)
    );
    this._originalCameraPos.copy(this.camera.position);
    break;

  default:
    this._state = STATE.NONE;
  }

};

ObjectControls.prototype.touchmove = function(event) {

  if (this.enabled === false || this._state === STATE.NONE) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  switch (this._state) {
  case STATE.ROTATE:
    this._mousePrevPos.copy(this._mouseCurPos);
    this._mouseCurPos.copy(this.getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
    this.rotateByMouse(false);

    this._lastMouseMoveTime = this._clock.getElapsedTime();
    break;

  case STATE.SCALE_PAN:
    if (settings.now.zooming) {
      // update scale
      var dx = event.touches[0].pageX - event.touches[1].pageX;
      var dy = event.touches[0].pageY - event.touches[1].pageY;
      this._touchDistanceCur = Math.sqrt(dx * dx + dy * dy);
      var oldScale = this.object.scale.x;
      var newScale = this._scaleStart * this._touchDistanceCur / this._touchDistanceStart;
      this.setScale(newScale);
      this.dispatchEvent({type: 'change', action: 'zoom', factor: (oldScale === 0.0) ? 1.0 : newScale / oldScale});
    }

    // @deprecated: Move object instead of panning the camera
    if (settings.now.panning) {
      // update camera panning
      var delta = new THREE.Vector2(
        0.5 * (event.touches[0].pageX + event.touches[1].pageX),
        0.5 * (event.touches[0].pageY + event.touches[1].pageY)
      );
      delta.sub(this._originalPinchCenter);
      this.camera.position.x = this._originalCameraPos.x - PINCH_PAN_COEF * delta.x;
      this.camera.position.y = this._originalCameraPos.y + PINCH_PAN_COEF * delta.y;
      this.dispatchEvent({type: 'change', action: 'pan'});
    }
    break;

  default:
  }

};

ObjectControls.prototype.keydownup = function(event) {

  if (this.enabled === false || this.hotkeysEnabled === false) {
    return;
  }

  switch (event.keyCode) {
  case VK_LEFT:
  case VK_UP:
  case VK_RIGHT:
  case VK_DOWN:
    this._pressedKeys[event.keyCode] = (event.type === 'keydown');
    event.preventDefault();
    event.stopPropagation();
    break;
  default:
  }
};

ObjectControls.prototype.getKeyBindObject = function() {
  return window.top;
};


ObjectControls.prototype.dispose = function() {

  for (var i = 0; i < this._listeners.length; i++) {
    var l = this._listeners[i];
    l.obj.removeEventListener(l.type, l.handler);
  }

};

ObjectControls.prototype.translatePivotByMouse  = function() {

  var delta = this._mouseCurPos.clone();
  delta.sub(this._mousePrevPos);
  this.translatePivotInWorld(settings.now.translationSpeed * delta.x, settings.now.translationSpeed * delta.y, 0);
};

// Translate in WorldCS, translation is scaled with root scale matrix
ObjectControls.prototype.translatePivotInWorld  = function(x, y, z) {

  var pos = this.objectPivot.position;
  pos.applyMatrix4(this.object.matrixWorld);
  pos.setX(pos.x + x);
  pos.setY(pos.y + y);
  pos.setZ(pos.z + z);
  var invWorldMat = new THREE.Matrix4().getInverse(this.object.matrixWorld);
  pos.applyMatrix4(invWorldMat);

  this.dispatchEvent({type: 'change'});
};

// Translate in ModelCS, x, y, z are Ang
ObjectControls.prototype.translatePivot  = function(x, y, z) {

  var pos = this.objectPivot.position;
  pos.setX(pos.x + x);
  pos.setY(pos.y + y);
  pos.setZ(pos.z + z);

  this.dispatchEvent({type: 'change'});
};

export default ObjectControls;

