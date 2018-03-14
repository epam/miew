/* global PACKAGE_VERSION:false */


//////////////////////////////////////////////////////////////////////////////

import _ from 'lodash';
import * as THREE from 'three';
import {Spinner} from 'spin.js';
import Stats from './gfx/Stats';
import utils from './utils';
import JobHandle from './utils/JobHandle';
import options from './options';
import settings from './settings';
import chem from './chem';
import Visual from './Visual';
import ComplexVisual from './ComplexVisual';
import VolumeVisual from './VolumeVisual';
import GfxProfiler from './gfx/GfxProfiler';
import io from './io/io';
import modes from './gfx/modes';
import colorers from './gfx/colorers';
import palettes from './gfx/palettes';
import materials from './gfx/materials';
import Representation from './gfx/Representation';
import CSS2DRenderer from './gfx/CSS2DRenderer';
import ObjectControls from './ui/ObjectControls';
import Picker from './ui/Picker';
import Axes from './gfx/Axes';
import gfxutils from './gfx/gfxutils';
import FrameInfo from './gfx/FrameInfo';
import meshes from './gfx/meshes/meshes';
import LinesObject from './gfx/objects/LinesObj';
import UberMaterial from './gfx/shaders/UberMaterial';
import OutlineMaterial from './gfx/shaders/OutlineMaterial';
import FXAAMaterial from './gfx/shaders/FXAAMaterial';
import ao from './gfx/shaders/AO';
import AnaglyphMaterial from './gfx/shaders/AnaglyphMaterial';
import VolumeMaterial from './gfx/shaders/VolumeMaterial';
import viewInterpolator from './gfx/ViewInterpolator';
import fbxExport from './gfx/fbxExport';
import EventDispatcher from './utils/EventDispatcher';
import logger from './utils/logger';
import Cookies from './utils/Cookies';
import capabilities from './gfx/capabilities';
import WebVRPoC from './gfx/vr/WebVRPoC';

//////////////////////////////////////////////////////////////////////////////

var
  selectors = chem.selectors,
  Atom = chem.Atom,
  Residue = chem.Residue,
  Chain = chem.Chain,
  Molecule = chem.Molecule;

var EDIT_MODE = {COMPLEX: 0, COMPONENT: 1, FRAGMENT: 2};

var createElement = utils.createElement;

function updateFogRange(fog, center, radius) {
  fog.near = center - radius * settings.now.fogNearFactor;
  fog.far = center + radius * settings.now.fogFarFactor;
}

function removeExtension(fileName) {
  var dot = fileName.lastIndexOf('.');
  if (dot >= 0) {
    fileName = fileName.substr(0, dot);
  }
  return fileName;
}

function hasValidResidues(complex) {
  var hasValidRes = false;
  complex.forEachComponent(function(component) {
    component.forEachResidue(function(residue) {
      if (residue._isValid) {
        hasValidRes = true;
      }
    });
  });
  return hasValidRes;
}

function reportProgress(log, action, percent) {
  var TOTAL_PERCENT = 100;
  if (percent !== undefined) {
    log.debug(action + '... ' + Math.floor(percent * TOTAL_PERCENT) + '%');
  } else {
    log.debug(action + '...');
  }
}

//////////////////////////////////////////////////////////////////////////////

/**
 * Main 3D Molecular Viewer class.
 *
 * @param {object} opts - Viewer options.
 * @param {HTMLElement=} opts.container - DOM element that serves as a viewer container.
 * @param {object=} opts.settings - An object with properties to override default settings.
 * @param {string=} opts.settingsCookie='settings' - The name of the cookie to save current settings to.
 * @param {string=} opts.cookiePath='/' - The path option for cookies. Defaults to root.
 *
 * @exports Miew
 * @constructor
 */
function Miew(opts) {
  EventDispatcher.call(this);
  this._opts = _.merge({
    settingsCookie: 'settings',
    cookiePath: '/',
  }, opts);
  /** @type {?object} */
  this._gfx = null;
  /** @type {HTMLElement} */
  this._container = (opts && opts.container) ||
    document.getElementById('miew-container') ||
    _.head(document.getElementsByClassName('miew-container')) ||
    document.body;
  /** @type {HTMLElement} */
  this._containerRoot = this._container;

  /** @type {boolean} */
  this._running = false;
  /** @type {boolean} */
  this._halting = false;
  /** @type {boolean} */
  this._building = false;
  /** @type {boolean} */
  this._needRender = true;
  /** @type {boolean} */
  this._hotKeysEnabled = true;

  /** @type {Settings} */
  this.settings = settings;
  const log = logger; // TODO: add .instantiate() when migration to the "context" paradigm is finished
  log.console  = DEBUG;
  log.level = DEBUG ? 'debug' : 'info';
  /**
   * @type {Logger}
   * @example
   * miew.logger.addEventListener('message', function _onLogMessage(evt) {
   *   console.log(evt.message);
   * });
   */
  this.logger = log;

  this._cookies = new Cookies(this);
  this._loadSettings();
  if (opts && opts.settings) {
    this.settings.override(opts.settings);
  }

  /** @type {?Spinner} */
  this._spinner = null;
  /** @type {JobHandle[]} */
  this._loading = [];
  /** @type {?number} */
  this._animInterval = null;

  /** @type {object} */
  this._visuals = {};
  /** @type {?string} */
  this._curVisualName = null;

  /** @type {array} */
  this._objects = [];

  /** @type {object} */
  this._sourceWindow = null;

  // TODO make this being not so ugly

  this._srvTopoSource = null;
  this._srvAnimSource = null;

  this.reset();

  if (this._repr) {
    log.debug('Selected ' + this._repr.mode.name + ' mode with ' + this._repr.colorer.name + ' colorer.');
  }

  var self = this;
  Miew.registeredPlugins.forEach(function(plugin) {
    plugin.call(self);
  });
}

Miew.prototype = Object.create(EventDispatcher.prototype);
Miew.prototype.constructor = Miew;

Miew.prototype.getMaxRepresentationCount = function() {
  return ComplexVisual.NUM_REPRESENTATION_BITS;
};

/**
 * Initialize the viewer.
 * @returns {boolean} true on success.
 * @throws Forwards exception raised during initialization.
 * @see Miew#term
 */
Miew.prototype.init = function() {
  var container = this._container;
  var elem = utils.createElement('div', {'class': 'miew-canvas'});
  _setContainerContents(container, elem);
  this._container = elem;

  var frag = document.createDocumentFragment();
  frag.appendChild(this._msgMode = createElement(
    'div', {'class': 'mode-message overlay'},
    createElement('p', {}, 'COMPONENT EDIT MODE')
  ));
  frag.appendChild(this._msgAtomInfo = createElement(
    'div', {'class': 'atom-info overlay'},
    createElement('p', {}, '')
  ));
  container.appendChild(frag);

  if (this._gfx !== null) { //block double init
    return true;
  }

  var self = this;
  this._showMessage('Viewer is being initialized...');
  try {

    this._initGfx();

    this._initListeners();
    this._spinner = new Spinner({
      lines: 13,
      length: 28,
      width: 14,
      radius: 42,
      color: '#fff',
      zIndex: 700
    });

    window.top.addEventListener('keydown', function(event) {
      self._onKeyDown(event);
    });

    window.top.addEventListener('keyup', function(event) {
      self._onKeyUp(event);
    });

    this._objectControls = new ObjectControls(
      this._gfx.root, this._gfx.pivot,
      this._gfx.camera, this._gfx.renderer.domElement, function() {
        return self._getAltObj();
      }
    );
    this._objectControls.addEventListener('change', function(e) {
      // route rotate and zoom events to the external API
      switch (e.action) {
      case 'rotate':
        self.dispatchEvent({type: 'rotate', angle: e.angle});
        break;
      case 'zoom':
        self.dispatchEvent({type: 'zoom', factor: e.factor});
        break;
      default:
      }
      self.dispatchEvent({type: 'transform'});
      self._needRender = true;
    });

    var gfx = this._gfx;
    this._picker = new Picker(gfx.root, gfx.camera, gfx.renderer.domElement);
    this._picker.addEventListener('newpick', function(event) {
      self._onPick(event);
    });
    this._picker.addEventListener('dblclick', function(event) {
      self._onDblClick(event);
    });

    this._onThemeChanged();

  } catch (error) {
    // FIXME: THREE.WebGLRenderer throws error AND catches it, so we receive different one. Some random crash.
    if (error.name === 'TypeError' && error.message === 'Cannot read property \'getExtension\' of null') {
      this._showMessage('Could not create WebGL context.');
    } else {
      this._showMessage('Viewer initialization failed.');
      throw error;
    }
    return false;
  }

  // automatically load default file
  var file = this._opts && this._opts.load;
  if (file) {
    var type = this._opts && this._opts.type;
    this.load(file, {fileType: type, keepRepsInfo: true});
  }

  return true;
};

/**
 * Terminate the viewer completely.
 * @see Miew#init
 */
Miew.prototype.term = function() {
  this._showMessage('Viewer has been terminated.');
  this._loading.forEach((job) => {
    job.cancel();
  });
  this._loading.length = 0;
  this.halt();
  this._gfx = null;
};

/**
 * Replace viewer container contents with a DOM element.
 * @param {HTMLElement} container - parent container.
 * @param {HTMLElement} element - DOM element to show.
 * @private
 */
function _setContainerContents(container, element) {
  const parent = container;
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
  parent.appendChild(element);
}

/**
 * Display message inside the viewer container, hiding WebGL canvas.
 * @param {string} msg - Message to show.
 * @private
 */
Miew.prototype._showMessage = function(msg) {
  const element = document.createElement('div');
  element.setAttribute('class', 'miew-message');
  element.appendChild(document.createElement('p')).appendChild(document.createTextNode(msg));
  _setContainerContents(this._container, element);
};

/**
 * Display WebGL canvas inside the viewer container, hiding any message shown.
 * @private
 */
Miew.prototype._showCanvas = function() {
  _setContainerContents(this._container, this._gfx.renderer.domElement);
};

/**
 * Initialize WebGL and set 3D scene up.
 * @private
 */
Miew.prototype._initGfx = function() {
  var gfx = {
    width:  this._container.clientWidth,
    height: this._container.clientHeight
  };

  var webGLOptions = {preserveDrawingBuffer: true};
  if (settings.now.antialias) {
    webGLOptions.antialias = true;
  }

  gfx.renderer2d = new CSS2DRenderer();

  gfx.renderer = new THREE.WebGLRenderer(webGLOptions);
  capabilities.init(gfx.renderer);

  // z-sprites and ambient occlusion possibility
  if (!gfx.renderer.getContext().getExtension('EXT_frag_depth')) {
    settings.now.zSprites = false;
  }
  if (!gfx.renderer.getContext().getExtension('WEBGL_depth_texture')) {
    settings.now.ao = false;
  }

  gfx.renderer.autoClear = false;
  gfx.renderer.setPixelRatio(window.devicePixelRatio);
  gfx.renderer.setSize(gfx.width, gfx.height);
  gfx.renderer.setClearColor(settings.now.themes[settings.now.theme]);
  gfx.renderer.clearColor();

  gfx.renderer2d.setSize(gfx.width, gfx.height);

  gfx.camera = new THREE.PerspectiveCamera(
    settings.now.camFov, gfx.width / gfx.height,
    settings.now.camNear, settings.now.camFar
  );
  gfx.camera.setMinimalFov(settings.now.camFov);
  gfx.camera.position.z = settings.now.camDistance;
  gfx.camera.updateProjectionMatrix();
  gfx.camera.layers.set(gfxutils.LAYERS.DEFAULT);
  gfx.camera.layers.enable(gfxutils.LAYERS.VOLUME);
  gfx.camera.layers.enable(gfxutils.LAYERS.VOLUME_BFPLANE);

  gfx.stereoCam = new THREE.StereoCamera();

  gfx.scene = new THREE.Scene();
  gfx.scene.fog = new THREE.Fog(
    settings.now.themes[settings.now.theme],
    settings.now.camNear, settings.now.camFar
  );

  gfx.root = new gfxutils.RCGroup();
  gfx.scene.add(gfx.root);

  gfx.pivot = new gfxutils.RCGroup();
  gfx.root.add(gfx.pivot);

  gfx.selectionScene = new THREE.Scene();
  gfx.selectionRoot = new THREE.Group();
  gfx.selectionRoot.matrixAutoUpdate = false;
  gfx.selectionScene.add(gfx.selectionRoot);

  gfx.selectionPivot = new THREE.Group();
  gfx.selectionPivot.matrixAutoUpdate = false;
  gfx.selectionRoot.add(gfx.selectionPivot);

  // TODO: Either stay with a single light or revert this commit
  var light12 = new THREE.DirectionalLight(0xffffff, 0.45);
  light12.position.set(0, 0.414, 1);
  light12.layers.enable(gfxutils.LAYERS.TRANSPARENT);
  gfx.scene.add(light12);

  var light3 = new THREE.AmbientLight(0x666666);
  light3.layers.enable(gfxutils.LAYERS.TRANSPARENT);
  gfx.scene.add(light3);

  // add axes
  gfx.axes = new Axes(gfx.root, gfx.camera);

  gfx.offscreenBuf = new THREE.WebGLRenderTarget(
    gfx.width * window.devicePixelRatio,
    gfx.height * window.devicePixelRatio,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: true
    }
  );

  if (gfx.renderer.getContext().getExtension('WEBGL_depth_texture')) {
    gfx.offscreenBuf.depthTexture = new THREE.DepthTexture();
    gfx.offscreenBuf.depthTexture.type = THREE.UnsignedShortType;
  }

  gfx.offscreenBuf2 = new THREE.WebGLRenderTarget(
    gfx.width * window.devicePixelRatio,
    gfx.height * window.devicePixelRatio,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false
    }
  );

  gfx.offscreenBuf3 = new THREE.WebGLRenderTarget(
    gfx.width * window.devicePixelRatio,
    gfx.height * window.devicePixelRatio,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false
    }
  );

  gfx.offscreenBuf4 = new THREE.WebGLRenderTarget(
    gfx.width * window.devicePixelRatio,
    gfx.height * window.devicePixelRatio,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false
    }
  );

  gfx.volBFTex = gfx.offscreenBuf3;
  gfx.volFFTex = gfx.offscreenBuf4;
  gfx.volWFFTex = gfx.offscreenBuf;

  // use float textures for volume rendering if possible
  if (gfx.renderer.getContext().getExtension('OES_texture_float')) {
    gfx.offscreenBuf5 = new THREE.WebGLRenderTarget(
      gfx.width * window.devicePixelRatio,
      gfx.height * window.devicePixelRatio,
      {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.FloatType,
        depthBuffer: false
      }
    );

    gfx.offscreenBuf6 = new THREE.WebGLRenderTarget(
      gfx.width * window.devicePixelRatio,
      gfx.height * window.devicePixelRatio,
      {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.FloatType,
        depthBuffer: false
      }
    );

    gfx.offscreenBuf7 = new THREE.WebGLRenderTarget(
      gfx.width * window.devicePixelRatio,
      gfx.height * window.devicePixelRatio,
      {
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: THREE.FloatType,
        depthBuffer: true
      }
    );

    gfx.volBFTex = gfx.offscreenBuf5;
    gfx.volFFTex = gfx.offscreenBuf6;
    gfx.volWFFTex = gfx.offscreenBuf7;
  } else {
    this.logger.warn('Device doesn\'t support OES_texture_float extension');
  }

  gfx.stereoBufL = new THREE.WebGLRenderTarget(
    gfx.width * window.devicePixelRatio,
    gfx.height * window.devicePixelRatio,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false
    }
  );

  gfx.stereoBufR = new THREE.WebGLRenderTarget(
    gfx.width * window.devicePixelRatio,
    gfx.height * window.devicePixelRatio,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false
    }
  );

  this._gfx = gfx;
  this._showCanvas();

  if (settings.now.stereo === 'WEBVR') {
    this.webVR = new WebVRPoC(() => {
      this._needRender = true;
      this._onResize();
    });
    this.webVR.toggle(true, gfx);
  }

  this._container.appendChild(gfx.renderer2d.getElement());

  // add FPS counter
  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.right = '0';
  stats.domElement.style.bottom = '0';
  this._container.appendChild(stats.domElement);
  this._fps = stats;
  this._fps.show(settings.now.fps);
};

