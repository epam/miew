import * as THREE from 'three';
import Timer from '../Timer';
import settings from '../settings';
import EventDispatcher from '../utils/EventDispatcher';

const VK_LEFT = 37;
const VK_UP = 38;
const VK_RIGHT = 39;
const VK_DOWN = 40;

const STATE = {
  NONE: -1, ROTATE: 0, TRANSLATE: 1, SCALE: 2, TRANSLATE_PIVOT: 3,
};

// pausing for this amount of time before releasing mouse button prevents inertial rotation (seconds)
const FULL_STOP_THRESHOLD = 0.1;

// pivot -- local offset of the rotation pivot point
function ObjectHandler(objects, camera, pivot, options) {
  this.objects = objects;
  [this.object] = objects;
  this.camera = camera;
  this.pivot = pivot;
  this.axis = new THREE.Vector3(0, 0, 1);
  this.options = options;

  this.lastRotation = {
    axis: new THREE.Vector3(),
    angle: 0.0,
  };
}

ObjectHandler.prototype._rotate = function (quaternion) {
  const zeroPivot = (this.pivot.x === 0.0 && this.pivot.y === 0.0 && this.pivot.z === 0.0);

  const m = this.object.matrix.clone();

  if (zeroPivot) {
    m.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
  } else {
    m.multiply(new THREE.Matrix4().makeTranslation(this.pivot.x, this.pivot.y, this.pivot.z));
    m.multiply(new THREE.Matrix4().makeRotationFromQuaternion(quaternion));
    m.multiply(new THREE.Matrix4().makeTranslation(-this.pivot.x, -this.pivot.y, -this.pivot.z));
  }

  const p = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  m.decompose(p, q, s);

  // update objects
  if (!zeroPivot) {
    for (let i = 0; i < this.objects.length; ++i) {
      this.objects[i].position.copy(p);
    }
  }

  for (let j = 0; j < this.objects.length; ++j) {
    this.objects[j].quaternion.copy(q);
    this.objects[j].updateMatrix();
  }
};

ObjectHandler.prototype.setObjects = function (objects) {
  this.objects = objects;
  [this.object] = objects;
};

ObjectHandler.prototype.rotate = function (mousePrevPos, mouseCurPos, aboutAxis) {
  const rot = this.mouse2rotation(mousePrevPos, mouseCurPos, aboutAxis);

  if (rot.angle) {
    this._rotate(new THREE.Quaternion().setFromAxisAngle(rot.axis, rot.angle));
  }

  this.lastRotation = rot;
};

ObjectHandler.prototype.translate = function (delta) {
  // reverse-project viewport movement to view coords (compensate for screen aspect ratio)
  const d = new THREE.Vector3(
    delta.x / this.camera.projectionMatrix.elements[0],
    delta.y / this.camera.projectionMatrix.elements[5], 0,
  );
  let dist = d.length();
  d.normalize();

  // transform movement direction to object local coords
  const invWorldMat = new THREE.Matrix4().getInverse(this.object.matrixWorld);
  d.transformDirection(invWorldMat);

  // visible translate distance shouldn't depend on camera-to-object distance
  const pivot = this.pivot.clone();
  this.object.localToWorld(pivot);
  dist *= Math.abs(pivot.z - this.camera.position.z);

  // visible translate distance shouldn't depend on object scale
  dist /= this.object.matrixWorld.getMaxScaleOnAxis();

  // all objects are translated similar to principal object
  // (we assume they all have identical pivot and scale)
  for (let i = 0; i < this.objects.length; ++i) {
    this.objects[i].translateOnAxis(d, dist);
  }
};

ObjectHandler.prototype.update = function (timeSinceLastUpdate, timeSinceMove) {
  if (settings.now.autoRotation !== 0.0) {
    // auto-rotation with constant speed
    let axis;

    // if rotation axis is fixed or hasn't been defined yet
    if (settings.now.autoRotationAxisFixed || this.lastRotation.axis.length() === 0.0) {
      // use Y-axis (transformed to local object coords)
      const invM = new THREE.Matrix4().getInverse(this.object.matrixWorld);
      axis = new THREE.Vector3(0, 1, 0).transformDirection(invM);
    } else {
      // use axis defined by last user rotation
      ({ axis } = this.lastRotation);
    }

    this._rotate(new THREE.Quaternion().setFromAxisAngle(axis, settings.now.autoRotation * timeSinceLastUpdate));
    return true;
  }

  if (this.options.intertia && this.lastRotation.angle) {
    // inertial object rotation
    const angle = this.lastRotation.angle * ((1.0 - this.options.dynamicDampingFactor) ** (40.0 * timeSinceMove));

    if (Math.abs(angle) <= this.options.intertiaThreshold) {
      this.lastRotation.angle = 0.0;
    } else {
      this._rotate(new THREE.Quaternion().setFromAxisAngle(this.lastRotation.axis, angle));
      return true;
    }
  }

  return false;
};