/**
 * Setup event listeners.
 * @private
 */
Miew.prototype._initListeners = function() {
  var self = this;
  window.addEventListener('resize', function _onResize() {
    self._onResize();
  });
};

/**
 * Try to add numbers to the base name to make it unique among visuals
 * @private
 */
Miew.prototype._makeUniqueVisualName = function(baseName) {
  if (!baseName) {
    return Math.random().toString();
  }

  var name = baseName;
  var suffix = 1;
  while (this._visuals.hasOwnProperty(name)) {
    name = baseName + ' (' + suffix.toString() + ')';
    suffix++;
  }

  return name;
};

/**
 * Add visual to the viewer
 * @private
 */
Miew.prototype._addVisual = function(visual) {
  if (!visual) {
    return null;
  }

  // change visual name in order to make it unique
  var name = this._makeUniqueVisualName(visual.name);
  visual.name = name;

  this._visuals[name] = visual;
  this._gfx.pivot.add(visual);
  if (visual.getSelectionGeo) {
    this._gfx.selectionPivot.add(visual.getSelectionGeo());
  }

  return name;
};

/**
 * Remove visual from the viewer
 * @private
 */
Miew.prototype._removeVisual = function(visual) {
  var name = '';
  var obj = null;
  if (visual instanceof Visual) {
    name = visual.name;
    obj = visual;
  } else if (typeof visual === 'string') {
    name = visual;
    obj = this._visuals[name];
  }

  if (!obj || !this._visuals.hasOwnProperty(name) || this._visuals[name] !== obj) {
    return;
  }

  if (name === this._curVisualName) {
    this._curVisualName = undefined; // TODO: implement a proper way of handling visuals
  }

  delete this._visuals[name];
  obj.release(); // removes nodes from scene

  this._needRender = true;
};

/**
 * Call specified function for each Visual
 * @private
 */
Miew.prototype._forEachVisual = function(callback) {
  for (var name in this._visuals) {
    if (this._visuals.hasOwnProperty(name)) {
      callback(this._visuals[name]);
    }
  }
};

/**
 * Release (destroy) all visuals in the scene
 * @private
 */
Miew.prototype._releaseAllVisuals = function() {
  if (!this._gfx || !this._gfx.pivot) {
    return;
  }

  for (var name in this._visuals) {
    if (this._visuals.hasOwnProperty(name)) {
      this._visuals[name].release();
    }
  }

  this._visuals = {};
};

/**
 * Call specified function for each ComplexVisual
 * @private
 */
Miew.prototype._forEachComplexVisual = function(callback) {
  if (!this._gfx || !this._gfx.pivot) {
    return;
  }

  for (var name in this._visuals) {
    if (this._visuals.hasOwnProperty(name) &&
          this._visuals[name] instanceof ComplexVisual) {
      callback(this._visuals[name]);
    }
  }
};

/**
 * Returns ComplexVisual with specified name, or current (if not found), or any, or null
 * @private
 */
Miew.prototype._getComplexVisual = function(name) {
  name = name || this._curVisualName;
  var any = null;
  var named = null;
  this._forEachComplexVisual(function(visual) {
    any = visual;
    if (visual.name === name) {
      named = visual;
    }
  });
  return named || any;
};

/**
 * Returns first found VolumeVisual (no more than one should be present actually)
 * @private
 */
Miew.prototype._getVolumeVisual = function() {
  var any = null;
  this._forEachVisual(function(visual) {
    if (visual instanceof VolumeVisual) {
      any = visual;
    }
  });
  return any;
};

/**
 * Returns ComplexVisual corresponding to specified complex
 * @private
 */
Miew.prototype._getVisualForComplex = function(complex) {
  if (!complex) {
    return null;
  }

  var found = null;
  this._forEachComplexVisual(function(visual) {
    if (visual.getComplex() === complex) {
      found = visual;
    }
  });
  return found;
};

/*
   * Get a list of names of visuals currently shown by the viewer
   */
Miew.prototype.getVisuals = function() {
  return Object.keys(this._visuals);
};

/*
   * Get current visual
   */
Miew.prototype.getCurrentVisual = function() {
  return this._curVisualName;
};

/*
   * Set current visual.
   * All further operations will be performed on this visual (complex) if not stated otherwise.
   */
Miew.prototype.setCurrentVisual = function(name) {
  if (!this._visuals[name]) {
    return;
  }

  this._curVisualName = name;
};

/**
 * Run the viewer, start processing update/render frames periodically.
 * Has no effect if already running.
 * @see Miew#halt
 */
Miew.prototype.run = function() {
  if (!this._running) {
    this._running = true;
    if (this._halting) {
      this._halting = false;
      return;
    }

    this._objectControls.enable(true);

    const device = this.webVR ? this.webVR.getDevice() : null;
    (device || window).requestAnimationFrame(() => this._onTick());
  }
};

/**
 * Request the viewer to stop.
 * Will be processed during the next frame.
 * @see Miew#run
 */
Miew.prototype.halt = function() {
  if (this._running) {
    this._discardComponentEdit();
    this._discardFragmentEdit();
    this._objectControls.enable(false);
    this._halting = true;
  }
};

/**
 * Request the viewer to start / stop responsing
 * on hot keys.
 * @param enabled - start (true) or stop (false) response on hot keys.
 */
Miew.prototype.enableHotKeys = function(enabled) {
  this._hotKeysEnabled = enabled;
  this._objectControls.enableHotkeys(enabled);
};

/**
 * Callback which processes window resize.
 * @private
 */
Miew.prototype._onResize = function() {
  this._needRender = true;

  var gfx = this._gfx;
  gfx.width = this._container.clientWidth;
  gfx.height = this._container.clientHeight;

  gfx.camera.aspect = gfx.width / gfx.height;
  gfx.camera.setMinimalFov(settings.now.camFov);
  gfx.camera.updateProjectionMatrix();

  gfx.renderer.setSize(gfx.width, gfx.height);
  gfx.renderer2d.setSize(gfx.width, gfx.height);

  this.dispatchEvent({type: 'resize'});
};

Miew.prototype._resizeOffscreenBuffers = function(width, height, stereo) {
  var gfx = this._gfx;
  stereo = stereo || 'NONE';
  var isAnaglyph = (stereo === 'NONE' || stereo === 'ANAGLYPH');
  var multi = isAnaglyph ? 1 : 0.5;
  gfx.offscreenBuf.setSize(multi * width, height);
  gfx.offscreenBuf2.setSize(multi * width, height);
  gfx.offscreenBuf3.setSize(multi * width, height);
  if (gfx.offscreenBuf5) {
    gfx.offscreenBuf5.setSize(multi * width, height);
  }
  if (gfx.offscreenBuf6) {
    gfx.offscreenBuf6.setSize(multi * width, height);
  }
  if (gfx.offscreenBuf7) {
    gfx.offscreenBuf7.setSize(multi * width, height);
  }
  if (isAnaglyph) {
    gfx.stereoBufL.setSize(width, height);
    gfx.stereoBufR.setSize(width, height);
  }
};

/**
 * Callback which processes update/render frames.
 * @private
 */
Miew.prototype._onTick = function() {
  if (this._halting) {
    this._running = false;
    this._halting = false;
    return;
  }

  this._fps.update();

  const device = this.webVR ? this.webVR.getDevice() : null;
  (device || window).requestAnimationFrame(() => this._onTick());

  this._onUpdate();
  if (this._needRender) {
    this._onRender();
    this._needRender = !settings.now.suspendRender || settings.now.stereo === 'WEBVR' || !!device;
  }
};

Miew.prototype._getBSphereRadius = function() {
  // calculate radius that would include all visuals
  var radius = 0;
  this._forEachVisual(function(visual) {
    radius = Math.max(radius, visual.getBoundaries().boundingSphere.radius);
  });
  return radius * this._objectControls.getScale();
};

Miew.prototype._updateFog = function() {
  var gfx = this._gfx;

  if (settings.now.fog) {
    if (typeof gfx.scene.fog === 'undefined' || gfx.scene.fog === null) {
      gfx.scene.fog = new THREE.Fog(settings.now.themes[settings.now.theme]);
      this._setUberMaterialValues({fog: settings.now.fog});
    }
    updateFogRange(gfx.scene.fog, gfx.camera.position.z, this._getBSphereRadius());
  } else if (gfx.scene.fog) {
    gfx.scene.fog = undefined;
    this._setUberMaterialValues({fog: settings.now.fog});
  }
};

Miew.prototype._onUpdate = function() {

  if (this.isScriptingCommandAvailable !== undefined && this.isScriptingCommandAvailable() && !this._building) {
    this.callNextCmd();
  }

  this._objectControls.update();

  this._forEachComplexVisual(function(visual) {
    visual.getComplex().update();
  });

  if (settings.now.autobuild && !this._loading.length && !this._building && this._needRebuild()) {
    this.rebuild();
  }

  if (!this._loading.length && !this._building && !this._needRebuild()) {
    this._updateView();
  }

  this._updateFog();

  if (this._gfx.renderer.vr.enabled) {
    this.webVR.updateMoleculeScale();
  }
};

Miew.prototype._onRender = function() {
  var gfx = this._gfx;

  // update all matrices
  gfx.scene.updateMatrixWorld();
  gfx.camera.updateMatrixWorld();

  this._clipPlaneUpdateValue(this._getBSphereRadius());
  this._fogFarUpdateValue();

  gfx.renderer.clearTarget(null);

  this._renderFrame(settings.now.stereo);
};

Miew.prototype._renderFrame = (function() {

  var _anaglyphMat = new AnaglyphMaterial();

  return function(stereo) {
    var gfx = this._gfx;
    var renderer = gfx.renderer;

    if (stereo !== 'NONE') {
      // in anaglyph mode we render full-size image for each eye
      // while in other stereo modes only half-size (two images on the screen)
      gfx.stereoCam.aspect = (stereo === 'ANAGLYPH') ? 1.0 : 0.5;

      gfx.camera.focus = gfx.camera.position.z; // set focus to the center of the object
      gfx.stereoCam.update(gfx.camera);
    }

    var size = renderer.getSize();

    // resize offscreen buffers to match the target
    this._resizeOffscreenBuffers(size.width * window.devicePixelRatio, size.height * window.devicePixelRatio, stereo);

    switch (stereo) {
    case 'WEBVR':
    case 'NONE':
      this._renderScene(gfx.camera, false);
      break;
    case 'SIMPLE':
    case 'DISTORTED':
      renderer.setScissorTest(true);

      renderer.setScissor(0, 0, size.width / 2, size.height);
      renderer.setViewport(0, 0, size.width / 2, size.height);
      this._renderScene(this._gfx.stereoCam.cameraL, stereo === 'DISTORTED');

      renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
      renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
      this._renderScene(this._gfx.stereoCam.cameraR, stereo === 'DISTORTED');

      renderer.setScissorTest(false);
      break;
    case 'ANAGLYPH':
      this._renderScene(this._gfx.stereoCam.cameraL, false, gfx.stereoBufL);
      this._renderScene(this._gfx.stereoCam.cameraR, false, gfx.stereoBufR);
      _anaglyphMat.uniforms.srcL.value = gfx.stereoBufL;
      _anaglyphMat.uniforms.srcR.value = gfx.stereoBufR;
      gfx.renderer.renderScreenQuad(_anaglyphMat);
      break;
    default:
    }

    gfx.renderer2d.render(gfx.scene, gfx.camera);

    if (settings.now.axes && gfx.axes && !gfx.renderer.vr.enabled) {
      gfx.axes.render(renderer);
    }
  };

})();

Miew.prototype._onThemeChanged = (function() {
  var themeRE = /\s*theme-\w+\b/g;
  return function() {
    var theme = settings.now.theme;
    var div = this._containerRoot;
    div.className = div.className.replace(themeRE, '') + ' theme-' + theme;

    var gfx = this._gfx;
    if (gfx) {
      var color = settings.now.themes[theme];
      if (gfx.scene.fog) {
        gfx.scene.fog.color.set(color);
      }
      gfx.renderer.setClearColor(color);
    }
  };
})();

Miew.prototype._setUberMaterialValues = function(values) {
  this._gfx.root.traverse(function(obj) {
    if ((obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line) &&
        obj.material instanceof UberMaterial) {
      obj.material.setValues(values);
      obj.material.needsUpdate = true;
    }
  });
};

Miew.prototype._renderScene = (function() {
  return function(camera, distortion, target) {
    distortion = distortion || false;
    target = target || null;

    var gfx = this._gfx;

    // render to offscreen buffer
    gfx.renderer.setClearColor(settings.now.themes[settings.now.theme], 1);
    gfx.renderer.clearTarget(target);
    if (gfx.renderer.vr.enabled) {
      gfx.renderer.render(gfx.scene, camera);
      return;
    }
    gfx.renderer.clearTarget(gfx.offscreenBuf);
    // FIXME clean up targets in render selection

    if (settings.now.transparency === 'prepass') {
      this._renderWithPrepassTransparency(camera, gfx.offscreenBuf);
    } else if (settings.now.transparency === 'standard') {
      gfx.renderer.render(gfx.scene, camera, gfx.offscreenBuf);
    }

    var bHaveComplexes = (this._getComplexVisual() !== null);
    var volumeVisual = this._getVolumeVisual();

    // when fxaa we should get resulting image in temp off-screen buff2 for further postprocessing with fxaa filter
    // otherwise we render to canvas
    var fxaa = bHaveComplexes && settings.now.fxaa;
    var volume = (volumeVisual !== null) && (volumeVisual.getMesh().material != null);
    var dstBuffer = (volume || fxaa || distortion) ? gfx.offscreenBuf2 : target;
    var srcBuffer = gfx.offscreenBuf;

    if (bHaveComplexes && settings.now.ao) {
      this._performAO(srcBuffer, gfx.offscreenBuf.depthTexture, dstBuffer, gfx.offscreenBuf3, gfx.offscreenBuf2);
    } else {
      // just copy color buffer to dst buffer
      gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 1.0, dstBuffer);
    }

    // render selected part with outline material
    this._renderSelection(camera, srcBuffer, dstBuffer);

    if (volume) {
      // copy current picture to the buffer that retains depth-data of the original molecule render
      // so that volume renderer could use depth-test
      gfx.renderer.renderScreenQuadFromTex(dstBuffer.texture, 1.0, gfx.offscreenBuf);
      dstBuffer = gfx.offscreenBuf;
      this._renderVolume(volumeVisual, camera, dstBuffer, gfx.volBFTex, gfx.volFFTex, gfx.volWFFTex);

      // if this is the last stage -- copy image to target
      if (!fxaa && !distortion) {
        gfx.renderer.renderScreenQuadFromTex(dstBuffer.texture, 1.0, target);
      }
    }

    srcBuffer = dstBuffer;

    if (fxaa) {
      dstBuffer = distortion ? gfx.offscreenBuf3 : target;
      this._performFXAA(srcBuffer, dstBuffer);
      srcBuffer = dstBuffer;
    }

    if (distortion) {
      dstBuffer = target;
      this._performDistortion(srcBuffer, dstBuffer, true);
    }
  };
})();

Miew.prototype._performDistortion = (function() {

  var _scene = new THREE.Scene();
  var _camera = new THREE.OrthographicCamera(-1.0, 1.0, 1.0, -1.0, -500, 1000);

  var _material = new THREE.ShaderMaterial({
    uniforms: {
      srcTex: {type: 't', value: null},
      aberration: {type: 'fv3', value: new THREE.Vector3(1.0)}
    },
    vertexShader: 'varying vec2 vUv; ' +
      'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }',
    fragmentShader: 'varying vec2 vUv; uniform sampler2D srcTex; uniform vec3 aberration;' +
      'void main() {' +
      'vec2 uv = vUv * 2.0 - 1.0;' +
      'gl_FragColor.r = texture2D(srcTex, 0.5 * (uv * aberration[0] + 1.0)).r;' +
      'gl_FragColor.g = texture2D(srcTex, 0.5 * (uv * aberration[1] + 1.0)).g;' +
      'gl_FragColor.b = texture2D(srcTex, 0.5 * (uv * aberration[2] + 1.0)).b;' +
      'gl_FragColor.a = 1.0;' +
      '}',
    transparent: false,
    depthTest: false,
    depthWrite: false
  });

  var _geo = gfxutils.buildDistorionMesh(10, 10, settings.now.debug.stereoBarrel);
  _scene.add(new meshes.Mesh(_geo, _material));

  return function(srcBuffer, targetBuffer, mesh) {

    this._gfx.renderer.clearTarget(targetBuffer);

    if (mesh) {
      _material.uniforms.srcTex.value = srcBuffer.texture;
      _material.uniforms.aberration.value.set(0.995, 1.0, 1.01);
      this._gfx.renderer.render(_scene, _camera, targetBuffer);
    } else {
      this._gfx.renderer.renderScreenQuadFromTexWithDistortion(
        srcBuffer,
        settings.now.debug.stereoBarrel, targetBuffer
      );
    }
  };
}());

Miew.prototype._renderSelection = (function() {

  var _outlineMaterial = new OutlineMaterial();

  return function(camera, srcBuffer, targetBuffer) {

    var self = this;
    var gfx = self._gfx;

    // clear offscreen buffer (leave z-buffer intact)
    gfx.renderer.setClearColor('black', 0);
    gfx.renderer.clearTarget(srcBuffer, true, false, false);


    // render selection to offscreen buffer
    if (gfx.selectionPivot.children.length > 0) {
      gfx.selectionRoot.matrix = gfx.root.matrix;
      gfx.selectionPivot.matrix = gfx.pivot.matrix;
      gfx.renderer.render(gfx.selectionScene, camera, srcBuffer);
    } else {
      // just render something to force "target clear" operation to finish
      gfx.renderer.renderDummyQuad(srcBuffer);
    }

    // overlay to screen
    gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 0.6, targetBuffer);

    // apply Sobel filter -- draw outline
    _outlineMaterial.uniforms.srcTex.value = srcBuffer.texture;
    _outlineMaterial.uniforms.srcTexSize.value.set(srcBuffer.width, srcBuffer.height);
    gfx.renderer.renderScreenQuad(_outlineMaterial, targetBuffer);
  };

})();

Miew.prototype._checkVolumeRenderingSupport = function(renderTarget) {
  if (!renderTarget) {
    return false;
  }
  const gfx = this._gfx;
  const oldRT = gfx.renderer.getRenderTarget();

  gfx.renderer.setRenderTarget(renderTarget);
  const context = gfx.renderer.getContext();
  const result = context.checkFramebufferStatus(context.FRAMEBUFFER);
  gfx.renderer.setRenderTarget(oldRT);
  if (result !== context.FRAMEBUFFER_COMPLETE) {
    //floatFrameBufferWarning = ;
    this.logger.warn('Device doesn\'t support electron density rendering');
    return false;
  } else {
    return true;
  }
};

Miew.prototype._renderVolume = (function() {

  var volumeBFMat = new VolumeMaterial.BackFacePosMaterial();
  var volumeFFMat = new VolumeMaterial.FrontFacePosMaterial();
  var cubeOffsetMat = new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5);
  var world2colorMat = new THREE.Matrix4();

  var volumeRenderingSupported;

  return function(volumeVisual, camera, dstBuf, tmpBuf1, tmpBuf2, tmpBuf3) {
    const gfx = this._gfx;

    if (typeof volumeRenderingSupported === 'undefined') {
      volumeRenderingSupported = this._checkVolumeRenderingSupport(tmpBuf1);
    }

    if (!volumeRenderingSupported) {
      return;
    }

    const mesh = volumeVisual.getMesh();

    mesh.rebuild(camera);

    // use main camera to prepare special textures to be used by volumetric rendering
    // these textures have the size of the window and are stored in offscreen buffers
    gfx.renderer.setClearColor('black', 0);
    gfx.renderer.clearTarget(tmpBuf1);
    gfx.renderer.clearTarget(tmpBuf2);
    gfx.renderer.clearTarget(tmpBuf3);

    // draw plane with its own material, because it differs slightly from volumeBFMat
    camera.layers.set(gfxutils.LAYERS.VOLUME_BFPLANE);
    gfx.renderer.render(gfx.scene, camera, tmpBuf1);

    camera.layers.set(gfxutils.LAYERS.VOLUME);
    gfx.scene.overrideMaterial = volumeBFMat;
    gfx.renderer.render(gfx.scene, camera, tmpBuf1);

    camera.layers.set(gfxutils.LAYERS.VOLUME);
    gfx.scene.overrideMaterial = volumeFFMat;
    gfx.renderer.render(gfx.scene, camera, tmpBuf2);

    gfx.scene.overrideMaterial = null;
    camera.layers.set(gfxutils.LAYERS.DEFAULT);

    // prepare texture that contains molecule positions
    world2colorMat.getInverse(mesh.matrixWorld);
    UberMaterial.prototype.uberOptions.world2colorMatrix.multiplyMatrices(cubeOffsetMat, world2colorMat);
    this._setUberMaterialValues({colorFromPos: true});
    gfx.renderer.render(gfx.scene, camera, tmpBuf3);
    this._setUberMaterialValues({colorFromPos: false});

    // render volume
    var vm = mesh.material;
    vm.uniforms._BFRight.value = tmpBuf1.texture;
    vm.uniforms._FFRight.value = tmpBuf2.texture;
    vm.uniforms._WFFRight.value = tmpBuf3.texture;
    camera.layers.set(gfxutils.LAYERS.VOLUME);
    gfx.renderer.render(gfx.scene, camera, dstBuf);
    camera.layers.set(gfxutils.LAYERS.DEFAULT);
  };
})();

/*  Render scene with 'ZPrepass transparency Effect'
   * Idea: transparent objects are rendered in two passes. The first one writes result only into depth buffer.
   * The second pass reads depth buffer and writes only to color buffer. The method results in
   * correct image of front part of the semi-transparent objects, but we can see only front transparent objects
   * and opaque objects inside, there is no transparent objects inside.
   * Notes: 1. Opaque objects should be rendered strictly before semi-transparent ones.
   * 2. Realization doesn't use camera layers because scene traversing is used for material changes and
   * we can use it to select needed meshes and don't complicate meshes builders with layers
  */
Miew.prototype._renderWithPrepassTransparency = (function() {

  return function(camera, targetBuffer) {
    var gfx = this._gfx;

    // opaque objects
    camera.layers.set(gfxutils.LAYERS.DEFAULT);
    gfx.renderer.render(gfx.scene, camera, targetBuffer);

    // transparent objects z prepass
    camera.layers.set(gfxutils.LAYERS.PREPASS_TRANSPARENT);
    gfx.renderer.context.colorMask(false, false, false, false); // don't update color buffer
    gfx.renderer.render(gfx.scene, camera, targetBuffer);
    gfx.renderer.context.colorMask(true, true, true, true); // update color buffer

    // transparent objects color pass
    camera.layers.set(gfxutils.LAYERS.TRANSPARENT);
    gfx.renderer.render(gfx.scene, camera, targetBuffer);

    // restore default layer
    camera.layers.set(gfxutils.LAYERS.DEFAULT);
  };
})();

Miew.prototype._performFXAA = (function() {

  var _fxaaMaterial = new FXAAMaterial();

  return function(srcBuffer, targetBuffer) {

    if (typeof srcBuffer === 'undefined' || typeof targetBuffer === 'undefined') {
      return;
    }

    var self = this;
    var gfx = self._gfx;

    // clear canvas
    gfx.renderer.setClearColor(settings.now.themes[settings.now.theme], 1);
    gfx.renderer.clearTarget(targetBuffer);

    // do fxaa processing of offscreen buff2
    _fxaaMaterial.uniforms.srcTex.value = srcBuffer.texture;
    _fxaaMaterial.uniforms.srcTexelSize.value.set(1.0 / srcBuffer.width, 1.0 / srcBuffer.height);
    _fxaaMaterial.transparent = true;
    gfx.renderer.renderScreenQuad(_fxaaMaterial, targetBuffer);
  };

})();