ObjectHandler.prototype.stop = function () {
  this.lastRotation.angle = 0.0;
};

// calculate (axis, angle) pair from mouse/touch movement
ObjectHandler.prototype.mouse2rotation = function (mousePrev, mouseCur, aboutAxis) {
  const res = {
    axis: new THREE.Vector3(),
    angle: 0.0,
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
    const mouseDelta = mouseCur.clone().sub(mousePrev);
    const angle = mouseDelta.length();
    if (angle === 0.0) {
      return res;
    }

    const center = this.pivot.clone();
    this.object.localToWorld(center);
    const eye = new THREE.Vector3().subVectors(this.camera.position, center);
    const eyeDirection = eye.clone().normalize();

    const cameraUpDirection = this.camera.up.clone().normalize();
    const cameraSidewaysDirection = new THREE.Vector3().crossVectors(cameraUpDirection, eyeDirection).normalize();

    cameraUpDirection.setLength(mouseDelta.y);
    cameraSidewaysDirection.setLength(mouseDelta.x);

    const moveDirection = new THREE.Vector3().copy(cameraUpDirection.add(cameraSidewaysDirection));

    res.axis.crossVectors(moveDirection, eye);

    res.angle = -angle * this.options.rotateFactor;
  }

  const invWorldMat = new THREE.Matrix4().getInverse(this.object.matrixWorld);
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
  const self = this;

  this.object = object;
  this.objectPivot = objectPivot;
  this.camera = camera;
  this.domElement = (typeof domElement !== 'undefined') ? domElement : document;
  this.getAltObj = getAltObj;

  // API

  this.enabled = true;
  this.hotkeysEnabled = true;

  this.screen = {
    left: 0, top: 0, width: 0, height: 0,
  };

  this.options = {
    rotateFactor: Math.PI, // full screen slide (along short side) would roughly mean 180 deg. rotation
    axisRotateFactor: 4 * Math.PI, // full screen slide (along short side) would roughly mean 720 deg. rotation
    intertia: true,
    dynamicDampingFactor: 0.1,
    intertiaThreshold: 1e-3,
  };

  // internals

  this._state = STATE.NONE;

  this._mousePrevPos = new THREE.Vector2();
  this._mouseCurPos = new THREE.Vector2();

  this._mainObj = new ObjectHandler([this.object], this.camera, new THREE.Vector3(0, 0, 0), this.options);
  this._altObj = new ObjectHandler([this.object], this.camera, new THREE.Vector3(0, 0, 0), this.options);
  this._affectedObj = this._mainObj;
  this._isAltObjFreeRotationAllowed = true;
  this._isTranslationAllowed = true;
  this._isKeysTranslatingObj = false;

  this._pressedKeys = [];

  this._clock = new Timer();
  this._clock.start();
  this._lastUpdateTime = this._clock.getElapsedTime();

  // events
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
      type: 'mousewheel',
      handler(e) {
        self.mousewheel(e);
      },
    },
    {
      obj: self.domElement,
      type: 'DOMMouseScroll',
      handler(e) {
        self.mousewheel(e);
      },
    },
    {
      obj: self.domElement,
      type: 'mouseout',
      handler(e) {
        self.mouseup(e);
      },
    },
    {
      obj: self.domElement,
      type: 'touchstart',
      handler(e) {
        self.touchstartend(e);
      },
    },
    {
      obj: self.domElement,
      type: 'touchend',
      handler(e) {
        self.touchstartend(e);
      },
    },
    {
      obj: self.domElement,
      type: 'touchmove',
      handler(e) {
        self.touchmove(e);
      },
    },
    {
      obj: self.getKeyBindObject(),
      type: 'keydown',
      handler(e) {
        self.keydownup(e);
      },
    },
    {
      obj: self.getKeyBindObject(),
      type: 'keyup',
      handler(e) {
        self.keydownup(e);
      },
    },
    {
      obj: window,
      type: 'resize',
      handler() {
        self.handleResize();
      },
    },
    {
      obj: window,
      type: 'blur',
      handler() {
        self.resetKeys();
      },
    },
    {
      obj: self.domElement,
      type: 'contextmenu',
      handler(e) {
        self.contextmenu(e);
      },
    }];

  for (let i = 0; i < this._listeners.length; i++) {
    const l = this._listeners[i];
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

ObjectControls.prototype.resetKeys = function () {
  this._pressedKeys[VK_LEFT] = false;
  this._pressedKeys[VK_UP] = false;
  this._pressedKeys[VK_RIGHT] = false;
  this._pressedKeys[VK_DOWN] = false;
};

ObjectControls.prototype.contextmenu = function (e) {
  e.stopPropagation();
  e.preventDefault();
};

ObjectControls.prototype.handleResize = function () {
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

ObjectControls.prototype.enable = function (enable) {
  this.enabled = enable;
};

ObjectControls.prototype.enableHotkeys = function (enable) {
  this.hotkeysEnabled = enable;
};

ObjectControls.prototype.allowTranslation = function (allow) {
  this._isTranslationAllowed = allow;
};

ObjectControls.prototype.allowAltObjFreeRotation = function (allow) {
  this._isAltObjFreeRotationAllowed = allow;
};

ObjectControls.prototype.keysTranslateObj = function (on) {
  this._isKeysTranslatingObj = on;
};

ObjectControls.prototype.isEditingAltObj = function () {
  return ((this._state === STATE.ROTATE) || (this._state === STATE.TRANSLATE))
            && (this._affectedObj === this._altObj);
};

// convert page coords of mouse/touch to uniform coords with smaller side being [-0.5, 0.5]
// (uniform coords keep direct proportion with screen distance travelled by mouse regardless of screen aspect ratio)
ObjectControls.prototype.getMouseOnCircle = function (pageX, pageY) {
  const screenSize = Math.min(this.screen.width, this.screen.height);

  if (screenSize === 0) {
    return new THREE.Vector2(0, 0);
  }

  return new THREE.Vector2(
    ((pageX - this.screen.width * 0.5 - this.screen.left) / screenSize),
    ((0.5 * this.screen.height + this.screen.top - pageY) / screenSize),
  );
};

// convert page coords of mouse/touch to viewport coords with both sides being [-1, 1]
// (those are non-uniform coords affected by screen aspect ratio)
ObjectControls.prototype.getMouseViewport = function (pageX, pageY) {
  if (this.screen.width === 0 || this.screen.height === 0) {
    return new THREE.Vector2(0, 0);
  }

  return new THREE.Vector2(
    (2.0 * (pageX - this.screen.width * 0.5 - this.screen.left) / this.screen.width),
    (2.0 * (0.5 * this.screen.height + this.screen.top - pageY) / this.screen.height),
  );
};

ObjectControls.prototype.stop = function () {
  this._mainObj.stop();
  this._altObj.stop();
};

// rotate object based on latest mouse/touch movement
ObjectControls.prototype.rotateByMouse = function (aboutZAxis) {
  this._affectedObj.rotate(this._mousePrevPos, this._mouseCurPos, aboutZAxis);
  this.dispatchEvent({ type: 'change', action: 'rotate', angle: this._affectedObj.lastRotation.angle });
};

// rotate object by specified quaternion
ObjectControls.prototype.rotate = function (quat) {
  this.object.quaternion.multiply(quat);
};

// get object's orientation
ObjectControls.prototype.getOrientation = function () {
  return this.object.quaternion;
};

// set object's orientation
ObjectControls.prototype.setOrientation = function (quat) {
  this.object.quaternion.copy(quat);
};

// translate object based on latest mouse/touch movement
ObjectControls.prototype.translate = function () {
  const delta = this._mouseCurPos.clone();
  delta.sub(this._mousePrevPos);
  this._affectedObj.translate(delta);
  this.dispatchEvent({ type: 'change', action: 'translate' });
};

// get object scale
ObjectControls.prototype.getScale = function () {
  return this.object.scale.x;
};

// set uniform object scale
ObjectControls.prototype.setScale = function (scale) {
  this.object.scale.set(scale, scale, scale);
};

// scale object by factor (factor should be greater than zero)
ObjectControls.prototype.scale = function (factor) {
  if (factor <= 0) {
    return;
  }
  this.setScale(this.object.scale.x * factor);
};

ObjectControls.prototype.update = function () {
  const curTime = this._clock.getElapsedTime();
  const timeSinceLastUpdate = curTime - this._lastUpdateTime;

  // update object handler
  if (this._state === STATE.NONE) {
    const timeSinceMove = curTime - this._lastMouseMoveTime;
    if (this._mainObj.update(timeSinceLastUpdate, timeSinceMove)
          || this._altObj.update(timeSinceLastUpdate, timeSinceMove)) {
      this.dispatchEvent({ type: 'change', action: 'auto' });
    }
  }

  // apply arrow keys
  if (this._isKeysTranslatingObj) {
    const speedX = Number(this._pressedKeys[VK_RIGHT]) - Number(this._pressedKeys[VK_LEFT]);
    const speedY = Number(this._pressedKeys[VK_UP]) - Number(this._pressedKeys[VK_DOWN]);
    if (speedX !== 0.0 || speedY !== 0.0) {
      const delta = timeSinceLastUpdate;

      // update object translation
      const altObj = this.getAltObj();
      if (altObj.objects.length > 0) {
        this._altObj.setObjects(altObj.objects);
        this._altObj.pivot = altObj.pivot;

        if ('axis' in altObj) {
          this._altObj.axis = altObj.axis.clone();
        } else {
          this._altObj.axis.set(0, 0, 1);
        }

        this._altObj.translate(new THREE.Vector2(delta * speedX, delta * speedY));
        this.dispatchEvent({ type: 'change', action: 'translate' });
      }
    }
  }

  this._lastUpdateTime = curTime;
};

ObjectControls.prototype.reset = function () {
  this._state = STATE.NONE;

  this.object.quaternion.copy(new THREE.Quaternion(0, 0, 0, 1));
};

// listeners

ObjectControls.prototype.mousedown = function (event) {
  if (this.enabled === false || this._state !== STATE.NONE) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (this._state === STATE.NONE) {
    if (event.button === 0) {
      this._affectedObj.stop(); // can edit only one object at a time

      let workWithAltObj = false;

      if (event.altKey) {
        const altObj = this.getAltObj();
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

ObjectControls.prototype.mousemove = function (event) {
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

ObjectControls.prototype.mousewheel = function (event) {
  if (this.enabled === false || !settings.now.zooming || this._state !== STATE.NONE || event.shiftKey) {
    return;
  }

  event.preventDefault();

  let delta = 0;

  if (event.wheelDelta) {
    // WebKit / Opera / Explorer 9
    delta = event.wheelDelta / 40;
  } else if (event.detail) {
    // Firefox
    delta = -event.detail / 3;
  }

  let factor = 1.0 + delta * 0.05;
  factor = Math.max(factor, 0.01);
  this.scale(factor);

  this.dispatchEvent({ type: 'change', action: 'zoom', factor });
};

ObjectControls.prototype.mouseup = function (event) {
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

ObjectControls.prototype.touchstartend = function (event) {
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

    case 2: {
      // prevent inertial rotation
      this._mainObj.stop();
      this._altObj.stop();

      this._state = STATE.SCALE;
      const dx = event.touches[0].pageX - event.touches[1].pageX;
      const dy = event.touches[0].pageY - event.touches[1].pageY;
      this._touchDistanceCur = this._touchDistanceStart = Math.sqrt(dx * dx + dy * dy);
      this._scaleStart = this.object.scale.x;
      break;
    }

    default:
      this._state = STATE.NONE;
  }
};

ObjectControls.prototype.touchmove = function (event) {
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

    case STATE.SCALE:
      if (settings.now.zooming) {
        // update scale
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        this._touchDistanceCur = Math.sqrt(dx * dx + dy * dy);
        const oldScale = this.object.scale.x;
        const newScale = this._scaleStart * this._touchDistanceCur / this._touchDistanceStart;
        this.setScale(newScale);
        this.dispatchEvent({ type: 'change', action: 'zoom', factor: (oldScale === 0.0) ? 1.0 : newScale / oldScale });
      }
      break;

    default:
  }
};

ObjectControls.prototype.keydownup = function (event) {
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

ObjectControls.prototype.getKeyBindObject = function () {
  return window.top;
};


ObjectControls.prototype.dispose = function () {
  for (let i = 0; i < this._listeners.length; i++) {
    const l = this._listeners[i];
    l.obj.removeEventListener(l.type, l.handler);
  }
};

ObjectControls.prototype.translatePivotByMouse = function () {
  const delta = this._mouseCurPos.clone();
  delta.sub(this._mousePrevPos);
  this.translatePivotInWorld(settings.now.translationSpeed * delta.x, settings.now.translationSpeed * delta.y, 0);
};

// Translate in WorldCS, translation is scaled with root scale matrix
ObjectControls.prototype.translatePivotInWorld = function (x, y, z) {
  const pos = this.objectPivot.position;
  pos.applyMatrix4(this.object.matrixWorld);
  pos.setX(pos.x + x);
  pos.setY(pos.y + y);
  pos.setZ(pos.z + z);
  const invWorldMat = new THREE.Matrix4().getInverse(this.object.matrixWorld);
  pos.applyMatrix4(invWorldMat);

  this.dispatchEvent({ type: 'change' });
};

// Translate in ModelCS, x, y, z are Ang
ObjectControls.prototype.translatePivot = function (x, y, z) {
  const pos = this.objectPivot.position;
  pos.setX(pos.x + x);
  pos.setY(pos.y + y);
  pos.setZ(pos.z + z);

  this.dispatchEvent({ type: 'change' });
};

export default ObjectControls;