Miew.prototype._performAO = (function() {

  var _aoMaterial = new ao.AOMaterial();
  var _horBlurMaterial = new ao.HorBilateralBlurMaterial();
  var _vertBlurMaterial = new ao.VertBilateralBlurMaterial();

  var _noiseWidth = 4, _noiseHeight = 4;
  var _noiseData = new Uint8Array([
    0, 0, 0, 66, 0, 0, 77, 0, 0, 155, 62, 0,
    0, 247, 0, 33, 0, 0, 0, 0, 0, 235, 0, 0,
    0, 0, 0, 176, 44, 0, 232, 46, 0, 0, 29, 0,
    0, 0, 0, 78, 197, 0, 93, 0, 0, 0, 0, 0
  ]);
  var _noiseWrapS = THREE.RepeatWrapping;
  var _noiseWrapT = THREE.RepeatWrapping;
  var _noiseMinFilter = THREE.NearestFilter;
  var _noiseMagFilter = THREE.NearestFilter;
  var _noiseMapping = THREE.UVMapping;
  var _noiseTexture = new THREE.DataTexture(
    _noiseData, _noiseWidth, _noiseHeight, THREE.RGBFormat,
    THREE.UnsignedByteType, _noiseMapping, _noiseWrapS, _noiseWrapT, _noiseMagFilter, _noiseMinFilter, 1
  );
  _noiseTexture.needsUpdate = true;

  var _samplesKernel = [
    // hemisphere samples adopted to sphere (FIXME remove minus from Z)
    new THREE.Vector3(0.295184, 0.077723, 0.068429),
    new THREE.Vector3(-0.271976, -0.365221, 0.838363),
    new THREE.Vector3(0.547713, 0.467576, 0.488515),
    new THREE.Vector3(0.662808, -0.031733, 0.584758),
    new THREE.Vector3(-0.025717, 0.218955, 0.657094),
    new THREE.Vector3(-0.310153, -0.365223, 0.370701),
    new THREE.Vector3(-0.101407, -0.006313, 0.747665),
    new THREE.Vector3(-0.769138, 0.360399, 0.086847),
    new THREE.Vector3(-0.271988, -0.275140, 0.905353),
    new THREE.Vector3(0.096740, -0.566901, 0.700151),
    new THREE.Vector3(0.562872, -0.735136, 0.094647),
    new THREE.Vector3(0.379877, 0.359278, 0.190061),
    new THREE.Vector3(0.519064, -0.023055, 0.405068),
    new THREE.Vector3(-0.301036, 0.114696, 0.088885),
    new THREE.Vector3(-0.282922, 0.598305, 0.487214),
    new THREE.Vector3(-0.181859, 0.251670, 0.679702),
    new THREE.Vector3(-0.191463, -0.635818, 0.512919),
    new THREE.Vector3(-0.293655, 0.427423, 0.078921),
    new THREE.Vector3(-0.267983, 0.680534, 0.132880),
    new THREE.Vector3(0.139611, 0.319637, 0.477439),
    new THREE.Vector3(-0.352086, 0.311040, 0.653913),
    new THREE.Vector3(0.321032, 0.805279, 0.487345),
    new THREE.Vector3(0.073516, 0.820734, 0.414183),
    new THREE.Vector3(-0.155324, 0.589983, 0.411460),
    new THREE.Vector3(0.335976, 0.170782, 0.527627),
    new THREE.Vector3(0.463460, -0.355658, 0.167689),
    new THREE.Vector3(0.222654, 0.596550, 0.769406),
    new THREE.Vector3(0.922138, -0.042070, 0.147555),
    new THREE.Vector3(-0.727050, -0.329192, 0.369826),
    new THREE.Vector3(-0.090731, 0.533820, 0.463767),
    new THREE.Vector3(-0.323457, -0.876559, 0.238524),
    new THREE.Vector3(-0.663277, -0.372384, 0.342856)
  ];
  // var _kernelOffsets = [-3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0];
  var _kernelOffsets = [-2.0, -1.0, 0.0, 1.0, 2.0];

  return function(srcColorBuffer, srcDepthBuffer, targetBuffer, tempBuffer, tempBuffer1) {

    if (typeof srcColorBuffer === 'undefined' ||
          typeof srcDepthBuffer === 'undefined' ||
          typeof targetBuffer === 'undefined' ||
          typeof tempBuffer === 'undefined' ||
          typeof tempBuffer1 === 'undefined') {
      return;
    }

    var self = this;
    var gfx = self._gfx;

    // clear canvasFMatrix4
    //gfx.renderer.setClearColor(THREE.aliceblue, 1);
    //gfx.renderer.clearTarget(targetBuffer, true, false);

    // do fxaa processing of offscreen buff2
    _aoMaterial.uniforms.diffuseTexture.value = srcColorBuffer.texture;
    _aoMaterial.uniforms.depthTexture.value = srcDepthBuffer;
    _aoMaterial.uniforms.srcTexelSize.value.set(1.0 / srcColorBuffer.width, 1.0 / srcColorBuffer.height);
    _aoMaterial.uniforms.camNearFar.value.set(gfx.camera.near, gfx.camera.far);
    _aoMaterial.uniforms.projMatrix.value = gfx.camera.projectionMatrix;
    _aoMaterial.uniforms.aspectRatio.value = gfx.camera.aspect;
    _aoMaterial.uniforms.tanHalfFOV.value = Math.tan(THREE.Math.DEG2RAD * 0.5 * gfx.camera.fov);
    _aoMaterial.uniforms.samplesKernel.value = _samplesKernel;
    var translation = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3();
    gfx.root.matrix.decompose(translation, quaternion, scale);
    _aoMaterial.uniforms.kernelRadius.value = settings.now.debug.ssaoKernelRadius * scale.x;
    _aoMaterial.uniforms.depthThreshold.value = 2.0 * this._getBSphereRadius(); // diameter
    _aoMaterial.uniforms.factor.value = settings.now.debug.ssaoFactor;
    _aoMaterial.uniforms.noiseTexture.value = _noiseTexture;
    _aoMaterial.uniforms.noiseTexelSize.value.set(1.0 / _noiseWidth, 1.0 / _noiseHeight);
    var fog = gfx.scene.fog;
    if (fog) {
      _aoMaterial.uniforms.fogNearFar.value.set(fog.near, fog.far);
    }
    _aoMaterial.transparent = false;
    // N: should be tempBuffer1 for proper use of buffers (see buffers using outside the function)
    gfx.renderer.renderScreenQuad(_aoMaterial, tempBuffer1);

    _horBlurMaterial.uniforms.aoMap.value = tempBuffer1.texture;
    _horBlurMaterial.uniforms.srcTexelSize.value.set(1.0 / tempBuffer1.width, 1.0 / tempBuffer1.height);
    _horBlurMaterial.uniforms.depthTexture.value = srcDepthBuffer;
    _horBlurMaterial.uniforms.samplesOffsets.value = _kernelOffsets;
    gfx.renderer.renderScreenQuad(_horBlurMaterial, tempBuffer);

    _vertBlurMaterial.uniforms.aoMap.value = tempBuffer.texture;
    _vertBlurMaterial.uniforms.diffuseTexture.value = srcColorBuffer.texture;
    _vertBlurMaterial.uniforms.srcTexelSize.value.set(1.0 / tempBuffer.width, 1.0 / tempBuffer.height);
    _vertBlurMaterial.uniforms.depthTexture.value = srcDepthBuffer;
    _vertBlurMaterial.uniforms.samplesOffsets.value = _kernelOffsets;
    gfx.renderer.renderScreenQuad(_vertBlurMaterial, targetBuffer);
  };

})();

/**
 * Reset the viewer, unload molecules.
 * @param {boolean=} keepReps - Keep representations while resetting viewer state.
 */
Miew.prototype.reset = function(/* keepReps */) {
  if (this._picker) {
    this._picker.reset();
  }
  this._lastPick = null;

  this._releaseAllVisuals();

  this._setEditMode(EDIT_MODE.COMPLEX);

  this._resetObjects();

  if (this._gfx) {
    gfxutils.clearTree(this._gfx.pivot);
    this._gfx.renderer2d.reset();
  }

  this.setNeedRender();
};

Miew.prototype._resetScene = function() {
  this._objectControls.reset();
  this._objectControls.allowTranslation(true);
  this._objectControls.allowAltObjFreeRotation(true);
  this.resetReps();
  this.resetPivot();
  this.rebuildAll();
};

Miew.prototype.resetView = function() {
  // reset controls
  if (this._picker) {
    this._picker.reset();
  }
  this._setEditMode(EDIT_MODE.COMPLEX);
  this._resetScene();

  // reset selection
  this._forEachComplexVisual(function(visual) {
    visual.updateSelectionMask({});
    visual.rebuildSelectionGeometry();
  });
};

/**
 * Load molecule asynchronously.
 * @param {string|File} source - Molecule source to load (e.g. PDB ID, URL or File object).
 * @param {object=} opts - Options.
 * @param {string=} opts.sourceType - Data source type (e.g. 'url', 'file').
 * @param {string=} opts.fileType - Data contents type (e.g. 'pdb', 'cml').
 * @param {string=} opts.mdFile - .nc file path.
 * @param {boolean=} opts.keepRepsInfo - prevent reset of object and reps information.
 * @returns {Promise} name of the visual that was added to the viewer
 */
Miew.prototype.load = function(source, opts) {
  opts = _.merge({}, opts, {
    context: this,
  });

  // for a single-file scenario
  if (!this.settings.now.use.multiFile) {

    // abort all loaders in progress
    if (this._loading.length) {
      this._loading.forEach((job) => {
        job.cancel();
      });
      this._loading.length = 0;
    }

    // reset
    if (!opts.animation) { // FIXME: sometimes it is set AFTERWARDS!
      this.reset(true);
    }
  }

  this.dispatchEvent({type: 'load', options: opts, source});

  const job = new JobHandle();
  this._loading.push(job);
  job.addEventListener('notification', (e) => {
    this.dispatchEvent(e.slaveEvent);
  });

  this._spinner.spin(this._container);

  const onLoadEnd = (anything) => {
    const jobIndex = this._loading.indexOf(job);
    if (jobIndex !== -1) {
      this._loading.splice(jobIndex, 1);
    }
    this._spinner.stop();
    this._refreshTitle();
    return anything;
  };

  return _fetchData(source, opts, job)
    .then(data => _convertData(data, opts, job))
    .then(data => _parseData(data, opts, job))
    .then((object) => {
      const name = this._onLoad(object, opts);
      return onLoadEnd(name);
    })
    .catch((err) => {
      this.logger.error('Could not load data');
      this.logger.debug(err);
      throw onLoadEnd(err);
    });
};

/**
 * Unload molecule (delete corresponding visual).
 * @param {string=} name - name of the visual
 */
Miew.prototype.unload = function(name) {
  this._removeVisual(name || this.getCurrentVisual());
  this.resetPivot();
};

Miew.prototype._startAnimation = function(fileData) {
  this._stopAnimation();
  var self = this;
  var visual = this._getComplexVisual();
  if (visual === null) {
    this.logger.error('Unable to start animation - no molecule is loaded.');
    return;
  }
  try {
    this._frameInfo = new FrameInfo(
      visual.getComplex(), fileData,
      {
        onLoadStatusChanged: function() {
          self.dispatchEvent({
            type: 'mdPlayerStateChanged',
            state: {
              isPlaying: self._isAnimating,
              isLoading: self._frameInfo ? self._frameInfo.isLoading : true
            }
          });
        },
        onError: function(message) {
          self._stopAnimation();
          self.logger.error(message);
        }
      }
    );
  } catch (e) {
    this.logger.error('Animation file does not fit to current complex!');
    return;
  }
  this._continueAnimation();
};

Miew.prototype._startMdAnimation = function(mdFile, pdbFile) {
  this._stopAnimation();
  var self = this;
  var visual = this._getComplexVisual();
  if (visual === null) {
    this.logger.error('Unable to start animation - no molecule is loaded.');
    return;
  }
  try {
    this._frameInfo = new FrameInfo(
      visual.getComplex(), this.srvStreamMdFn(mdFile, pdbFile),
      {
        onLoadStatusChanged: function() {
          self.dispatchEvent({
            type: 'mdPlayerStateChanged',
            state: {
              isPlaying: self._isAnimating,
              isLoading: self._frameInfo ? self._frameInfo.isLoading : true
            }
          });
        },
        onError: function(message) {
          self._stopAnimation();
          self.logger.error(message);
        }
      }
    );
  } catch (e) {
    this.logger.error('Animation file does not fit to current complex!');
    return;
  }
  this._continueAnimation();
};

Miew.prototype._pauseAnimation = function() {
  if (this._animInterval === null) {
    return;
  }
  this._isAnimating = false;
  clearInterval(this._animInterval);
  this._animInterval = null;
  if (this._frameInfo) {
    this.dispatchEvent({
      type: 'mdPlayerStateChanged',
      state: {
        isPlaying: this._isAnimating,
        isLoading: this._frameInfo.isLoading
      }
    });
  }
};

Miew.prototype._continueAnimation = function() {
  this._isAnimating = true;
  var minFrameTime = 1000 / settings.now.maxfps;
  minFrameTime = Number.isNaN(minFrameTime) ? 0 : minFrameTime;
  var self = this;
  var pivot = self._gfx.pivot;
  // TODO take care of all complex visuals ?
  var visual = this._getComplexVisual();
  if (visual) {
    visual.resetSelectionMask();
    visual.rebuildSelectionGeometry();
    this._msgAtomInfo.style.opacity = 0.0;
  }
  this._animInterval = setInterval(function() {
    self.dispatchEvent({
      type: 'mdPlayerStateChanged',
      state: {
        isPlaying: self._isAnimating,
        isLoading: self._frameInfo.isLoading
      }
    });
    if (self._frameInfo.frameIsReady) {
      pivot.updateToFrame(self._frameInfo);
      self._updateObjsToFrame(self._frameInfo);
      self._refreshTitle(' Frame ' + self._frameInfo._currFrame + ' of ' + self._frameInfo._framesCount +
          ' time interval - ' + self._frameInfo._timeStep);
      try {
        self._frameInfo.nextFrame();
      } catch (e) {
        self.logger.error('Error during animation');
        self._stopAnimation();
        return;
      }
      self._needRender = true;
    }
  }, minFrameTime);
};

Miew.prototype._stopAnimation = function() {
  if (this._animInterval === null) {
    return;
  }
  clearInterval(this._animInterval);
  this._frameInfo.disableEvents();
  this._frameInfo = null;
  this._animInterval = null;
  this._srvAnimSource = null;
  this.dispatchEvent({
    type: 'mdPlayerStateChanged',
    state: null
  });
};

/**
 * Invoked upon successful loading of some data source
 * @param {DataSource} dataSource - Data source for visualization (molecular complex or other)
 * @param {object} opts - TODO: Options.
 * @private
 */
Miew.prototype._onLoad = function(dataSource, opts) {
  var gfx = this._gfx;
  var visualName = null;

  if (opts.animation) {
    this._refreshTitle();
    this._startAnimation(dataSource);
    return null;
  } else {
    this._stopAnimation();
    if (!opts || !opts.keepRepsInfo) {
      this._opts.reps = null;
      this._opts._objects = null;
    }
  }

  if (dataSource.id === 'Complex') {
    var complex = dataSource;

    // update title
    if (opts.fileName) {
      complex.name = complex.name || removeExtension(opts.fileName).toUpperCase();
    } else if (opts.amberFileName) {
      complex.name = complex.name || removeExtension(opts.amberFileName).toUpperCase();
    } else {
      complex.name = 'Dynamic ' + opts.fileType + ' molecule';
    }

    visualName = this._addVisual(new ComplexVisual(complex.name, complex));
    this._curVisualName = visualName;

    var desc = this.info();
    this.logger.info('Parsed ' + opts.fileName + ' (' +
        desc.atoms + ' atoms, ' +
        desc.bonds + ' bonds, ' +
        desc.residues + ' residues, ' +
        desc.chains + ' chains).');

    if (_.isNumber(this._opts.unit)) {
      complex.setCurrentStructure(this._opts.unit);
    }

    if (opts.preset) {
      this.srvPresetApply(opts.preset);
    } else if (settings.now.autoPreset) {
      switch (opts.fileType) {
      case 'cml':
        this.resetReps('small');
        break;
      case 'pdb':
      case 'mmtf':
      case 'cif':
        if (hasValidResidues(complex)) {
          this.resetReps('macro');
        } else {
          this.resetReps('small');
        }
        break;
      default:
        this.resetReps('default');
        break;
      }
    } else {
      this.resetReps('default');
    }
  } else if (dataSource.id === 'Volume') {
    this.resetEd();
    visualName = this._onLoadEd(dataSource);
  }

  gfx.camera.updateProjectionMatrix();
  this._updateFog();

  // reset global transform & camera pan
  gfx.root.resetTransform();
  this.resetPivot();
  this.resetPan();

  // set scale to fit everything on the screen
  this._objectControls.setScale(settings.now.radiusToFit / this._getBSphereRadius());

  this._resetObjects();

  if (settings.now.autoResolution) {
    this._tweakResolution();
  }

  if (this._opts.view) {
    this.view(this._opts.view);
    delete this._opts.view;
  }

  if (opts.error) {
    this.dispatchEvent({type: 'onParseError', error: opts.error});
  } else {
    this.dispatchEvent({type: 'onParseDone'});
  }

  this._refreshTitle();

  if (opts.convertedFile && opts.mdFile) {
    this._startMdAnimation(opts.mdFile, opts.convertedFile);
  }

  return visualName;
};

Miew.prototype.resetEd = function() {
  if (this._edLoader) {
    this._edLoader.abort();
    this._edLoader = null;
  }

  // free all resources
  this._removeVisual(this._getVolumeVisual());

  this._needRender = true;
};

Miew.prototype.loadEd = function(source) {
  this.resetEd();

  const TheLoader = _.head(io.loaders.find({source}));
  if (!TheLoader) {
    this.logger.error('Could not find suitable loader for this source');
    return Promise.reject(new Error('Could not find suitable loader for this source'));
  }

  const loader = this._edLoader = new TheLoader(source, {binary: true});
  loader.context = this;
  return loader.load().then((data) => {
    const TheParser = _.head(io.parsers.find({format: 'ccp4'}));
    if (!TheParser) {
      throw new Error('Could not find suitable parser for this source');
    }
    const parser = new TheParser(data);
    parser.context = this;
    return parser.parse().then((dataSource) => {
      this._onLoadEd(dataSource);
    });
  }).catch((error) => {
    this.logger.error('Could not load ED data');
    this.logger.debug(error);
  });
};

Miew.prototype._onLoadEd = function(dataSource) {
  dataSource.normalize();

  var volumeVisual = new VolumeVisual('volume', dataSource);
  volumeVisual.getMesh().layers.set(gfxutils.LAYERS.VOLUME); // volume mesh is not visible to common render
  var visualName = this._addVisual(volumeVisual);

  this._needRender = true;
  return visualName;
};

Miew.prototype._needRebuild = function() {
  var needsRebuild = false;
  this._forEachComplexVisual(function(visual) {
    needsRebuild = needsRebuild || visual.needsRebuild();
  });
  return needsRebuild;
};

Miew.prototype._rebuildObjects = function() {
  var self = this;
  var gfx = this._gfx;
  var i, n;

  // remove old object geometry
  var toRemove = [];
  for (i = 0; i < gfx.pivot.children.length; ++i) {
    var child = gfx.pivot.children[i];
    if (!(child instanceof Visual)) {
      toRemove.push(child);
    }
  }
  for (i = 0; i < toRemove.length; ++i) {
    toRemove[i].parent.remove(toRemove[i]);
  }

  setTimeout(function _rebuild() {
    var objList = self._objects;
    for (i = 0, n = objList.length; i < n; ++i) {
      var obj = objList[i];
      if (obj.needsRebuild) {
        obj.build();
      }
      if (obj.getGeometry()) {
        gfx.pivot.add(obj.getGeometry());
      }
    }
  }, 10);
};

Miew.prototype.changeUnit = function(unitIdx, name) {
  const visual = this._getComplexVisual(name);
  if (!visual) {
    throw new Error('There is no complex to change!');
  }

  function currentUnitInfo() {
    const unit = visual ? visual.getComplex().getCurrentStructure() : 0;
    const type = unit > 0 ? ('Bio molecule ' + unit) : 'Asymmetric unit';
    return 'Current unit: ' + unit + ' (' + type + ')';
  }

  if (unitIdx === undefined) {
    return currentUnitInfo();
  }
  if (_.isString(unitIdx)) {
    unitIdx = Math.max(parseInt(unitIdx, 10), 0);
  }
  if (visual.getComplex().setCurrentStructure(unitIdx)) {
    this._resetScene();
  }
  return currentUnitInfo();
};

/**
 * Start to rebuild geometry asynchronously.
 */
Miew.prototype.rebuild = function() {
  if (this._building) {
    this.logger.warn('Miew.rebuild(): already building!');
    return;
  }
  this._building = true;

  this.dispatchEvent({type: 'rebuild'});

  this._rebuildObjects();

  this._gfx.renderer2d.reset();

  var rebuildActions = [];
  this._forEachComplexVisual(function(visual) {
    if (visual.needsRebuild()) {
      rebuildActions.push(visual.rebuild().then(function() {
        return new Promise(function(resolve) {
          visual.rebuildSelectionGeometry();
          resolve();
        });
      }));
    }
  });

  // Start asynchronous rebuild
  var self = this;
  this._spinner.spin(this._container);
  Promise.all(rebuildActions).then(function() {
    self._spinner.stop();


    self._needRender = true;

    // TODO: Gather geometry stats?
    self._refreshTitle();
    self._building = false;
  });
};

/** Mark all representations for rebuilding */
Miew.prototype.rebuildAll = function() {
  this._forEachComplexVisual(function(visual) {
    visual.setNeedsRebuild();
  });
  // this.rebuild(); // TODO: isn't implicit rebuild enough?
};

Miew.prototype._refreshTitle = function(appendix) {
  var title;
  appendix = appendix === undefined ? '' : appendix;
  var visual = this._getComplexVisual();
  if (visual) {
    title = visual.getComplex().name;
    var rep = visual.repGet(visual.repCurrent());
    title += (rep ? ' – ' + rep.mode.name + ' Mode' : '');
  } else {
    title = Object.keys(this._visuals).length > 0 ? 'Unknown' : 'No Data';
  }
  title += appendix;

  this.dispatchEvent({type: 'titleChanged', data: title});
};

Miew.prototype.setNeedRender = function() {
  this._needRender = true;
};

Miew.prototype._extractRepresentation = function() {
  const changed = [];

  this._forEachComplexVisual((visual) => {
    if (visual.getSelectionCount() === 0) {
      return;
    }

    const selector = visual.buildSelectorFromMask(1 << visual.getSelectionBit());
    const defPreset = settings.now.presets.default;
    const idx = visual.repAdd({
      selector: selector, mode: defPreset[0].mode.id,
      colorer: defPreset[0].colorer.id,
      material: defPreset[0].material.id
    });
    if (idx < 0) {
      if (visual.repCount() === ComplexVisual.NUM_REPRESENTATION_BITS) {
        this.logger.warn(`Number of representations is limited to ${ComplexVisual.NUM_REPRESENTATION_BITS}`);
      }
      return;
    }

    visual.repCurrent(idx);

    changed.push(visual.name);
  });

  if (changed.length > 0) {
    this.logger.report(`New representation from selection for complexes: ${changed.join(', ')}`);
    this.dispatchEvent({type: 'repAdd'});
  }
};

/**
 * Change current representation list.
 * @param {array} reps - Representation list.
 */
Miew.prototype._setReps = function(reps) {
  reps = reps || (this._opts && this._opts.reps) || [];
  this._forEachComplexVisual(visual => visual.resetReps(reps));
};

/**
 * Apply existing preset to current scene.
 * @param preset
 */
Miew.prototype.applyPreset = function(preset) {
  const presets = settings.now.presets;
  const presList = [
    preset || settings.defaults.preset,
    settings.defaults.preset,
    Object.keys(presets)[0],
  ];
  let reps = null;
  for (let i = 0; !reps && i < presList.length; ++i) {
    settings.now.preset = presList[i];
    reps = presets[settings.now.preset];
    if (!reps) {
      this.logger.warn('Unknown preset "' + settings.now.preset + '"');
    }
  }
  this._setReps(reps);
};

/**
 * Reset current representation list to initial values.
 * @param {string} [preset] - The source preset in case of uninitialized representation list.
 */
Miew.prototype.resetReps = function(preset) {
  let reps = this._opts && this._opts.reps;
  if (reps) {
    this._setReps(reps);
  } else {
    this.applyPreset(preset);
  }
};

/**
 * Get number of representations created so far.
 * @returns {number} Number of reps.
 */
Miew.prototype.repCount = function(name) {
  var visual = this._getComplexVisual(name);
  return visual ? visual.repCount() : 0;
};

/**
 * Get or set the current representation index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
 * @param {string=} [name] - Complex name. Defaults to the current one.
 * @returns {number} The current index.
 */
Miew.prototype.repCurrent = function(index, name) {
  const visual = this._getComplexVisual(name);
  const newIdx = visual ? visual.repCurrent(index) : -1;
  if (index && newIdx !== index) {
    this.logger.warn(`Representation ${index} was not found. Current rep remains unchanged.`);
  }
  return newIdx;
};

/**
 * Get or set representation by index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount}(). Defaults to the current one.
 * @param {object=} rep - Optional representation description.
 * @param {string=} rep.selector - Selector string.
 * @param {string=} rep.mode - Mode id.
 * @param {string=} rep.colorer - Colorer id.
 * @param {string=} rep.material - Material id.
 * @returns {?object} Representation description.
 */
Miew.prototype.rep = function(index, rep) {
  // FIXME support targeting visual by name
  const visual = this._getComplexVisual('');
  return visual ? visual.rep(index, rep) : null;
};

/**
 * Get representation (not just description) by index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount}(). Defaults to the current one.
 * @returns {?object} Representation.
 */
Miew.prototype.repGet = function(index, name) {
  var visual = this._getComplexVisual(name);
  return visual ? visual.repGet(index) : null;
};

/**
 * Add new representation.
 * @param {object=} rep - Representation description.
 * @returns {number} Index of the new representation.
 */
Miew.prototype.repAdd = function(rep, name) {
  var visual = this._getComplexVisual(name);
  return visual ? visual.repAdd(rep) : -1;
};

/**
 * Remove representation.
 * @param {number=} index - Zero-based representation index.
 */
Miew.prototype.repRemove = function(index, name) {
  var visual = this._getComplexVisual(name);
  return visual ? visual.repRemove(index) : null;
};

/**
 * Hide representation.
 * @param {number} index - Zero-based representation index.
 * @param {boolean=} hide - Specify false to make rep visible, true to hide (by default).
 */
Miew.prototype.repHide = function(index, hide, name) {
  this._needRender = true;
  var visual = this._getComplexVisual(name);
  return visual ? visual.repHide(index, hide) : null;
};

Miew.prototype._setEditMode = function(mode) {

  this._editMode = mode;

  var elem = this._msgMode;
  if (elem) {
    elem.style.opacity = (mode === EDIT_MODE.COMPLEX) ? 0.0 : 1.0;

    if (mode !== EDIT_MODE.COMPLEX) {
      var t = elem.getElementsByTagName('p')[0];
      t.innerHTML = (mode === EDIT_MODE.COMPONENT) ? 'COMPONENT EDIT MODE' : 'FRAGMENT EDIT MODE';
    }
  }

  this.dispatchEvent({type: 'editModeChanged', data: mode === EDIT_MODE.COMPLEX});
};

Miew.prototype._enterComponentEditMode = function() {

  if (this._editMode !== EDIT_MODE.COMPLEX) {
    return;
  }

  var editors = [];
  this._forEachComplexVisual(function(visual) {
    var editor = visual.beginComponentEdit();
    if (editor) {
      editors.push(editor);
    }
  });

  if (editors === []) {
    return;
  }

  this._editors = editors;

  this.logger.info('COMPONENT EDIT MODE -- ON');
  this._setEditMode(EDIT_MODE.COMPONENT);
  this._objectControls.keysTranslateObj(true);
};

Miew.prototype._applyComponentEdit = function() {
  if (this._editMode !== EDIT_MODE.COMPONENT) {
    return;
  }

  this._objectControls.stop();
  this._objectControls.keysTranslateObj(false);

  for (var i = 0; i < this._editors.length; ++i) {
    this._editors[i].apply();
  }
  this._editors = [];

  this.logger.info('COMPONENT EDIT MODE -- OFF (applied)');
  this._setEditMode(EDIT_MODE.COMPLEX);

  this.rebuildAll();
};

Miew.prototype._discardComponentEdit = function() {
  if (this._editMode !== EDIT_MODE.COMPONENT) {
    return;
  }

  this._objectControls.stop();
  this._objectControls.keysTranslateObj(false);

  for (var i = 0; i < this._editors.length; ++i) {
    this._editors[i].discard();
  }
  this._editors = [];

  this.logger.info('COMPONENT EDIT MODE -- OFF (discarded)');
  this._setEditMode(EDIT_MODE.COMPLEX);

  this._needRender = true;
};

Miew.prototype._enterFragmentEditMode = function() {

  if (this._editMode !== EDIT_MODE.COMPLEX) {
    return;
  }

  var selectedVisuals = [];
  this._forEachComplexVisual(function(visual) {
    if (visual instanceof ComplexVisual &&
          visual.getSelectionCount() > 0) {
      selectedVisuals.push(visual);
    }
  });

  if (selectedVisuals.length !== 1) {
    // either we have no selection or
    // we have selected atoms in two or more visuals -- not supported
    return;
  }

  var editor = selectedVisuals[0].beginFragmentEdit();
  if (!editor) {
    return;
  }
  this._editors = [editor];

  this.logger.info('FRAGMENT EDIT MODE -- ON (single bond)');
  this._setEditMode(EDIT_MODE.FRAGMENT);
  this._objectControls.allowTranslation(false);
  this._objectControls.allowAltObjFreeRotation(editor.isFreeRotationAllowed());

  this._needRender = true;
};

Miew.prototype._applyFragmentEdit = function() {
  if (this._editMode !== EDIT_MODE.FRAGMENT) {
    return;
  }

  this._objectControls.stop();

  for (var i = 0; i < this._editors.length; ++i) {
    this._editors[i].apply();
  }
  this._editors = [];

  this.logger.info('FRAGMENT EDIT MODE -- OFF (applied)');
  this._setEditMode(EDIT_MODE.COMPLEX);
  this._objectControls.allowTranslation(true);
  this._objectControls.allowAltObjFreeRotation(true);

  this.rebuildAll();
};

Miew.prototype._discardFragmentEdit = function() {
  if (this._editMode !== EDIT_MODE.FRAGMENT) {
    return;
  }

  this._objectControls.stop();

  for (var i = 0; i < this._editors.length; ++i) {
    this._editors[i].discard();
  }
  this._editors = [];

  this.logger.info('FRAGMENT EDIT MODE -- OFF (discarded)');
  this._setEditMode(EDIT_MODE.COMPLEX);
  this._objectControls.allowTranslation(true);
  this._objectControls.allowAltObjFreeRotation(true);

  this._needRender = true;
};

/** @deprecated  Move object instead of panning the camera */
Miew.prototype.resetPan = function() {
  this._gfx.camera.position.x = 0.0;
  this._gfx.camera.position.y = 0.0;
  this.dispatchEvent({type: 'transform'});
};

Miew.prototype._onPick = function(event) {
  if (!settings.now.picking) {
    // picking is disabled
    return;
  }

  if (this._animInterval !== null) {
    // animation playback is on
    return;
  }

  if (this._editMode === EDIT_MODE.FRAGMENT) {
    // prevent picking in fragment edit mode
    return;
  }

  if (this._objectControls.isEditingAltObj()) {
    // prevent picking during component rotation
    return;
  }

  // update last pick & find complex
  var complex = null;
  if (event.obj.atom) {
    complex = event.obj.atom.getResidue().getChain().getComplex();
    this._lastPick = event.obj.atom;
  } else if (event.obj.residue) {
    complex = event.obj.residue.getChain().getComplex();
    this._lastPick = event.obj.residue;
  } else if (event.obj.chain) {
    complex = event.obj.chain.getComplex();
    this._lastPick = event.obj.chain;
  } else if (event.obj.molecule) {
    complex = event.obj.molecule.getComplex();
    this._lastPick = event.obj.molecule;
  } else {
    this._lastPick = null;
  }

  function _updateSelection(visual) {
    visual.updateSelectionMask(event.obj);
    visual.rebuildSelectionGeometry();
  }

  // update visual
  if (complex) {
    var visual = this._getVisualForComplex(complex);
    if (visual) {
      _updateSelection(visual);
      this._needRender = true;
    }
  } else {
    this._forEachComplexVisual(_updateSelection);
    this._needRender = true;
  }

  this._updateInfoPanel();
};

Miew.prototype._onDblClick = function(event) {
  if ('atom' in event.obj) {
    this.setPivotAtom(event.obj.atom);
  } else if ('residue' in event.obj) {
    this.setPivotResidue(event.obj.residue);
  } else {
    this.resetPivot();
  }

  this.resetPan();
  this._needRender = true;
};

Miew.prototype._onKeyDown = function(event) {
  if (!this._running || !this._hotKeysEnabled) {
    return;
  }

  switch (event.keyCode) {
  case 'C'.charCodeAt(0):
    if (settings.now.editing) {
      this._enterComponentEditMode();
    }
    break;
  case 'F'.charCodeAt(0):
    if (settings.now.editing) {
      this._enterFragmentEditMode();
    }
    break;
  case 'A'.charCodeAt(0):
    switch (this._editMode) {
    case EDIT_MODE.COMPONENT: this._applyComponentEdit(); break;
    case EDIT_MODE.FRAGMENT: this._applyFragmentEdit(); break;
    default: break;
    }
    break;
  case 'D'.charCodeAt(0):
    switch (this._editMode) {
    case EDIT_MODE.COMPONENT: this._discardComponentEdit(); break;
    case EDIT_MODE.FRAGMENT: this._discardFragmentEdit(); break;
    default: break;
    }
    break;
  case 'S'.charCodeAt(0):
    event.preventDefault();
    event.stopPropagation();
    settings.now.ao = !settings.now.ao;
    this._needRender = true;
    break;
  case 107:
    event.preventDefault();
    event.stopPropagation();
    this._forEachComplexVisual(function(visual) {
      visual.expandSelection();
      visual.rebuildSelectionGeometry();
    });
    this._updateInfoPanel();
    this._needRender = true;
    break;
  case 109:
    event.preventDefault();
    event.stopPropagation();
    this._forEachComplexVisual(function(visual) {
      visual.shrinkSelection();
      visual.rebuildSelectionGeometry();
    });
    this._updateInfoPanel();
    this._needRender = true;
    break;
  default:
  }
};

Miew.prototype._onKeyUp = function(event) {
  if (!this._running || !this._hotKeysEnabled) {
    return;
  }

  if (event.keyCode === 'X'.charCodeAt(0)) {
    this._extractRepresentation();
  }
};

Miew.prototype._updateInfoPanel = function() {
  var info = this._msgAtomInfo.getElementsByTagName('p')[0];
  var atom, residue;

  var count = 0;
  this._forEachComplexVisual(function(visual) {
    count += visual.getSelectionCount();
  });

  while (info.firstChild) {
    info.removeChild(info.firstChild);
  }

  if (count === 0) {
    this._msgAtomInfo.style.opacity = 0.0;
    return;
  }

  let firstLine = `${String(count)} atom${count !== 1 ? 's' : ''} selected`;
  if (this._lastPick !== null) {
    firstLine += ', the last pick:';
  }
  let secondLine = '';
  let aName = '';
  let coordLine = '';

  if (this._lastPick instanceof Atom) {
    atom = this._lastPick;
    residue = atom._residue;

    var an = atom.getName();
    if (an.getNode() !== null) {
      aName = an.getNode();
    } else {
      aName = an.getString();
    }
    var location = (atom._location !== 32) ? String.fromCharCode(atom._location) : ''; // 32 is code of white-space
    secondLine = `${atom.element.fullName} #${atom._serial}${location}: \
      ${residue._chain._name}.${residue._type._name}${residue._sequence}${residue._icode.trim()}.`;
    if (typeof aName === 'string') {
      // add atom name to second line in plain text form
      secondLine += aName;
    }

    coordLine = `Coord: (${atom._position.x.toFixed(2).toString()},\
     ${atom._position.y.toFixed(2).toString()},\
     ${atom._position.z.toFixed(2).toString()})`;

  } else if (this._lastPick instanceof Residue) {
    residue = this._lastPick;

    secondLine = `${residue._type._fullName}: \
      ${residue._chain._name}.${residue._type._name}${residue._sequence}${residue._icode.trim()}`;
  } else if (this._lastPick instanceof Chain) {
    secondLine = `chain ${this._lastPick._name}`;
  } else if (this._lastPick instanceof Molecule) {
    secondLine = `molecule ${this._lastPick._name}`;
  }

  info.appendChild(document.createTextNode(firstLine));

  if (secondLine !== '') {
    info.appendChild(document.createElement('br'));
    info.appendChild(document.createTextNode(secondLine));
  }

  if (typeof aName !== 'string') {
    // add atom name to second line in HTML form
    const newNode = aName.cloneNode(true);
    newNode.style.fontSize = '85%';
    info.appendChild(newNode);
  }

  if (coordLine !== '') {
    info.appendChild(document.createElement('br'));
    info.appendChild(document.createTextNode(coordLine));
  }

  this._msgAtomInfo.style.opacity = 1.0;
};

Miew.prototype._getAltObj = function() {
  if (this._editors) {
    var altObj = null;
    for (var i = 0; i < this._editors.length; ++i) {
      var nextAltObj = this._editors[i].getAltObj();
      if (nextAltObj.objects.length > 0) {
        if (altObj) {
          // we have selected atoms in two or more visuals -- not supported
          altObj = null;
          break;
        }
        altObj = nextAltObj;
      }
    }
    if (altObj) {
      return altObj;
    }
  }

  return {
    objects: [],
    pivot: new THREE.Vector3(0, 0, 0)
  };
};

Miew.prototype.resetPivot = function() {
  var boundingBox = new THREE.Box3();
  this._forEachVisual(function(visual) {
    boundingBox.union(visual.getBoundaries().boundingBox);
  });

  boundingBox.getCenter(this._gfx.pivot.position);
  this._gfx.pivot.position.negate();
  this.dispatchEvent({type: 'transform'});
};

Miew.prototype.setPivotResidue = function(residue) {
  var visual = this._getVisualForComplex(residue.getChain().getComplex());
  if (!visual) {
    return;
  }

  var pos = this._gfx.pivot.position;
  if (residue._controlPoint) {
    pos.copy(residue._controlPoint);
  } else {
    var x = 0, y = 0, z = 0;
    var amount = residue._atoms.length;
    for (var i = 0; i < amount; ++i) {
      var p = residue._atoms[i]._position;
      x += p.x / amount;
      y += p.y / amount;
      z += p.z / amount;
    }
    pos.set(x, y, z);
  }
  pos.applyMatrix4(visual.matrix);
  pos.negate();
  this.dispatchEvent({type: 'transform'});
};

Miew.prototype.setPivotAtom = function(atom) {
  var visual = this._getVisualForComplex(atom.getResidue().getChain().getComplex());
  if (!visual) {
    return;
  }

  var pos = this._gfx.pivot.position;
  pos.copy(atom._position);
  pos.applyMatrix4(visual.matrix);
  pos.negate();
  this.dispatchEvent({type: 'transform'});
};

Miew.prototype.benchmarkGfx = function(force) {
  var self = this;
  var prof = new GfxProfiler(this._gfx.renderer);

  return new Promise(function(resolve) {
    if (!force && !settings.now.autoResolution) {
      resolve();
      return;
    }

    self.dispatchEvent({type: 'profile'});

    self._spinner.spin(self._container);
    prof.runOnTicks(50, 1000, 2000).then(function(numResults) {
      self._gfxScore = 0.0;
      if (numResults >= 5) {
        self._gfxScore = 1000.0 / prof.mean();
      }
      if (numResults > 0) {
        self._gfxScore = 0.5 * numResults;
      }
      // document.getElementById('atom-info').innerHTML = 'GFX score: ' + self._gfxScore.toPrecision(2);

      self._spinner.stop();
      resolve();
    });
  });
};

/**
 * Makes a screenshot.
 * @param {number} [width] - Width of an image. Defaults to the canvas width.
 * @param {number} [height] - Height of an image. Defaults to the width (square) or canvas height,
 *        if width is omitted too.
 * @returns {string} Data URL representing the image contents.
 */
Miew.prototype.screenshot = function(width, height) {
  var gfx = this._gfx;

  function Fov2Tan(fov) {
    return Math.tan(THREE.Math.degToRad(0.5 * fov));
  }

  function Tan2Fov(tan) {
    return THREE.Math.radToDeg(Math.atan(tan)) * 2.0;
  }

  height = height || width || gfx.height;
  width = width || gfx.width;

  var screenshotURI;

  if (width === gfx.width && height === gfx.height) {
    // copy current canvas to screenshot
    screenshotURI = gfx.renderer.domElement.toDataURL('image/png');
  } else {

    var originalAspect = gfx.camera.aspect;
    var originalFov = gfx.camera.fov;
    var originalTanFov2 = Fov2Tan(gfx.camera.fov);

    // screenshot should contain the principal area of interest (a centered square touching screen sides)
    var areaOfInterestSize = Math.min(gfx.width, gfx.height);
    //var areaOfInterestFov = originalFov * areaOfInterestSize / gfx.height;
    var areaOfInterestTanFov2 = originalTanFov2 * areaOfInterestSize / gfx.height;

    // set appropriate camera aspect & FOV
    var shotAspect = width / height;
    gfx.camera.aspect = shotAspect;
    gfx.camera.fov = Tan2Fov(areaOfInterestTanFov2 / Math.min(shotAspect, 1.0));
    gfx.camera.updateProjectionMatrix();

    // resize canvas to the required size of screenshot
    gfx.renderer.setSize(width, height);

    // make screenshot
    this._renderFrame('NONE');
    screenshotURI = gfx.renderer.domElement.toDataURL('image/png');

    // restore original camera & canvas proportions
    gfx.camera.aspect = originalAspect;
    gfx.camera.fov = originalFov;
    gfx.camera.updateProjectionMatrix();
    gfx.renderer.setSize(gfx.width, gfx.height);
    this._needRender = true;
  }

  return screenshotURI;
};

/**
 * Makes screenshot and initiates a download.
 * @param {string} [filename] - Name of a file. Default to a 'screenshot-XXXXX.png', where XXXXX is a current
 *        date/time in seconds.
 * @param {number} [width] - Width of an image. Defaults to the canvas width.
 * @param {number} [height] - Height of an image. Defaults to the width (square) or canvas height,
 *        if width is omitted too.
 */
Miew.prototype.screenshotSave = function(filename, width, height) {
  var uri = this.screenshot(width, height);
  utils.shotDownload(uri, filename);
};

Miew.prototype._tweakResolution = function() {
  var maxPerf = [
    ['poor', 100],
    ['low', 500],
    ['medium', 1000],
    ['high', 5000],
    ['ultra', Number.MAX_VALUE]
  ];

  var atomCount = 0;
  this._forEachComplexVisual(function(visual) {
    atomCount += visual.getComplex().getAtomCount();
  });

  if (atomCount > 0) {
    var performance = this._gfxScore * 10e5 / atomCount;
    // set resolution based on estimated performance
    for (var i = 0; i < maxPerf.length; ++i) {
      if (performance < maxPerf[i][1]) {
        this._autoChangeResolution(maxPerf[i][0]);
        break;
      }
    }
  }
};

Miew.prototype._autoChangeResolution = function(resolution) {
  if (resolution !== settings.now.resolution) {
    this.logger.report('Your rendering resolution was changed to "' + resolution + '" for best performance.');
  }
  settings.now.resolution = resolution;
};

/**
 * Save current settings to cookies.
 */
Miew.prototype.saveSettings = function() {
  this._cookies.setCookie(this._opts.settingsCookie, JSON.stringify(this.settings.getDiffs(true)));
};

Miew.prototype._loadSettings = function() {
  try {
    const cookie = this._cookies.getCookie(this._opts.settingsCookie);
    const diffs = cookie ? JSON.parse(cookie) : {};
    this.settings.applyDiffs(diffs, true);
  } catch (e) {
    this.logger.error('Cookies parse error: ' + e.message);
  }
};

/**
 * Load settings from cookies.
 */
Miew.prototype.restoreSettings = function() {
  const oldSettings = _.cloneDeep(this.settings.now);
  this._loadSettings();
  const changes = utils.objectsDiff(this.settings.now, oldSettings);
  this._onSettingsChanged(changes);
};

/**
 * Reset current settings to the defaults.
 */
Miew.prototype.resetSettings = function() {
  const oldSettings = _.cloneDeep(this.settings.now);
  this.settings.reset();
  const changes = utils.objectsDiff(this.settings.now, oldSettings);
  this._onSettingsChanged(changes);
};

/*
   * DANGEROUS and TEMPORARY. The method should change or disappear in future versions.
   * @param {string|object} opts - See {@link Miew} constructor.
   * @see {@link Miew#set}, {@link Miew#repAdd}, {@link Miew#rep}.
   */
Miew.prototype.setOptions = function(opts) {
  if (typeof opts === 'string') {
    opts = Miew.options.fromAttr(opts);
  }
  if (opts.reps) {
    this._opts.reps = null;
  }
  _.merge(this._opts, opts);
  if (opts.settings) {
    this.set(opts.settings);
  }

  this._opts._objects = opts._objects;
  this._resetObjects();

  if (opts.load) {
    this.load(opts.load, {fileType: opts.type});
  }

  if (opts.preset) {
    settings.now.preset = opts.preset;
  }

  if (opts.reps) {
    this.resetReps(opts.preset);
  }

  if (this._opts.view) {
    this.view(this._opts.view);
    delete this._opts.view;
  }

  // FIXME we need a way to associate "unit" option with particular complex
  const visual = this._getComplexVisual();
  if (visual) {
    visual.getComplex().resetCurrentStructure();
    if (_.isNumber(opts.unit)) {
      visual.getComplex().setCurrentStructure(opts.unit);
    }
    this.resetView();
    this.rebuildAll();
  }
};

Miew.prototype.info = function(name) {
  var visual = this._getComplexVisual(name);
  if (!visual) {
    return {};
  }
  var complex = visual.getComplex();
  var metadata = complex.metadata;
  return {
    id: metadata.id || complex.name || 'UNKNOWN',
    title: metadata.title && metadata.title.join(' ') || 'UNKNOWN DATA',
    atoms: complex.getAtomCount(),
    bonds: complex.getBondCount(),
    residues: complex.getResidueCount(),
    chains: complex.getChainCount(),
  };
};

/*
   * OBJECTS SEGMENT
   */

Miew.prototype.addObject = function(objData, bThrow) {
  var Ctor = null;

  // TODO change this to factory when better times come.
  if (objData.type === LinesObject.prototype.type) {
    Ctor = LinesObject;
  }

  if (Ctor === null) {
    throw new Error('Unknown scene object type - ' + objData.type);
  }

  try {
    var newObj = new Ctor(objData.params, objData.opts);
    this._addSceneObject(newObj);
  } catch (error) {
    if (!bThrow) {
      this.logger.debug('Error during scene object creation: ' + error.message);
    } else {
      throw error;
    }
  }
  this._needRender = true;
};

Miew.prototype._addSceneObject = function(sceneObject) {
  var visual = this._getComplexVisual();
  if (sceneObject.build && visual) {
    sceneObject.build(visual.getComplex());
    this._gfx.pivot.add(sceneObject.getGeometry());
  }
  var objects = this._objects;
  objects[objects.length] = sceneObject;
};

Miew.prototype._updateObjsToFrame = function(frameData) {
  var objs = this._objects;
  for (var i = 0, n = objs.length; i < n; ++i) {
    if (objs[i].updateToFrame) {
      objs[i].updateToFrame(frameData);
    }
  }
};

Miew.prototype._resetObjects = function() {
  var objs = this._opts._objects;

  this._objects = [];
  if (objs) {
    for (var i = 0, n = objs.length; i < n; ++i) {
      this.addObject(objs[i], false);
    }
  }
};

Miew.prototype.removeObject = function(index) {
  var obj = this._objects[index];
  if (!obj) {
    throw new Error('Scene object with index ' + index + ' does not exist');
  }
  obj.destroy();
  this._objects.splice(index, 1);
  this._needRender = true;
};

/**
 * Get a string with a URL to reproduce the current scene.
 *
 * @param {boolean} [opts.compact=true] - set this flag to false if you want to include full
 * preset information regardless of the differences with settings
 * @param {boolean} [opts.settings=false] - when this flag is true, changes in settings are included
 * @param {boolean} [opts.view=false] - when this flag is true, a view information is included
 * @returns {string} URL
 */
Miew.prototype.getURL = function(opts) {
  return options.toURL(this.getState(_.defaults(opts, {
    compact: true,
    settings: false,
    view: false,
  })));
};

/**
 * Get a string with a script to reproduce the current scene.
 *
 * @param {boolean} [opts.compact=true] - set this flag to false if you want to include full
 * preset information regardless of the differences with settings
 * @param {boolean} [opts.settings=true] - when this flag is true, changes in settings are included
 * @param {boolean} [opts.view=true] - when this flag is true, a view information is included
 * @returns {string} script
 */
Miew.prototype.getScript = function(opts) {
  return options.toScript(this.getState(_.defaults(opts, {
    compact: true,
    settings: true,
    view: true,
  })));
};

/*
   * Generates object that represents the current state of representations list
   * @param {boolean} compareWithDefaults - when this flag is true, reps list is compared (if possible)
   * to preset's defaults and only diffs are generated
   */
Miew.prototype._compareReps = function(complexVisual, compareWithDefaults) {
  var ans = {};
  var repCount = 0;

  if (complexVisual) {
    repCount = complexVisual.repCount();
  }

  var currPreset = settings.defaults.presets[settings.now.preset];
  var compare = compareWithDefaults;
  if (currPreset === undefined || currPreset.length > repCount) {
    compare = false;
    ans.preset = 'empty';
  } else if (settings.now.preset !== settings.defaults.preset) {
    ans.preset = settings.now.preset;
  }

  var repsDiff = [];
  var emptyReps = true;
  for (var i = 0, n = repCount; i < n; ++i) {
    repsDiff[i] = complexVisual.repGet(i).compare(compare ? currPreset[i] : null);
    if (!_.isEmpty(repsDiff[i])) {
      emptyReps = false;
    }
  }
  if (!emptyReps) {
    ans.reps = repsDiff;
  }
  return ans;
};

/*
   * Obtain object that represents current state of miew (might be used as options in constructor).
   * @param {boolean} [opts.compact=true] - set this flag to false if you want to include full
   * preset information regardless of the differences with settings
   * @param {boolean} [opts.settings=false] - when this flag is true, changes in settings are included
   * @param {boolean} [opts.view=false] - when this flag is true, a view information is included
   * @returns {Object} State object.
   */
Miew.prototype.getState = function(opts) {
  var state = {};

  opts = _.defaults(opts, {
    compact: true,
    settings: false,
    view: false,
  });

  // FIXME state should include all complexes (not only current)

  // load
  var visual = this._getComplexVisual();
  if (visual !== null) {
    // TODO type?
    if (visual.getComplex().metadata.id) {
      state.load = visual.getComplex().metadata.id;
    }
    var unit = visual.getComplex().getCurrentStructure();
    if (unit !== 1) {
      state.unit = unit;
    }
  }

  // representations
  var repsInfo = this._compareReps(visual, opts.compact);
  if (repsInfo.preset) {
    state.preset = repsInfo.preset;
  }

  if (repsInfo.reps) {
    state.reps = repsInfo.reps;
  }

  // objects
  var objects = this._objects;
  var objectsState = [];
  for (var i = 0, n = objects.length; i < n; ++i) {
    objectsState[i] = objects[i].identify();
  }
  if (objects.length > 0) {
    state._objects = objectsState;
  }

  // view
  if (opts.view) {
    state.view = this.view();
  }

  // settings
  if (opts.settings) {
    var diff = this.settings.getDiffs(false);
    if (!_.isEmpty(diff)) {
      state.settings = diff;
    }
  }

  return state;
};

/**
 * Get parameter value.
 * @param {string} param - Parameter name or path (e.g. 'modes.BS.atom').
 * @param {*=} value - Default value.
 * @returns {*} Parameter value.
 */
Miew.prototype.get = function(param, value) {
  return settings.get(param, value);
};

Miew.prototype._clipPlaneUpdateValue = function(radius) {
  var clipPlaneValue = Math.max(
    this._gfx.camera.position.z - radius * settings.now.draft.clipPlaneFactor,
    settings.now.camNear
  );

  var opts = {clipPlaneValue: clipPlaneValue};
  this._forEachComplexVisual(function(visual) {
    visual.setUberOptions(opts);
  });
  for (var i = 0, n = this._objects.length; i < n; ++i) {
    var obj = this._objects[i];
    if (obj._line) {
      obj._line.material.setUberOptions(opts);
    }
  }
  if (this._picker !== null) {
    this._picker.clipPlaneValue = clipPlaneValue;
  }
};

Miew.prototype._fogFarUpdateValue = function() {
  if (this._picker !== null) {
    if (this._gfx.scene.fog) {
      this._picker.fogFarValue = this._gfx.scene.fog.far;
    } else {
      this._picker.fogFarValue = undefined;
    }
  }
};

/**
 * Perform required actions when settings were changed.
 * @param changes - differences with previous settings
 * @private
 */
Miew.prototype._onSettingsChanged = function(changes) {
  if (!(changes instanceof Object)) {
    return;
  }
  // TODO: think about 'change' events
  if (changes.theme !== undefined) {
    this._onThemeChanged();
  }

  if (changes.draft !== undefined) {
    if (changes.draft.clipPlane !== undefined) {
      // TODO: update materials
      const values = {clipPlane: settings.now.draft.clipPlane};
      this._forEachComplexVisual(visual => visual.setMaterialValues(values));
      for (let i = 0, n = this._objects.length; i < n; ++i) {
        const obj = this._objects[i];
        if (obj._line) {
          obj._line.material.setValues(values);
          obj._line.material.needsUpdate = true;
        }
      }
      this.rebuildAll();
    }
  }
  if (changes.transparency !== undefined ||
      changes.resolution !== undefined) {
    this.rebuildAll();
  }
  if (changes.fps !== undefined) {
    this._fps.show(settings.now.fps);
  }
  if (changes.fogNearFactor !== undefined ||
      changes.fogFarFactor !== undefined ||
      changes.fog !== undefined) {
    this._updateFog();
  }
  if (changes.palette) {
    this.rebuildAll();
  }
  if (changes.autoResolution && !this._gfxScore) {
    this.logger.warn('Benchmarks are missed, autoresolution will not work! ' +
      'Autoresolution should be set during miew startup.');
  }
  if (changes.stereo) {
    if (changes.stereo === 'WEBVR' && typeof this.webVR === 'undefined') {
      this.webVR = new WebVRPoC(() => {
        this._needRender = true;
        this._onResize();
      });
    }
    if (this.webVR) {
      this.webVR.toggle(changes.stereo === 'WEBVR', this._gfx);
    }
  }
  this._needRender = true;
};

/**
 * Set parameter value.
 * @param {string|object} params - Parameter name or path (e.g. 'modes.BS.atom') or even settings object.
 * @param {*=} value - Value.
 */
Miew.prototype.set = function(params, value) {
  if (typeof params === 'string' && value !== undefined) { // slow but avoids code duplication
    const key = params;
    params = {};
    _.set(params, key, value);
  }
  if (!(params instanceof Object)) {
    return;
  }
  settings.override(params);
  this._onSettingsChanged(params);
};

/**
 * Select atoms with selection string.
 * @param {string} expression - string expression of selection
 * @param {boolean=} append - true to append selection atoms to current selection, false to rewrite selection
 */
Miew.prototype.select = function(expression, append) {
  var visual = this._getComplexVisual();
  if (!visual) {
    return;
  }

  var sel = expression;
  if (_.isString(expression)) {
    sel = selectors.parse(expression).selector;
  }

  visual.select(sel, append);
  this._updateInfoPanel();
  this._needRender = true;
};

var VIEW_VERSION = '1';

/**
 * Get or set view info packed into string.
 *
 * **Note:** view is stored for *left-handed* cs, euler angles are stored in radians and *ZXY-order*,
 *
 * @param {string=} expression - Optional string encoded the view
 */
Miew.prototype.view = function(expression) {
  var self = this;
  var pivot = this._gfx.pivot;
  var transform = [];
  var eulerOrder = 'ZXY';

  function encode() {
    var pos = pivot.position;
    var scale = self._objectControls.getScale() / settings.now.radiusToFit;
    var euler = new THREE.Euler();
    euler.setFromQuaternion(self._objectControls.getOrientation(), eulerOrder);
    transform = [
      pos.x, pos.y, pos.z,
      scale,
      euler.x, euler.y, euler.z
    ];
    return VIEW_VERSION + utils.arrayToBase64(transform, Float32Array);
  }

  function decode() {
    // HACK: old non-versioned view is the 0th version
    if (expression.length === 40) { // TODO: remove when db migration is finished
      expression = '0' + expression;
    }

    var version = expression[0];
    transform = utils.arrayFromBase64(expression.substr(1), Float32Array);

    // apply adapter for old versions
    if (version !== VIEW_VERSION) {
      if (version === '0') {
        // cancel radiusToFit included in old views
        transform[3] /= 8.0;
      } else {
        // do nothing
        self.logger.warn('Encoded view version mismatch, stored as ' + version + ' vs ' + VIEW_VERSION + ' expected');
        return;
      }
    }

    var srcView = viewInterpolator.createView();
    srcView.position.copy(pivot.position);
    srcView.scale = self._objectControls.getScale();
    srcView.orientation.copy(self._objectControls.getOrientation());

    var dstView = viewInterpolator.createView();
    dstView.position.set(transform[0], transform[1], transform[2]);

    // hack to make preset views work after we moved centering offset to visual nodes
    // FIXME should only store main pivot offset in preset
    if (self._getComplexVisual()) {
      dstView.position.sub(self._getComplexVisual().position);
    }

    dstView.scale = transform[3];
    dstView.orientation.setFromEuler(new THREE.Euler(transform[4], transform[5], transform[6], eulerOrder));

    viewInterpolator.setup(srcView, dstView);
  }

  if (typeof expression === 'undefined') {
    return encode();
  } else {
    decode();
  }
  return expression;
};

/*
   * Update current view due to viewinterpolator state
   */
Miew.prototype._updateView = function() {
  var self = this;
  var pivot = this._gfx.pivot;

  if (!viewInterpolator.wasStarted()) {
    viewInterpolator.start();
  }

  if (!viewInterpolator.isMoving()) {
    return;
  }

  //var curr = viewInterpolator.createView();
  var res = viewInterpolator.getCurrentView();
  if (res.success) {
    var curr = res.view;
    pivot.position.copy(curr.position);
    self._objectControls.setScale(curr.scale * settings.now.radiusToFit);
    self._objectControls.setOrientation(curr.orientation);
    this.dispatchEvent({type: 'transform'});
    self._needRender = true;
  }
};

/**
 * Translate object by vector
 * @param {number} x - translation value (Ang) along model's X axis
 * @param {number} y - translation value (Ang) along model's Y axis
 * @param {number} z - translation value (Ang) along model's Z axis
 */
Miew.prototype.translate = function(x, y, z) {
  this._objectControls.translatePivot(x, y, z);
  this.dispatchEvent({type: 'transform'});
  this._needRender = true;
};

/**
 * Rotate object by Euler angles
 * @param {number} x - rotation angle around X axis in radians
 * @param {number} y - rotation angle around Y axis in radians
 * @param {number} z - rotation angle around Z axis in radians
 */
Miew.prototype.rotate = function(x, y, z) {
  this._objectControls.rotate(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ')));
  this.dispatchEvent({type: 'transform'});
  this._needRender = true;
};

/**
 * Scale object by factor
 * @param {number} factor - scale multiplier
 */
Miew.prototype.scale = function(factor) {
  if (factor <= 0) {
    throw new RangeError('Scale should be greater than zero');
  }
  this._objectControls.scale(factor);
  this.dispatchEvent({type: 'transform'});
  this._needRender = true;
};

/*
   * Pan camera
   * @param {number} x - horizontal panning
   * @param {number} y - vertical panning
   * @deprecated  Move object instead of panning the camera
   */
Miew.prototype.pan = function(x, y) {
  this._gfx.camera.translateX(x);
  this._gfx.camera.translateY(y);
  this._needRender = true;
};

/**
 * Build selector that contains all atoms within given distance from group of atoms
 * @param {Selector} selector - selector describing source group of atoms
 * @param {number} radius - distance
 * @returns {Selector} selector describing result group of atoms
 */
Miew.prototype.within = function(selector, radius) {
  var visual = this._getComplexVisual();
  if (!visual) {
    return selectors.None();
  }

  if (selector instanceof String) {
    selector = selectors.parse(selector);
  }

  var res = visual.within(selector, radius);
  if (res) {
    visual.rebuildSelectionGeometry();
    this._needRender = true;
  }
  return res;
};

/**
 * Get atom position in 2D canvas coords
 * @param {string} fullAtomName - full atom name, like A.38.CG
 * @returns {Object} {x, y} or false if atom not found
 */
Miew.prototype.projected = function(fullAtomName, complexName) {
  var visual = this._getComplexVisual(complexName);
  if (!visual) {
    return false;
  }

  var atom = visual.getComplex().getAtomByFullname(fullAtomName);
  if (atom === null) {
    return false;
  }

  var pos = atom._position.clone();
  // we consider atom position to be affected only by common complex transform
  // ignoring any transformations that may add during editing
  this._gfx.pivot.updateMatrixWorldRecursive();
  this._gfx.camera.updateMatrixWorldRecursive();
  this._gfx.pivot.localToWorld(pos);
  pos.project(this._gfx.camera);

  return {
    x: (pos.x + 1.0) * 0.5 * this._gfx.width,
    y: (1.0 - pos.y) * 0.5 * this._gfx.height
  };
};

/**
 * Replace secondary structure with calculated one.
 *
 * DSSP algorithm implementation is used.
 *
 * Kabsch W, Sander C. 1983. Dictionary of protein secondary structure: pattern recognition of hydrogen-bonded and
 * geometrical features. Biopolymers. 22(12):2577-2637. doi:10.1002/bip.360221211.
 *
 * @param {string=} complexName - complex name
 */
Miew.prototype.dssp = function(complexName) {
  const visual = this._getComplexVisual(complexName);
  if (!visual) {
    return;
  }
  visual.getComplex().dssp();

  // rebuild dependent representations (cartoon or ss-colored)
  visual._reprList.forEach((rep) => {
    if (rep.mode.id === 'CA' || rep.colorer.id === 'SS') {
      rep.needsRebuild = true;
    }
  });
};

const rePdbId = /^(?:(pdb|cif|mmtf|ccp4):\s*)?(\d[a-z\d]{3})$/i;
const rePubchem = /^(?:pc|pubchem):\s*([a-z]+)$/i;
const reUrlScheme = /^([a-z][a-z\d\-+.]*):/i;

function resolveSourceShortcut(source, opts) {
  if (!_.isString(source)) {
    return source;
  }

  // e.g. "mmtf:1CRN"
  const matchesPdbId = rePdbId.exec(source);
  if (matchesPdbId) {
    let [, format = 'pdb', id] = matchesPdbId;

    format = format.toLowerCase();
    id = id.toUpperCase();

    switch (format) {
    case 'pdb':
      source = `http://files.rcsb.org/download/${id}.pdb`;
      break;
    case 'cif':
      source = `http://files.rcsb.org/download/${id}.cif`;
      break;
    case 'mmtf':
      source = `http://mmtf.rcsb.org/v1.0/full/${id}`;
      break;
    case 'ccp4':
      source = `https://www.ebi.ac.uk/pdbe/coordinates/files/${id.toLowerCase()}.ccp4`;
      break;
    default:
      throw new Error('Unexpected data format shortcut');
    }

    opts.fileType = format;
    opts.fileName = `${id}.${format}`;
    opts.sourceType = 'url';
    return source;
  }

  // e.g. "pc:aspirin"
  const matchesPubchem = rePubchem.exec(source);
  if (matchesPubchem) {
    let compound = matchesPubchem[1].toLowerCase();
    source = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${compound}/JSON?record_type=3d`;
    opts.fileType = 'pubchem';
    opts.fileName = `${compound}.json`;
    opts.sourceType = 'url';
    return source;
  }

  // otherwise is should be an URL
  if (opts.sourceType === 'url' || opts.sourceType === undefined) {
    opts.sourceType = 'url';

    // e.g. "./data/1CRN.pdb"
    if (!reUrlScheme.test(source)) {
      source = utils.resolveURL(source);
    }
  }

  return source;
}

function updateBinaryMode(opts) {
  let binary = opts.binary;

  // detect by format
  if (opts.fileType !== undefined) {
    const TheParser = _.head(io.parsers.find({format: opts.fileType}));
    if (TheParser) {
      binary = TheParser.binary || false;
    } else {
      throw new Error('Could not find suitable parser for this format');
    }
  }

  // detect by file extension
  if (binary === undefined && opts.fileExt !== undefined) {
    const TheParser = _.head(io.parsers.find({ext: opts.fileExt}));
    if (TheParser) {
      binary = TheParser.binary || false;
    }
  }

  // temporary workaround for animation
  if (opts.fileExt !== undefined && opts.fileExt.toLowerCase() === '.man') {
    opts.binary = true;
    opts.animation = true; // who cares?
  }

  // update if detected
  if (binary !== undefined) {
    if (opts.binary !== undefined && opts.binary !== binary) {
      opts.context.logger.warn('Overriding incorrect binary mode');
    }
  }

  opts.binary = binary || false;
}

function _fetchData(source, opts, job) {
  return new Promise(function(resolve) {
    if (job.shouldCancel()) {
      throw new Error('Operation cancelled');
    }

    // allow for source shortcuts
    source = resolveSourceShortcut(source, opts);

    // detect a proper loader
    const TheLoader = _.head(io.loaders.find({type: opts.sourceType, source}));
    if (!TheLoader) {
      throw new Error('Could not find suitable loader for this source');
    }

    // split file name
    const fileName = opts.fileName || TheLoader.extractName(source);
    if (fileName) {
      const [name, fileExt] = utils.splitFileName(fileName);
      _.defaults(opts, {name, fileExt, fileName});
    }

    // should it be text or binary?
    updateBinaryMode(opts);

    // FIXME: All new settings retrieved from server are applied after the loading is complete. However, we need some
    // flags to alter the loading process itself. Here we apply them in advance. Dirty hack. Kill the server, remove
    // all hacks and everybody's happy.
    var newOptions = _.get(opts, 'preset.expression');
    if (!_.isUndefined(newOptions)) {
      newOptions = JSON.parse(newOptions);
      if (newOptions && newOptions.settings) {
        var keys = ['singleUnit', 'draft.waterBondingHack'];
        for (var keyIndex = 0, keyCount = keys.length; keyIndex < keyCount; ++keyIndex) {
          var key = keys[keyIndex];
          var value = _.get(newOptions.settings, key);
          if (!_.isUndefined(value)) {
            settings.set(key, value);
          }
        }
      }
    }

    // create a loader
    const loader = new TheLoader(source, opts);
    loader.context = opts.context;
    job.addEventListener('cancel', () => loader.abort());

    loader.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total > 0) {
        reportProgress(loader.logger, 'Fetching', event.loaded / event.total);
      } else {
        reportProgress(loader.logger, 'Fetching');
      }
    });

    console.time('fetch');
    const promise = loader.load()
      .then((data) => {
        console.timeEnd('fetch');
        opts.context.logger.info('Fetching finished');
        job.notify({type: 'fetchingFinished', data});
        return data;
      })
      .catch((error) => {
        console.timeEnd('fetch');
        opts.context.logger.debug(error.message);
        if (error.stack) {
          opts.context.logger.debug(error.stack);
        }
        opts.context.logger.error('Fetching failed');
        job.notify({type: 'fetchingFinished', error});
        throw error;
      });
    resolve(promise);
  });
}

function _convertData(data, opts, job) {
  return new Promise(function(resolve, reject) {
    if (job.shouldCancel()) {
      throw new Error('Operation cancelled');
    }
    job.notify({type: 'convert'});

    if (opts.mdFile) {
      var byteNumbers = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        byteNumbers[i] = data.charCodeAt(i);
      }
      var bytes = new Uint8Array(byteNumbers);
      var blob = new File([bytes], opts.fileName);
      console.time('convert');
      Miew.prototype.srvTopologyConvert(blob, opts.mdFile, function(success, newData, message) {
        console.timeEnd('convert');
        if (success) {
          opts.converted = true;
          opts.amberFileName = opts.fileName;
          opts.convertedFile = new File([bytes], opts.fileName);
          opts.fileName = null;
          opts.fileType = 'pdb';
          job.notify({type: 'convertingFinished'});
          resolve(newData);
        } else {
          opts.converted = false;
          logger.error(message);
          opts.error = message;
          job.notify({type: 'convertingFinished', error: message});
          reject(new Error(message));
        }
      });
    } else {
      opts.converted = true;
      resolve(data);
    }
  });
}

function _parseData(data, opts, job) {
  if (job.shouldCancel()) {
    return Promise.reject(new Error('Operation cancelled'));
  }
  job.notify({type: 'parse'});

  const TheParser = _.head(io.parsers.find({format: opts.fileType, ext: opts.fileExt, data}));
  if (!TheParser) {
    return Promise.reject(new Error('Could not find suitable parser'));
  }

  const parser = new TheParser(data, opts);
  parser.context = opts.context;
  job.addEventListener('cancel', () => parser.abort());

  console.time('parse');
  return parser.parse()
    .then((dataSet) => {
      console.timeEnd('parse');
      job.notify({type: 'parsingFinished', data: dataSet});
      return dataSet;
    })
    .catch((error) => {
      console.timeEnd('parse');
      opts.error = error;
      opts.context.logger.debug(error.message);
      if (error.stack) {
        opts.context.logger.debug(error.stack);
      }
      opts.context.logger.error('Parsing failed');
      job.notify({type: 'parsingFinished', error});
      throw error;
    });
}

Miew.prototype.exportCML = function() {
  const self = this;

  function extractRotation(m) {
    const xAxis = new THREE.Vector3();
    const yAxis = new THREE.Vector3();
    const zAxis = new THREE.Vector3();
    m.extractBasis(xAxis, yAxis, zAxis);
    xAxis.normalize();
    yAxis.normalize();
    zAxis.normalize();
    const retMat = new THREE.Matrix4();
    retMat.identity();
    retMat.makeBasis(xAxis, yAxis, zAxis);
    return retMat;
  }

  function updateCMLData(complex) {
    const root = self._gfx.root;
    const mat = extractRotation(root.matrixWorld);
    const v4 = new THREE.Vector4(0, 0, 0, 0);
    const vCenter = new THREE.Vector4(0, 0, 0, 0);
    let xml = null;
    let ap = null;

    // update atoms in cml
    complex.forEachAtom(function(atom) {
      if (atom.xmlNodeRef && atom.xmlNodeRef.xmlNode) {
        xml = atom.xmlNodeRef.xmlNode;
        ap = atom.getPosition();
        v4.set(ap.x, ap.y, ap.z, 1.0);
        v4.applyMatrix4(mat);
        xml.setAttribute('x3', v4.x.toString());
        xml.setAttribute('y3', v4.y.toString());
        xml.setAttribute('z3', v4.z.toString());
        xml.removeAttribute('x2');
        xml.removeAttribute('y2');
      }
    });
    // update stereo groups in cml
    complex.forEachSGroup(function(sGroup) {
      if (sGroup.xmlNodeRef && sGroup.xmlNodeRef.xmlNode) {
        xml = sGroup.xmlNodeRef.xmlNode;
        ap = sGroup.getPosition();
        v4.set(ap.x, ap.y, ap.z, 1.0);
        const cp = sGroup.getCentralPoint();
        if (cp === null) {
          v4.applyMatrix4(mat);
        } else {
          vCenter.set(cp.x, cp.y, cp.z, 0.0);
          v4.add(vCenter);
          v4.applyMatrix4(mat); // pos in global space
          vCenter.set(cp.x, cp.y, cp.z, 1.0);
          vCenter.applyMatrix4(mat);
          v4.sub(vCenter);
        }
        xml.setAttribute('x', v4.x.toString());
        xml.setAttribute('y', v4.y.toString());
        xml.setAttribute('z', v4.z.toString());
      }
    });
  }

  // FIXME save data for all complexes (not only current)
  const visual = self._getComplexVisual();
  const complex = visual ? visual.getComplex() : null;
  if (complex && complex.originalCML) {
    updateCMLData(complex);

    // serialize xml structure to string
    const oSerializer = new XMLSerializer();
    return oSerializer.serializeToString(complex.originalCML);
  }

  return null;
};
////////////////////////////////////////////////////////////////////////////
// Additional exports

Miew.prototype.VERSION = typeof PACKAGE_VERSION !== 'undefined' && PACKAGE_VERSION || '0.0.0-dev';
// Miew.prototype.debugTracer = new utils.DebugTracer(Miew.prototype);

_.assign(Miew, /** @lends Miew */ {
  VERSION: Miew.prototype.VERSION,

  registeredPlugins: [],

  // export namespaces // TODO: WIP: refactoring external interface
  chem: chem,
  modes: modes,
  colorers: colorers,
  materials: materials,
  palettes: palettes,
  options: options,
  settings: settings,
  utils: utils,
  gfx: {
    Representation: Representation,
    fbxExport: fbxExport,
  },

  /**
   * Third-party libraries packaged together with Miew.
   *
   * @property {object} lodash - [Lodash](https://lodash.com/), a modern JavaScript utility library delivering
   *   modularity, performance & extras.
   * @property {object} three - [three.js](https://threejs.org/), JavaScript 3D library.
   *
   * @example
   * var _ = Miew.thirdParty.lodash;
   * var opts = _.merge({ ... }, Miew.options.fromURL(window.location.search));
   * var miew = new Miew(opts);
   */
  thirdParty: {
    lodash: _,
    three: THREE,
  },
});

export default Miew;
