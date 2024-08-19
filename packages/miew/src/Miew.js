/* global PACKAGE_VERSION:false */
import _ from 'lodash';
import * as THREE from 'three';
import { Spinner } from 'spin.js';
import Stats from './gfx/Stats';
import utils from './utils';
import JobHandle from './utils/JobHandle';
import options from './options';
import settings from './settings';
import chem from './chem';
import Visual from './Visual';
import ComplexVisual from './ComplexVisual';
import Complex from './chem/Complex';
import VolumeVisual from './VolumeVisual';
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
import meshutils from './gfx/meshutils';
import FrameInfo from './gfx/FrameInfo';
import meshes from './gfx/meshes/meshes';
import LinesObject from './gfx/objects/LinesObj';
import UberMaterial from './gfx/shaders/UberMaterial';
import OutlineMaterial from './gfx/shaders/OutlineMaterial';
import FXAAMaterial from './gfx/shaders/FXAAMaterial';
import AOMaterial from './gfx/shaders/AOMaterial';
import AOHorBlurMaterial from './gfx/shaders/AOHorBlurMaterial';
import AOVertBlurWithBlendMaterial from './gfx/shaders/AOVertBlurWithBlendMaterial';
import AnaglyphMaterial from './gfx/shaders/AnaglyphMaterial';
import VolumeMaterial from './gfx/shaders/VolumeMaterial';
import ViewInterpolator from './gfx/ViewInterpolator';
import EventDispatcher from './utils/EventDispatcher';
import logger from './utils/logger';
import Cookies from './utils/Cookies';
import capabilities from './gfx/capabilities';
import WebVRPoC from './gfx/vr/WebVRPoC';
import vertexScreenQuadShader from './gfx/shaders/ScreenQuad.vert';
import fragmentScreenQuadFromDistTex from './gfx/shaders/ScreenQuadFromDistortionTex.frag';
import getTopWindow from './utils/getTopWindow';

const {
  selectors,
  Atom,
  Residue,
  Chain,
  Molecule,
} = chem;

const EDIT_MODE = { COMPLEX: 0, COMPONENT: 1, FRAGMENT: 2 };

const LOADER_NOT_FOUND = 'Could not find suitable loader for this source';
const PARSER_NOT_FOUND = 'Could not find suitable parser for this source';

// Color management changed a lot in threejs 152+ version.
// To keep miew colors we disable the new color management system
THREE.ColorManagement.enabled = false;

const { createElement } = utils;

function updateFogRange(fog, center, radius) {
  fog.near = center - radius * settings.now.fogNearFactor;
  fog.far = center + radius * settings.now.fogFarFactor;
}

function removeExtension(fileName) {
  const dot = fileName.lastIndexOf('.');
  if (dot >= 0) {
    fileName = fileName.substr(0, dot);
  }
  return fileName;
}

function hasValidResidues(complex) {
  let hasValidRes = false;
  complex.forEachComponent((component) => {
    component.forEachResidue((residue) => {
      if (residue._isValid) {
        hasValidRes = true;
      }
    });
  });
  return hasValidRes;
}

function reportProgress(log, action, percent) {
  const TOTAL_PERCENT = 100;
  if (percent !== undefined) {
    log.debug(`${action}... ${Math.floor(percent * TOTAL_PERCENT)}%`);
  } else {
    log.debug(`${action}...`);
  }
}

function chooseFogColor() {
  return settings.now.fogColorEnable ? settings.now.fogColor : settings.now.bg.color;
}

// ////////////////////////////////////////////////////////////////////////////

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
  /** @type {ViewInterpolator} */
  this._interpolator = new ViewInterpolator();
  /** @type {HTMLElement} */
  this._container = (opts && opts.container)
    || document.getElementById('miew-container')
    || _.head(document.getElementsByClassName('miew-container'))
    || document.body;
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
  const log = logger;
  log.console = DEBUG;
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
  this.restoreSettings();
  if (opts && opts.settings) {
    this.settings.set(opts.settings);
  }

  /** @type {?Spinner} */
  this._spinner = null;
  /** @type {JobHandle[]} */
  this._loading = [];
  /** @type {?number}
   * @deprecated until Animation system refactoring
   */
  this._animInterval = null;

  /** @type {object} */
  this._visuals = {};
  /** @type {?string} */
  this._curVisualName = null;

  /** @type {array} */
  this._objects = [];

  /** @type {object} */
  this._sourceWindow = null;

  this.reset();

  if (this._repr) {
    log.debug(`Selected ${this._repr.mode.name} mode with ${this._repr.colorer.name} colorer.`);
  }

  const self = this;
  Miew.registeredPlugins.forEach((plugin) => {
    plugin.call(self);
  });

  this._initOnSettingsChanged();
}

Miew.prototype = Object.create(EventDispatcher.prototype);
Miew.prototype.constructor = Miew;

Miew.prototype.getMaxRepresentationCount = function () {
  return ComplexVisual.NUM_REPRESENTATION_BITS;
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
 * Update Shadow Camera target position and frustum.
 * @private
 */
Miew.prototype._updateShadowCamera = (function () {
  const shadowMatrix = new THREE.Matrix4();
  const direction = new THREE.Vector3();
  const OBB = { center: new THREE.Vector3(), halfSize: new THREE.Vector3() };

  return function () {
    this._gfx.scene.updateMatrixWorld();
    for (let i = 0; i < this._gfx.scene.children.length; i++) {
      if (this._gfx.scene.children[i].type === 'DirectionalLight') {
        const light = this._gfx.scene.children[i];
        shadowMatrix.copy(light.shadow.camera.matrixWorldInverse);
        this.getOBB(shadowMatrix, OBB);

        direction.subVectors(light.target.position, light.position);
        light.position.subVectors(OBB.center, direction);
        light.target.position.copy(OBB.center);

        light.shadow.bias = 0.09;
        light.shadow.camera.bottom = -OBB.halfSize.y;
        light.shadow.camera.top = OBB.halfSize.y;
        light.shadow.camera.right = OBB.halfSize.x;
        light.shadow.camera.left = -OBB.halfSize.x;
        light.shadow.camera.near = direction.length() - OBB.halfSize.z;
        light.shadow.camera.far = direction.length() + OBB.halfSize.z;

        light.shadow.camera.updateProjectionMatrix();
      }
    }
  };
}());

/**
 * Initialize the viewer.
 * @returns {boolean} true on success.
 * @throws Forwards exception raised during initialization.
 * @see Miew#term
 */
Miew.prototype.init = function () {
  const container = this._container;
  const elem = utils.createElement('div', { class: 'miew-canvas' });
  _setContainerContents(container, elem);
  this._container = elem;

  const frag = document.createDocumentFragment();
  frag.appendChild(this._msgMode = createElement(
    'div',
    { class: 'mode-message overlay' },
    createElement('p', {}, 'COMPONENT EDIT MODE'),
  ));
  frag.appendChild(this._msgAtomInfo = createElement(
    'div',
    { class: 'atom-info overlay' },
    createElement('p', {}, ''),
  ));
  container.appendChild(frag);

  if (this._gfx !== null) { // block double init
    return true;
  }

  const self = this;
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
      zIndex: 700,
    });

    const target = getTopWindow();
    target.addEventListener('keydown', (event) => {
      self._onKeyDown(event);
    });

    target.addEventListener('keyup', (event) => {
      self._onKeyUp(event);
    });

    this._objectControls = new ObjectControls(
      this._gfx.root,
      this._gfx.pivot,
      this._gfx.camera,
      this._gfx.renderer.domElement,
      () => self._getAltObj(),
    );
    this._objectControls.addEventListener('change', (e) => {
      if (settings.now.shadow.on) {
        self._updateShadowCamera();
      }
      // route rotate, zoom, translate and translatePivot events to the external API
      switch (e.action) {
        case 'rotate':
          self.dispatchEvent({ type: 'rotate', quaternion: e.quaternion });
          break;
        case 'zoom':
          self.dispatchEvent({ type: 'zoom', factor: e.factor });
          break;
        default:
          self.dispatchEvent({ type: e.action });
      }
      self.dispatchEvent({ type: 'transform' });
      self._needRender = true;
    });

    const gfx = this._gfx;
    this._picker = new Picker(gfx.root, gfx.camera, gfx.renderer.domElement);
    this._picker.addEventListener('newpick', (event) => {
      self._onPick(event);
    });
    this._picker.addEventListener('dblclick', (event) => {
      self.center(event);
    });
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Cannot read property \'getExtension\' of null') {
      this._showMessage('Could not create WebGL context.');
    } else if (error.message.search(/webgl/i) > 1) {
      this._showMessage(error.message);
    } else {
      this._showMessage('Viewer initialization failed.');
      throw error;
    }
    return false;
  }

  // automatically load default file
  const file = this._opts && this._opts.load;
  if (file) {
    const type = this._opts && this._opts.type;
    this.load(file, { fileType: type, keepRepsInfo: true });
  }

  return true;
};

/**
 * Terminate the viewer completely.
 * @see Miew#init
 */
Miew.prototype.term = function () {
  this._showMessage('Viewer has been terminated.');
  this._loading.forEach((job) => {
    job.cancel();
  });
  this._loading.length = 0;
  this.halt();
  this._gfx = null;
};

/**
 * Display message inside the viewer container, hiding WebGL canvas.
 * @param {string} msg - Message to show.
 * @private
 */
Miew.prototype._showMessage = function (msg) {
  const element = document.createElement('div');
  element.setAttribute('class', 'miew-message');
  element.appendChild(document.createElement('p')).appendChild(document.createTextNode(msg));
  _setContainerContents(this._container, element);
};

/**
 * Display WebGL canvas inside the viewer container, hiding any message shown.
 * @private
 */
Miew.prototype._showCanvas = function () {
  _setContainerContents(this._container, this._gfx.renderer.domElement);
};

Miew.prototype._requestAnimationFrame = function (callback) {
  const { xr } = this._gfx.renderer;
  if (xr && xr.enabled) {
    this._gfx.renderer.setAnimationLoop(callback);
    return;
  }
  requestAnimationFrame(callback);
};

function arezSpritesSupported(context) {
  return context.getExtension('EXT_frag_depth');
}

function isAOSupported(context) {
  return (context.getExtension('WEBGL_depth_texture')
  && context.getExtension('WEBGL_draw_buffers'));
}

/**
 * Initialize WebGL and set 3D scene up.
 * @private
 */
Miew.prototype._initGfx = function () {
  const gfx = {
    width: this._container.clientWidth,
    height: this._container.clientHeight,
  };

  const webGLOptions = { preserveDrawingBuffer: true, alpha: true, premultipliedAlpha: false };
  if (settings.now.antialias) {
    webGLOptions.antialias = true;
  }

  gfx.renderer2d = new CSS2DRenderer();

  gfx.renderer = new THREE.WebGL1Renderer(webGLOptions);
  gfx.renderer.shadowMap.enabled = settings.now.shadow.on;
  gfx.renderer.shadowMap.autoUpdate = false;
  gfx.renderer.shadowMap.type = THREE.PCFShadowMap;
  capabilities.init(gfx.renderer);

  // z-sprites and ambient occlusion possibility
  if (!arezSpritesSupported(gfx.renderer.getContext())) {
    settings.set('zSprites', false);
  }
  if (!isAOSupported(gfx.renderer.getContext())) {
    settings.set('ao', false);
  }

  gfx.renderer.autoClear = false;
  gfx.renderer.setPixelRatio(window.devicePixelRatio);
  gfx.renderer.setSize(gfx.width, gfx.height);
  gfx.renderer.setClearColor(settings.now.bg.color, Number(!settings.now.bg.transparent));
  gfx.renderer.clearColor();

  gfx.renderer2d.setSize(gfx.width, gfx.height);

  gfx.camera = new THREE.PerspectiveCamera(
    settings.now.camFov,
    gfx.width / gfx.height,
    settings.now.camNear,
    settings.now.camFar,
  );
  gfx.camera.setMinimalFov(settings.now.camFov);
  gfx.camera.position.z = settings.now.camDistance;
  gfx.camera.updateProjectionMatrix();
  gfx.camera.layers.set(gfxutils.LAYERS.DEFAULT);
  gfx.camera.layers.enable(gfxutils.LAYERS.VOLUME);
  gfx.camera.layers.enable(gfxutils.LAYERS.VOLUME_BFPLANE);

  gfx.stereoCam = new THREE.StereoCamera();

  gfx.scene = new THREE.Scene();

  const color = chooseFogColor();
  gfx.scene.fog = new THREE.Fog(color, settings.now.camNear, settings.now.camFar);

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

  const light12 = new THREE.DirectionalLight(0xffffff, 0.45);
  light12.position.set(0, 0.414, 1);
  light12.layers.enable(gfxutils.LAYERS.TRANSPARENT);
  light12.castShadow = true;
  light12.shadow.bias = 0.09;
  light12.shadow.radius = settings.now.shadow.radius;
  light12.shadow.camera.layers.set(gfxutils.LAYERS.SHADOWMAP);

  const pixelRatio = gfx.renderer.getPixelRatio();
  const shadowMapSize = Math.max(gfx.width, gfx.height) * pixelRatio;
  light12.shadow.mapSize.width = shadowMapSize;
  light12.shadow.mapSize.height = shadowMapSize;
  light12.target.position.set(0.0, 0.0, 0.0);
  gfx.scene.add(light12);
  gfx.scene.add(light12.target);

  const light3 = new THREE.AmbientLight(0x666666);
  light3.layers.enable(gfxutils.LAYERS.TRANSPARENT);
  gfx.scene.add(light3);

  // add axes
  gfx.axes = new Axes(gfx.root, gfx.camera);
  const deviceWidth = gfx.width * pixelRatio;
  const deviceHeight = gfx.height * pixelRatio;

  gfx.offscreenBuf = new THREE.WebGLRenderTarget(
    deviceWidth,
    deviceHeight,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: true,
    },
  );

  if (gfx.renderer.getContext().getExtension('WEBGL_depth_texture')) {
    gfx.offscreenBuf.depthTexture = new THREE.DepthTexture();
    gfx.offscreenBuf.depthTexture.type = THREE.UnsignedShortType;
  }

  gfx.offscreenBuf2 = new THREE.WebGLRenderTarget(
    deviceWidth,
    deviceHeight,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false,
    },
  );

  gfx.offscreenBuf3 = new THREE.WebGLRenderTarget(
    deviceWidth,
    deviceHeight,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false,
    },
  );

  gfx.offscreenBuf4 = new THREE.WebGLRenderTarget(
    deviceWidth,
    deviceHeight,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false,
    },
  );

  gfx.volBFTex = gfx.offscreenBuf3;
  gfx.volFFTex = gfx.offscreenBuf4;
  gfx.volWFFTex = gfx.offscreenBuf;

  // use float textures for volume rendering if possible
  if (gfx.renderer.getContext().getExtension('OES_texture_float')) {
    gfx.offscreenBuf5 = new THREE.WebGLRenderTarget(
      deviceWidth,
      deviceHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
      },
    );

    gfx.offscreenBuf6 = new THREE.WebGLRenderTarget(
      deviceWidth,
      deviceHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: false,
      },
    );

    gfx.offscreenBuf7 = new THREE.WebGLRenderTarget(
      deviceWidth,
      deviceHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
        depthBuffer: true,
      },
    );

    gfx.volBFTex = gfx.offscreenBuf5;
    gfx.volFFTex = gfx.offscreenBuf6;
    gfx.volWFFTex = gfx.offscreenBuf7;
  } else {
    this.logger.warn('Device doesn\'t support OES_texture_float extension');
  }

  gfx.stereoBufL = new THREE.WebGLRenderTarget(
    deviceWidth,
    deviceHeight,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false,
    },
  );

  gfx.stereoBufR = new THREE.WebGLRenderTarget(
    deviceWidth,
    deviceHeight,
    {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: false,
    },
  );

  this._gfx = gfx;
  this._showCanvas();

  this._embedWebXR(settings.now.stereo === 'WEBVR');

  this._container.appendChild(gfx.renderer2d.getElement());

  // add FPS counter
  const stats = new Stats();
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
Miew.prototype._initListeners = function () {
  const self = this;
  window.addEventListener('resize', () => {
    self._onResize();
  });
};

/**
 * Try to add numbers to the base name to make it unique among visuals
 * @private
 */
Miew.prototype._makeUniqueVisualName = function (baseName) {
  if (!baseName) {
    return Math.random().toString();
  }

  let name = baseName;
  let suffix = 1;
  while (this._visuals.hasOwnProperty(name)) {
    name = `${baseName} (${suffix.toString()})`;
    suffix++;
  }

  return name;
};

/**
 * Add visual to the viewer
 * @private
 */
Miew.prototype._addVisual = function (visual) {
  if (!visual) {
    return null;
  }

  // change visual name in order to make it unique
  const name = this._makeUniqueVisualName(visual.name);
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
Miew.prototype._removeVisual = function (visual) {
  let name = '';
  let obj = null;
  if (visual instanceof Visual) {
    ({ name } = visual);
    obj = visual;
  } else if (typeof visual === 'string') {
    name = visual;
    obj = this._visuals[name];
  }

  if (!obj || !this._visuals.hasOwnProperty(name) || this._visuals[name] !== obj) {
    return;
  }

  if (name === this._curVisualName) {
    this._curVisualName = undefined;
  }

  delete this._visuals[name];
  obj.release(); // removes nodes from scene

  this._needRender = true;
};

/**
 * Call specified function for each Visual
 * @private
 */
Miew.prototype._forEachVisual = function (callback) {
  for (const name in this._visuals) {
    if (this._visuals.hasOwnProperty(name)) {
      callback(this._visuals[name]);
    }
  }
};

/**
 * Release (destroy) all visuals in the scene
 * @private
 */
Miew.prototype._releaseAllVisuals = function () {
  if (!this._gfx || !this._gfx.pivot) {
    return;
  }

  for (const name in this._visuals) {
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
Miew.prototype._forEachComplexVisual = function (callback) {
  if (!this._gfx || !this._gfx.pivot) {
    return;
  }

  for (const name in this._visuals) {
    if (this._visuals.hasOwnProperty(name)
          && this._visuals[name] instanceof ComplexVisual) {
      callback(this._visuals[name]);
    }
  }
};

/**
 * Returns ComplexVisual with specified name, or current (if not found), or any, or null
 * @private
 */
Miew.prototype._getComplexVisual = function (name) {
  name = name || this._curVisualName;
  let any = null;
  let named = null;
  this._forEachComplexVisual((visual) => {
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
Miew.prototype._getVolumeVisual = function () {
  let any = null;
  this._forEachVisual((visual) => {
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
Miew.prototype._getVisualForComplex = function (complex) {
  if (!complex) {
    return null;
  }

  let found = null;
  this._forEachComplexVisual((visual) => {
    if (visual.getComplex() === complex) {
      found = visual;
    }
  });
  return found;
};

/*
   * Get a list of names of visuals currently shown by the viewer
   */
Miew.prototype.getVisuals = function () {
  return Object.keys(this._visuals);
};

/*
   * Get complex visuals count
   */
Miew.prototype.getComplexVisualsCount = function () {
  let count = 0;
  this._forEachComplexVisual(() => count++);
  return count;
};

/*
   * Get current visual
   */
Miew.prototype.getCurrentVisual = function () {
  return this._curVisualName;
};

/*
   * Set current visual.
   * All further operations will be performed on this visual (complex) if not stated otherwise.
   */
Miew.prototype.setCurrentVisual = function (name) {
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
Miew.prototype.run = function () {
  if (!this._running) {
    this._running = true;
    if (this._halting) {
      this._halting = false;
      return;
    }

    this._objectControls.enable(true);
    this._interpolator.resume();

    this._requestAnimationFrame(() => this._onTick());
  }
};

/**
 * Request the viewer to stop.
 * Will be processed during the next frame.
 * @see Miew#run
 */
Miew.prototype.halt = function () {
  if (this._running) {
    this._discardComponentEdit();
    this._discardFragmentEdit();
    this._objectControls.enable(false);
    this._interpolator.pause();
    this._halting = true;
  }
};

/**
 * Request the viewer to start / stop responsing
 * on hot keys.
 * @param enabled - start (true) or stop (false) response on hot keys.
 */
Miew.prototype.enableHotKeys = function (enabled) {
  this._hotKeysEnabled = enabled;
  this._objectControls.enableHotkeys(enabled);
};

/**
 * Callback which processes window resize.
 * @private
 */
Miew.prototype._onResize = function () {
  const gfx = this._gfx;
  if (!gfx) {
    return;
  }

  this._needRender = true;

  gfx.width = this._container.clientWidth;
  gfx.height = this._container.clientHeight;

  gfx.camera.aspect = gfx.width / gfx.height;
  gfx.camera.setMinimalFov(settings.now.camFov);
  gfx.camera.updateProjectionMatrix();

  gfx.renderer.setSize(gfx.width, gfx.height);
  gfx.renderer2d.setSize(gfx.width, gfx.height);

  this.dispatchEvent({ type: 'resize' });
};

Miew.prototype._resizeOffscreenBuffers = function (width, height, stereo) {
  const gfx = this._gfx;
  stereo = stereo || 'NONE';
  const isAnaglyph = (stereo === 'NONE' || stereo === 'ANAGLYPH');
  const multi = isAnaglyph ? 1 : 0.5;
  gfx.offscreenBuf.setSize(multi * width, height);
  gfx.offscreenBuf2.setSize(multi * width, height);
  gfx.offscreenBuf3.setSize(multi * width, height);
  gfx.offscreenBuf4.setSize(multi * width, height);
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
Miew.prototype._onTick = function () {
  if (this._halting) {
    this._running = false;
    this._halting = false;
    return;
  }

  this._fps.update();

  this._requestAnimationFrame(() => this._onTick());

  this._onUpdate();
  if (this._needRender) {
    this._onRender();
    this._needRender = !settings.now.suspendRender || settings.now.stereo === 'WEBVR';
  }
};

Miew.prototype._getBSphereRadius = function () {
  // calculate radius that would include all visuals
  let radius = 0;
  this._forEachVisual((visual) => {
    radius = Math.max(radius, visual.getBoundaries().boundingSphere.radius);
  });
  return radius * this._objectControls.getScale();
};

/**
 * Calculate bounding box that would include all visuals and being axis aligned in world defined by
 * transformation matrix: matrix
 * @param {Matrix4} matrix - transformation matrix.
 * @param {object}  OBB           - calculating bounding box.
 * @param {Vector3} OBB.center    - OBB center.
 * @param {Vector3} OBB.halfSize  - half magnitude of OBB sizes.
 */
Miew.prototype.getOBB = (function () {
  const _bSphereForOneVisual = new THREE.Sphere();
  const _bBoxForOneVisual = new THREE.Box3();
  const _bBox = new THREE.Box3();

  const _invMatrix = new THREE.Matrix4();

  const _points = [
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ];

  return function (matrix, OBB) {
    _bBox.makeEmpty();

    this._forEachVisual((visual) => {
      _bSphereForOneVisual.copy(visual.getBoundaries().boundingSphere);
      _bSphereForOneVisual.applyMatrix4(visual.matrixWorld).applyMatrix4(matrix);
      _bSphereForOneVisual.getBoundingBox(_bBoxForOneVisual);
      _bBox.union(_bBoxForOneVisual);
    });
    _bBox.getCenter(OBB.center);

    _invMatrix.copy(matrix).invert();
    OBB.center.applyMatrix4(_invMatrix);

    const { min } = _bBox;
    const { max } = _bBox;
    _points[0].set(min.x, min.y, min.z); // 000
    _points[1].set(max.x, min.y, min.z); // 100
    _points[2].set(min.x, max.y, min.z); // 010
    _points[3].set(min.x, min.y, max.z); // 001
    for (let i = 0, l = _points.length; i < l; i++) {
      _points[i].applyMatrix4(_invMatrix);
    }

    OBB.halfSize.set(
      Math.abs(_points[0].x - _points[1].x),
      Math.abs(_points[0].y - _points[2].y),
      Math.abs(_points[0].z - _points[3].z),
    ).multiplyScalar(0.5);
  };
}());

Miew.prototype._updateFog = function () {
  const gfx = this._gfx;

  if (settings.now.fog) {
    if (typeof gfx.scene.fog === 'undefined' || gfx.scene.fog === null) {
      const color = chooseFogColor();
      gfx.scene.fog = new THREE.Fog(color);
      this._setUberMaterialValues({ fog: settings.now.fog });
    }
    updateFogRange(gfx.scene.fog, gfx.camera.position.z, this._getBSphereRadius());
  } else if (gfx.scene.fog) {
    gfx.scene.fog = undefined;
    this._setUberMaterialValues({ fog: settings.now.fog });
  }
};

Miew.prototype._onUpdate = function () {
  if (this.isScriptingCommandAvailable !== undefined && this.isScriptingCommandAvailable() && !this._building) {
    this.callNextCmd();
  }

  this._objectControls.update();

  this._forEachComplexVisual((visual) => {
    visual.getComplex().update();
  });

  if (settings.now.autobuild && !this._loading.length && !this._building && this._needRebuild()) {
    this.rebuild();
  }

  if (!this._loading.length && !this._building && !this._needRebuild()) {
    this._updateView();
  }

  this._updateFog();

  if (this._gfx.renderer.xr.enabled) {
    this.webVR.updateMoleculeScale();
  }
};

Miew.prototype._onRender = function () {
  const gfx = this._gfx;

  // update all matrices
  gfx.scene.updateMatrixWorld();
  gfx.camera.updateMatrixWorld();

  this._clipPlaneUpdateValue(this._getBSphereRadius());
  this._fogFarUpdateValue();

  gfx.renderer.setRenderTarget(null);
  gfx.renderer.clear();

  this._renderFrame(settings.now.stereo);
};

Miew.prototype._renderFrame = (function () {
  const _anaglyphMat = new AnaglyphMaterial();
  const _size = new THREE.Vector2();

  return function (stereo) {
    const gfx = this._gfx;
    const { renderer } = gfx;

    renderer.getSize(_size);

    if (stereo !== 'NONE') {
      gfx.camera.focus = gfx.camera.position.z; // set focus to the center of the object
      gfx.stereoCam.aspect = 1.0;

      // in anaglyph mode we render full-size image for each eye
      // while in other stereo modes only half-size (two images on the screen)
      if (stereo === 'ANAGLYPH') {
        gfx.stereoCam.update(gfx.camera);
      } else {
        gfx.stereoCam.updateHalfSized(gfx.camera, settings.now.camFov);
      }
    }

    // resize offscreen buffers to match the target
    const pixelRatio = gfx.renderer.getPixelRatio();
    this._resizeOffscreenBuffers(_size.width * pixelRatio, _size.height * pixelRatio, stereo);

    this._renderShadowMap();

    switch (stereo) {
      case 'WEBVR':
      case 'NONE':
        this._renderScene(gfx.camera, false);
        break;
      case 'SIMPLE':
      case 'DISTORTED':
        renderer.setScissorTest(true);

        renderer.setScissor(0, 0, _size.width / 2, _size.height);
        renderer.setViewport(0, 0, _size.width / 2, _size.height);
        this._renderScene(this._gfx.stereoCam.cameraL, stereo === 'DISTORTED');

        renderer.setScissor(_size.width / 2, 0, _size.width / 2, _size.height);
        renderer.setViewport(_size.width / 2, 0, _size.width / 2, _size.height);
        this._renderScene(this._gfx.stereoCam.cameraR, stereo === 'DISTORTED');

        renderer.setScissorTest(false);
        break;
      case 'ANAGLYPH':
        this._renderScene(this._gfx.stereoCam.cameraL, false, gfx.stereoBufL);
        this._renderScene(this._gfx.stereoCam.cameraR, false, gfx.stereoBufR);
        renderer.setRenderTarget(null);
        _anaglyphMat.uniforms.srcL.value = gfx.stereoBufL.texture;
        _anaglyphMat.uniforms.srcR.value = gfx.stereoBufR.texture;
        gfx.renderer.renderScreenQuad(_anaglyphMat);
        break;
      default:
    }

    gfx.renderer2d.render(gfx.scene, gfx.camera);

    if (settings.now.axes && gfx.axes && !gfx.renderer.xr.enabled) {
      gfx.axes.render(renderer);
    }
  };
}());

Miew.prototype._onBgColorChanged = function () {
  const gfx = this._gfx;
  const color = chooseFogColor();
  if (gfx) {
    if (gfx.scene.fog) {
      gfx.scene.fog.color.set(color);
    }
    gfx.renderer.setClearColor(settings.now.bg.color, Number(!settings.now.bg.transparent));
  }
  this._needRender = true;
};

Miew.prototype._onFogColorChanged = function () {
  const gfx = this._gfx;
  const color = chooseFogColor();
  if (gfx && gfx.scene.fog) {
    gfx.scene.fog.color.set(color);
  }
  this._needRender = true;
};

Miew.prototype._setUberMaterialValues = function (values) {
  this._gfx.root.traverse((obj) => {
    if ((obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Line)
        && obj.material instanceof UberMaterial) {
      obj.material.setValues(values);
      obj.material.needsUpdate = true;
    }
  });
};

Miew.prototype._enableMRT = function (on, renderBuffer, textureBuffer) {
  const gfx = this._gfx;
  const gl = gfx.renderer.getContext();
  const ext = gl.getExtension('WEBGL_draw_buffers');
  const { properties } = gfx.renderer;

  if (!on) {
    ext.drawBuffersWEBGL([gl.COLOR_ATTACHMENT0, null]);
    return;
  }

  // take extra texture from Texture Buffer
  gfx.renderer.setRenderTarget(textureBuffer);
  const tx8 = properties.get(textureBuffer.texture).__webglTexture;
  gl.bindTexture(gl.TEXTURE_2D, tx8);

  // take texture and framebuffer from renderbuffer
  gfx.renderer.setRenderTarget(renderBuffer);
  const fb = properties.get(renderBuffer).__webglFramebuffer;
  const tx = properties.get(renderBuffer.texture).__webglTexture;

  // set framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  fb.width = renderBuffer.width;
  fb.height = renderBuffer.height;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, ext.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, tx8, 0);

  // mapping textures
  ext.drawBuffersWEBGL([gl.COLOR_ATTACHMENT0, ext.COLOR_ATTACHMENT1_WEBGL]);
};

Miew.prototype._renderScene = (function () {
  return function (camera, distortion, target) {
    distortion = distortion || false;
    target = target || null;

    const gfx = this._gfx;

    // render to offscreen buffer
    gfx.renderer.setClearColor(settings.now.bg.color, Number(!settings.now.bg.transparent));
    gfx.renderer.setRenderTarget(target);
    gfx.renderer.clear();
    if (gfx.renderer.xr.enabled) {
      gfx.renderer.render(gfx.scene, camera);
      return;
    }

    // clean buffer for normals texture
    gfx.renderer.setClearColor(0x000000, 0.0);
    gfx.renderer.setRenderTarget(gfx.offscreenBuf4);
    gfx.renderer.clearColor();

    gfx.renderer.setClearColor(settings.now.bg.color, Number(!settings.now.bg.transparent));
    gfx.renderer.setRenderTarget(gfx.offscreenBuf);
    gfx.renderer.clear();

    const bHaveComplexes = (this._getComplexVisual() !== null);
    const volumeVisual = this._getVolumeVisual();
    const ssao = bHaveComplexes && settings.now.ao;

    if (ssao) {
      this._enableMRT(true, gfx.offscreenBuf, gfx.offscreenBuf4);
    }

    if (settings.now.transparency === 'prepass') {
      this._renderWithPrepassTransparency(camera, gfx.offscreenBuf);
    } else if (settings.now.transparency === 'standard') {
      gfx.renderer.setRenderTarget(gfx.offscreenBuf);
      gfx.renderer.render(gfx.scene, camera);
    }

    if (ssao) {
      this._enableMRT(false, null, null);
    }

    // when fxaa we should get resulting image in temp off-screen buff2 for further postprocessing with fxaa filter
    // otherwise we render to canvas
    const outline = bHaveComplexes && settings.now.outline.on;
    const fxaa = bHaveComplexes && settings.now.fxaa;
    const volume = (volumeVisual !== null) && (volumeVisual.getMesh().material != null);
    let dstBuffer = (ssao || outline || volume || fxaa || distortion) ? gfx.offscreenBuf2 : target;
    let srcBuffer = gfx.offscreenBuf;

    if (ssao) {
      this._performAO(
        srcBuffer,
        gfx.offscreenBuf4,
        gfx.offscreenBuf.depthTexture,
        dstBuffer,
        gfx.offscreenBuf3,
        gfx.offscreenBuf2,
      );
      if (!fxaa && !distortion && !volume && !outline) {
        srcBuffer = dstBuffer;
        dstBuffer = target;
        gfx.renderer.setRenderTarget(dstBuffer);
        gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 1.0);
      }
    } else {
      // just copy color buffer to dst buffer
      gfx.renderer.setRenderTarget(dstBuffer);
      gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 1.0);
    }

    // outline
    if (outline) {
      srcBuffer = dstBuffer;
      dstBuffer = (volume || fxaa || distortion) ? gfx.offscreenBuf3 : target;
      if (srcBuffer != null) {
        this._renderOutline(camera, gfx.offscreenBuf, srcBuffer, dstBuffer);
      }
    }

    // render selected part with outline material
    this._renderSelection(camera, gfx.offscreenBuf, dstBuffer);

    if (volume) {
      // copy current picture to the buffer that retains depth-data of the original molecule render
      // so that volume renderer could use depth-test
      gfx.renderer.setRenderTarget(gfx.offscreenBuf);
      gfx.renderer.renderScreenQuadFromTex(dstBuffer.texture, 1.0);
      dstBuffer = gfx.offscreenBuf;
      this._renderVolume(volumeVisual, camera, dstBuffer, gfx.volBFTex, gfx.volFFTex, gfx.volWFFTex);

      // if this is the last stage -- copy image to target
      if (!fxaa && !distortion) {
        gfx.renderer.setRenderTarget(target);
        gfx.renderer.renderScreenQuadFromTex(dstBuffer.texture, 1.0);
      }
    }

    srcBuffer = dstBuffer;

    if (fxaa) {
      dstBuffer = distortion ? gfx.offscreenBuf4 : target;
      this._performFXAA(srcBuffer, dstBuffer);
      srcBuffer = dstBuffer;
    }

    if (distortion) {
      dstBuffer = target;
      this._performDistortion(srcBuffer, dstBuffer, true);
    }
  };
}());

Miew.prototype._performDistortion = (function () {
  const _scene = new THREE.Scene();
  const _camera = new THREE.OrthographicCamera(-1.0, 1.0, 1.0, -1.0, -500, 1000);

  const _material = new THREE.RawShaderMaterial({
    uniforms: {
      srcTex: { type: 't', value: null },
      aberration: { type: 'fv3', value: new THREE.Vector3(1.0) },
    },
    vertexShader: vertexScreenQuadShader,
    fragmentShader: fragmentScreenQuadFromDistTex,
    transparent: false,
    depthTest: false,
    depthWrite: false,
  });

  const _geo = gfxutils.buildDistorionMesh(10, 10, settings.now.debug.stereoBarrel);
  _scene.add(new meshes.Mesh(_geo, _material));

  return function (srcBuffer, targetBuffer, mesh) {
    this._gfx.renderer.setRenderTarget(targetBuffer);
    this._gfx.renderer.clear();

    if (mesh) {
      _material.uniforms.srcTex.value = srcBuffer.texture;
      _material.uniforms.aberration.value.set(0.995, 1.0, 1.01);
      this._gfx.renderer.render(_scene, _camera);
    } else {
      this._gfx.renderer.renderScreenQuadFromTexWithDistortion(srcBuffer, settings.now.debug.stereoBarrel);
    }
  };
}());

Miew.prototype._renderOutline = (function () {
  const _outlineMaterial = new OutlineMaterial({ depth: true });

  return function (camera, srcDepthBuffer, srcColorBuffer, targetBuffer) {
    const self = this;
    const gfx = self._gfx;

    // apply Sobel filter -- draw outline
    _outlineMaterial.uniforms.srcTex.value = srcColorBuffer.texture;
    _outlineMaterial.uniforms.srcDepthTex.value = srcDepthBuffer.depthTexture;
    _outlineMaterial.uniforms.srcTexSize.value.set(srcDepthBuffer.width, srcDepthBuffer.height);
    _outlineMaterial.uniforms.color.value = new THREE.Color(settings.now.outline.color);
    _outlineMaterial.uniforms.threshold.value = settings.now.outline.threshold;
    _outlineMaterial.uniforms.thickness.value = new THREE.Vector2(
      settings.now.outline.thickness,
      settings.now.outline.thickness,
    );

    gfx.renderer.setRenderTarget(targetBuffer);
    gfx.renderer.renderScreenQuad(_outlineMaterial);
  };
}());

Miew.prototype._renderShadowMap = (function () {
  const pars = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat };

  return function () {
    if (!settings.now.shadow.on) {
      return;
    }

    const gfx = this._gfx;
    const currentRenderTarget = gfx.renderer.getRenderTarget();
    const activeCubeFace = gfx.renderer.getActiveCubeFace();
    const activeMipmapLevel = gfx.renderer.getActiveMipmapLevel();

    const _state = gfx.renderer.state;

    // Set GL state for depth map.
    _state.setBlending(THREE.NoBlending);
    _state.buffers.color.setClear(1, 1, 1, 1);
    _state.buffers.depth.setTest(true);
    _state.setScissorTest(false);

    for (let i = 0; i < gfx.scene.children.length; i++) {
      if (gfx.scene.children[i].type === 'DirectionalLight') {
        const light = gfx.scene.children[i];

        if (light.shadow.map == null) {
          light.shadow.map = new THREE.WebGLRenderTarget(light.shadow.mapSize.width, light.shadow.mapSize.height, pars);
          light.shadow.camera.updateProjectionMatrix();
        }
        light.shadow.updateMatrices(light);

        gfx.renderer.setRenderTarget(light.shadow.map);
        gfx.renderer.clear();

        gfx.renderer.render(gfx.scene, light.shadow.camera);
      }
    }
    gfx.renderer.setRenderTarget(currentRenderTarget, activeCubeFace, activeMipmapLevel);
  };
}());

/**
 * Check if there is selection which must be rendered or not.
 * @private
 * @returns {boolean} true on existing selection to render
 */
Miew.prototype._hasSelectionToRender = function () {
  const selPivot = this._gfx.selectionPivot;

  for (let i = 0; i < selPivot.children.length; i++) {
    const selPivotChild = selPivot.children[i];
    if (selPivotChild.children.length > 0) {
      return true;
    }
  }
  return false;
};

Miew.prototype._renderSelection = (function () {
  const _outlineMaterial = new OutlineMaterial();

  return function (camera, srcBuffer, targetBuffer) {
    const self = this;
    const gfx = self._gfx;

    // clear offscreen buffer (leave z-buffer intact)
    gfx.renderer.setClearColor('black', 0);

    // render selection to offscreen buffer
    gfx.renderer.setRenderTarget(srcBuffer);
    gfx.renderer.clear(true, false, false);
    if (self._hasSelectionToRender()) {
      gfx.selectionRoot.matrix = gfx.root.matrix;
      gfx.selectionPivot.matrix = gfx.pivot.matrix;
      gfx.renderer.render(gfx.selectionScene, camera);
    } else {
      // just render something to force "target clear" operation to finish
      gfx.renderer.renderDummyQuad();
    }

    // overlay to screen
    gfx.renderer.setRenderTarget(targetBuffer);
    gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 0.6);

    // apply Sobel filter -- draw outline
    _outlineMaterial.uniforms.srcTex.value = srcBuffer.texture;
    _outlineMaterial.uniforms.srcTexSize.value.set(srcBuffer.width, srcBuffer.height);
    gfx.renderer.renderScreenQuad(_outlineMaterial);
  };
}());

Miew.prototype._checkVolumeRenderingSupport = function (renderTarget) {
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
    // floatFrameBufferWarning = ;
    this.logger.warn('Device doesn\'t support electron density rendering');
    return false;
  }
  return true;
};

Miew.prototype._renderVolume = (function () {
  const volumeBFMat = new VolumeMaterial.BackFacePosMaterial();
  const volumeFFMat = new VolumeMaterial.FrontFacePosMaterial();
  const cubeOffsetMat = new THREE.Matrix4().makeTranslation(0.5, 0.5, 0.5);
  const world2colorMat = new THREE.Matrix4();

  let volumeRenderingSupported;

  return function (volumeVisual, camera, dstBuf, tmpBuf1, tmpBuf2, tmpBuf3) {
    const gfx = this._gfx;

    if (typeof volumeRenderingSupported === 'undefined') {
      volumeRenderingSupported = this._checkVolumeRenderingSupport(tmpBuf1);
    }

    if (!volumeRenderingSupported) {
      return;
    }

    const mesh = volumeVisual.getMesh();

    mesh.rebuild(gfx.camera);

    // use main camera to prepare special textures to be used by volumetric rendering
    // these textures have the size of the window and are stored in offscreen buffers
    gfx.renderer.setClearColor('black', 0);
    gfx.renderer.setRenderTarget(tmpBuf1);
    gfx.renderer.clear();
    gfx.renderer.setRenderTarget(tmpBuf2);
    gfx.renderer.clear();
    gfx.renderer.setRenderTarget(tmpBuf3);
    gfx.renderer.clear();

    gfx.renderer.setRenderTarget(tmpBuf1);
    // draw plane with its own material, because it differs slightly from volumeBFMat
    camera.layers.set(gfxutils.LAYERS.VOLUME_BFPLANE);
    gfx.renderer.render(gfx.scene, camera);

    camera.layers.set(gfxutils.LAYERS.VOLUME);
    gfx.scene.overrideMaterial = volumeBFMat;
    gfx.renderer.render(gfx.scene, camera);

    gfx.renderer.setRenderTarget(tmpBuf2);
    camera.layers.set(gfxutils.LAYERS.VOLUME);
    gfx.scene.overrideMaterial = volumeFFMat;
    gfx.renderer.render(gfx.scene, camera);

    gfx.scene.overrideMaterial = null;
    camera.layers.set(gfxutils.LAYERS.DEFAULT);

    // prepare texture that contains molecule positions
    world2colorMat.copy(mesh.matrixWorld).invert();
    UberMaterial.prototype.uberOptions.world2colorMatrix.multiplyMatrices(cubeOffsetMat, world2colorMat);
    camera.layers.set(gfxutils.LAYERS.COLOR_FROM_POSITION);
    gfx.renderer.setRenderTarget(tmpBuf3);
    gfx.renderer.render(gfx.scene, camera);

    // render volume
    const vm = mesh.material;
    vm.uniforms._BFRight.value = tmpBuf1.texture;
    vm.uniforms._FFRight.value = tmpBuf2.texture;
    vm.uniforms._WFFRight.value = tmpBuf3.texture;
    camera.layers.set(gfxutils.LAYERS.VOLUME);
    gfx.renderer.setRenderTarget(dstBuf);
    gfx.renderer.render(gfx.scene, camera);
    camera.layers.set(gfxutils.LAYERS.DEFAULT);
  };
}());

/*  Render scene with 'ZPrepass transparency Effect'
   * Idea: transparent objects are rendered in two passes. The first one writes result only into depth buffer.
   * The second pass reads depth buffer and writes only to color buffer. The method results in
   * correct image of front part of the semi-transparent objects, but we can see only front transparent objects
   * and opaque objects inside, there is no transparent objects inside.
   * Notes: 1. Opaque objects should be rendered strictly before semi-transparent ones.
   * 2. Realization doesn't use camera layers because scene traversing is used for material changes and
   * we can use it to select needed meshes and don't complicate meshes builders with layers
  */
Miew.prototype._renderWithPrepassTransparency = (function () {
  return function (camera, targetBuffer) {
    const gfx = this._gfx;
    gfx.renderer.setRenderTarget(targetBuffer);

    // opaque objects
    camera.layers.set(gfxutils.LAYERS.DEFAULT);
    gfx.renderer.render(gfx.scene, camera);

    // transparent objects z prepass
    camera.layers.set(gfxutils.LAYERS.PREPASS_TRANSPARENT);
    gfx.renderer.getContext().colorMask(false, false, false, false); // don't update color buffer
    gfx.renderer.render(gfx.scene, camera);
    gfx.renderer.getContext().colorMask(true, true, true, true); // update color buffer

    // transparent objects color pass
    camera.layers.set(gfxutils.LAYERS.TRANSPARENT);
    gfx.renderer.render(gfx.scene, camera);

    // restore default layer
    camera.layers.set(gfxutils.LAYERS.DEFAULT);
  };
}());

Miew.prototype._performFXAA = (function () {
  const _fxaaMaterial = new FXAAMaterial();

  return function (srcBuffer, targetBuffer) {
    if (typeof srcBuffer === 'undefined' || typeof targetBuffer === 'undefined') {
      return;
    }

    const gfx = this._gfx;

    // clear canvas
    gfx.renderer.setClearColor(settings.now.bg.color, Number(!settings.now.bg.transparent));
    gfx.renderer.setRenderTarget(targetBuffer);
    gfx.renderer.clear();

    // do fxaa processing of offscreen buff2
    _fxaaMaterial.uniforms.srcTex.value = srcBuffer.texture;
    _fxaaMaterial.uniforms.srcTexelSize.value.set(1.0 / srcBuffer.width, 1.0 / srcBuffer.height);
    _fxaaMaterial.uniforms.bgColor.value.set(settings.now.bg.color);

    if (_fxaaMaterial.bgTransparent !== settings.now.bg.transparent) {
      _fxaaMaterial.setValues({ bgTransparent: settings.now.bg.transparent });
      _fxaaMaterial.needsUpdate = true;
    }
    gfx.renderer.renderScreenQuad(_fxaaMaterial);
  };
}());

Miew.prototype._performAO = (function () {
  const _aoMaterial = new AOMaterial();
  const _horBlurMaterial = new AOHorBlurMaterial();
  const _vertBlurMaterial = new AOVertBlurWithBlendMaterial();

  const _scale = new THREE.Vector3();
  return function (srcColorBuffer, normalBuffer, srcDepthTexture, targetBuffer, tempBuffer, tempBuffer1) {
    if (!srcColorBuffer || !normalBuffer || !srcDepthTexture || !targetBuffer || !tempBuffer || !tempBuffer1) {
      return;
    }
    const gfx = this._gfx;
    const tanHalfFOV = Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * gfx.camera.fov);

    _aoMaterial.uniforms.diffuseTexture.value = srcColorBuffer.texture;
    _aoMaterial.uniforms.depthTexture.value = srcDepthTexture;
    _aoMaterial.uniforms.normalTexture.value = normalBuffer.texture;
    _aoMaterial.uniforms.srcTexelSize.value.set(1.0 / srcColorBuffer.width, 1.0 / srcColorBuffer.height);
    _aoMaterial.uniforms.camNearFar.value.set(gfx.camera.near, gfx.camera.far);
    _aoMaterial.uniforms.projMatrix.value = gfx.camera.projectionMatrix;
    _aoMaterial.uniforms.aspectRatio.value = gfx.camera.aspect;
    _aoMaterial.uniforms.tanHalfFOV.value = tanHalfFOV;
    gfx.root.matrix.extractScale(_scale);
    _aoMaterial.uniforms.kernelRadius.value = settings.now.debug.ssaoKernelRadius * _scale.x;
    _aoMaterial.uniforms.depthThreshold.value = 2.0 * this._getBSphereRadius(); // diameter
    _aoMaterial.uniforms.factor.value = settings.now.debug.ssaoFactor;
    // N: should be tempBuffer1 for proper use of buffers (see buffers using outside the function)
    gfx.renderer.setRenderTarget(tempBuffer1);
    gfx.renderer.renderScreenQuad(_aoMaterial);

    _horBlurMaterial.uniforms.aoMap.value = tempBuffer1.texture;
    _horBlurMaterial.uniforms.srcTexelSize.value.set(1.0 / tempBuffer1.width, 1.0 / tempBuffer1.height);
    _horBlurMaterial.uniforms.depthTexture.value = srcDepthTexture;
    gfx.renderer.setRenderTarget(tempBuffer);
    gfx.renderer.renderScreenQuad(_horBlurMaterial);

    _vertBlurMaterial.uniforms.aoMap.value = tempBuffer.texture;
    _vertBlurMaterial.uniforms.diffuseTexture.value = srcColorBuffer.texture;
    _vertBlurMaterial.uniforms.srcTexelSize.value.set(1.0 / tempBuffer.width, 1.0 / tempBuffer.height);
    _vertBlurMaterial.uniforms.depthTexture.value = srcDepthTexture;
    _vertBlurMaterial.uniforms.projMatrix.value = gfx.camera.projectionMatrix;
    _vertBlurMaterial.uniforms.aspectRatio.value = gfx.camera.aspect;
    _vertBlurMaterial.uniforms.tanHalfFOV.value = tanHalfFOV;
    const { fog } = gfx.scene;
    if (fog) {
      _vertBlurMaterial.uniforms.fogNearFar.value.set(fog.near, fog.far);
      _vertBlurMaterial.uniforms.fogColor.value.set(fog.color.r, fog.color.g, fog.color.b, settings.now.fogAlpha);
    }
    if ((_vertBlurMaterial.useFog !== settings.now.fog)
      || (_vertBlurMaterial.fogTransparent !== settings.now.bg.transparent)) {
      _vertBlurMaterial.setValues({ useFog: settings.now.fog, fogTransparent: settings.now.bg.transparent });
      _vertBlurMaterial.needsUpdate = true;
    }
    gfx.renderer.setRenderTarget(targetBuffer);
    gfx.renderer.renderScreenQuad(_vertBlurMaterial);
  };
}());

/**
 * Reset the viewer, unload molecules.
 * @param {boolean=} keepReps - Keep representations while resetting viewer state.
 */
Miew.prototype.reset = function (/* keepReps */) {
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

Miew.prototype._resetScene = function () {
  this._objectControls.reset();
  this._objectControls.allowTranslation(true);
  this._objectControls.allowAltObjFreeRotation(true);
  this.resetReps();
  this.resetPivot();
  this.rebuildAll();
};

Miew.prototype.resetView = function () {
  // reset controls
  if (this._picker) {
    this._picker.reset();
  }
  this._setEditMode(EDIT_MODE.COMPLEX);
  this._resetScene();

  // reset selection
  this._forEachComplexVisual((visual) => {
    visual.updateSelectionMask({});
    visual.rebuildSelectionGeometry();
  });
};

Miew.prototype._export = function (format) {
  const TheExporter = _.head(io.exporters.find({ format }));
  if (!TheExporter) {
    this.logger.error('Could not find suitable exporter for this source');
    return Promise.reject(new Error('Could not find suitable exporter for this source'));
  }
  this.dispatchEvent({ type: 'exporting' });

  if (this._visuals[this._curVisualName] instanceof ComplexVisual) {
    let dataSource = null;
    if (TheExporter.SourceClass === ComplexVisual) {
      dataSource = this._visuals[this._curVisualName];
    } else if (TheExporter.SourceClass === Complex) {
      dataSource = this._visuals[this._curVisualName]._complex;
    }
    const exporter = new TheExporter(dataSource, { miewVersion: Miew.VERSION });
    return exporter.export().then((data) => data);
  }
  if (this._visuals[this._curVisualName] instanceof VolumeVisual) {
    return Promise.reject(new Error('Sorry, exporter for volume data not implemented yet'));
  }
  return Promise.reject(new Error('Unexpected format of data'));
};

const rePdbId = /^(?:(pdb|cif|ccp4|dsn6):\s*)?(\d[a-z\d]{3})$/i;
const rePubchem = /^(?:pc|pubchem):\s*([a-z]+)$/i;
const reUrlScheme = /^([a-z][a-z\d\-+.]*):/i;

function resolveSourceShortcut(source, opts) {
  if (!_.isString(source)) {
    return source;
  }

  // e.g. "cif:1CRN"
  const matchesPdbId = rePdbId.exec(source);
  if (matchesPdbId) {
    let [, format = 'pdb', id] = matchesPdbId;

    format = format.toLowerCase();
    id = id.toUpperCase();

    switch (format) {
      case 'pdb':
        source = `https://files.rcsb.org/download/${id}.pdb`;
        break;
      case 'cif':
        source = `https://files.rcsb.org/download/${id}.cif`;
        break;
      case 'ccp4':
        source = `https://www.ebi.ac.uk/pdbe/coordinates/files/${id.toLowerCase()}.ccp4`;
        break;
      case 'dsn6':
        source = `https://edmaps.rcsb.org/maps/${id.toLowerCase()}_2fofc.dsn6`;
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
    const compound = matchesPubchem[1].toLowerCase();
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
  let { binary } = opts;

  // detect by format
  if (opts.fileType !== undefined) {
    const TheParser = _.head(io.parsers.find({ format: opts.fileType }));
    if (TheParser) {
      binary = TheParser.binary || false;
    } else {
      throw new Error('Could not find suitable parser for this format');
    }
  }

  // detect by file extension
  if (binary === undefined && opts.fileExt !== undefined) {
    const TheParser = _.head(io.parsers.find({ ext: opts.fileExt }));
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
  return new Promise(((resolve) => {
    if (job.shouldCancel()) {
      throw new Error('Operation cancelled');
    }
    job.notify({ type: 'fetching' });

    // allow for source shortcuts
    source = resolveSourceShortcut(source, opts);

    // detect a proper loader
    const TheLoader = _.head(io.loaders.find({ type: opts.sourceType, source }));
    if (!TheLoader) {
      throw new Error(LOADER_NOT_FOUND);
    }

    // split file name
    const fileName = opts.fileName || TheLoader.extractName(source);
    if (fileName) {
      const [name, fileExt] = utils.splitFileName(fileName);
      _.defaults(opts, { name, fileExt, fileName });
    }

    // should it be text or binary?
    updateBinaryMode(opts);

    // FIXME: All new settings retrieved from server are applied after the loading is complete. However, we need some
    // flags to alter the loading process itself. Here we apply them in advance. Dirty hack. Kill the server, remove
    // all hacks and everybody's happy.
    let newOptions = _.get(opts, 'preset.expression');
    if (!_.isUndefined(newOptions)) {
      newOptions = JSON.parse(newOptions);
      if (newOptions && newOptions.settings) {
        const keys = ['singleUnit'];
        for (let keyIndex = 0, keyCount = keys.length; keyIndex < keyCount; ++keyIndex) {
          const key = keys[keyIndex];
          const value = _.get(newOptions.settings, key);
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
        job.notify({ type: 'fetchingDone', data });
        return data;
      })
      .catch((error) => {
        console.timeEnd('fetch');
        opts.context.logger.debug(error.message);
        if (error.stack) {
          opts.context.logger.debug(error.stack);
        }
        opts.context.logger.error('Fetching failed');
        job.notify({ type: 'fetchingDone', error });
        throw error;
      });
    resolve(promise);
  }));
}

function _parseData(data, opts, job) {
  if (job.shouldCancel()) {
    return Promise.reject(new Error('Operation cancelled'));
  }

  job.notify({ type: 'parsing' });

  const TheParser = _.head(io.parsers.find({ format: opts.fileType, ext: opts.fileExt, data }));
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
      job.notify({ type: 'parsingDone', data: dataSet });
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
      job.notify({ type: 'parsingDone', error });
      throw error;
    });
}

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
Miew.prototype.load = function (source, opts) {
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

  this._interpolator.reset();

  this.dispatchEvent({ type: 'loading', options: opts, source });

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
    job.notify({ type: 'loadingDone', anything });
    return anything;
  };

  return _fetchData(source, opts, job)
    .then((data) => _parseData(data, opts, job))
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
Miew.prototype.unload = function (name) {
  this._removeVisual(name || this.getCurrentVisual());
  this.resetPivot();
  if (settings.now.shadow.on) {
    this._updateShadowCamera();
  }
};

/**
 * Start new animation. Now is broken.
 * @param fileData - new data to animate
 * @private
 * @deprecated until animation system refactoring.
 */
Miew.prototype._startAnimation = function (fileData) {
  this._stopAnimation();
  const self = this;
  const visual = this._getComplexVisual();
  if (visual === null) {
    this.logger.error('Unable to start animation - no molecule is loaded.');
    return;
  }
  try {
    this._frameInfo = new FrameInfo(
      visual.getComplex(),
      fileData,
      {
        onLoadStatusChanged() {
          self.dispatchEvent({
            type: 'mdPlayerStateChanged',
            state: {
              isPlaying: self._isAnimating,
              isLoading: self._frameInfo ? self._frameInfo.isLoading : true,
            },
          });
        },
        onError(message) {
          self._stopAnimation();
          self.logger.error(message);
        },
      },
    );
  } catch (e) {
    this.logger.error('Animation file does not fit to current complex!');
    return;
  }
  this._continueAnimation();
};

/**
 * Pause current animation. Now is broken.
 * @private
 * @deprecated until animation system refactoring.
 */
Miew.prototype._pauseAnimation = function () {
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
        isLoading: this._frameInfo.isLoading,
      },
    });
  }
};

/**
 * Continue current animation after pausing. Now is broken.
 * @private
 * @deprecated until animation system refactoring.
 */
Miew.prototype._continueAnimation = function () {
  this._isAnimating = true;
  let minFrameTime = 1000 / settings.now.maxfps;
  minFrameTime = Number.isNaN(minFrameTime) ? 0 : minFrameTime;
  const self = this;
  const { pivot } = self._gfx;
  const visual = this._getComplexVisual();
  if (visual) {
    visual.resetSelectionMask();
    visual.rebuildSelectionGeometry();
    this._msgAtomInfo.style.opacity = 0.0;
  }
  this._animInterval = setInterval(() => {
    self.dispatchEvent({
      type: 'mdPlayerStateChanged',
      state: {
        isPlaying: self._isAnimating,
        isLoading: self._frameInfo.isLoading,
      },
    });
    if (self._frameInfo.frameIsReady) {
      pivot.updateToFrame(self._frameInfo);
      self._updateObjsToFrame(self._frameInfo);
      self._refreshTitle(` Frame ${self._frameInfo._currFrame} of ${self._frameInfo._framesCount
      } time interval - ${self._frameInfo._timeStep}`);
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

/**
 * Stop current animation. Now is broken.
 * @private
 * @deprecated until animation system refactoring.
 */
Miew.prototype._stopAnimation = function () {
  if (this._animInterval === null) {
    return;
  }
  clearInterval(this._animInterval);
  this._frameInfo.disableEvents();
  this._frameInfo = null;
  this._animInterval = null;
  this.dispatchEvent({
    type: 'mdPlayerStateChanged',
    state: null,
  });
};

/**
 * Invoked upon successful loading of some data source
 * @param {DataSource} dataSource - Data source for visualization (molecular complex or other)
 * @param {object} opts - Options.
 * @private
 */
Miew.prototype._onLoad = function (dataSource, opts) {
  const gfx = this._gfx;
  let visualName = null;

  if (opts.animation) {
    this._refreshTitle();
    this._startAnimation(dataSource);
    return null;
  }
  this._stopAnimation();
  if (!opts || !opts.keepRepsInfo) {
    this._opts.reps = null;
    this._opts._objects = null;
  }

  if (dataSource.id === 'Complex') {
    const complex = dataSource;

    // update title
    if (opts.fileName) {
      complex.name = complex.name || removeExtension(opts.fileName).toUpperCase();
    } else if (opts.amberFileName) {
      complex.name = complex.name || removeExtension(opts.amberFileName).toUpperCase();
    } else {
      complex.name = `Dynamic ${opts.fileType} molecule`;
    }

    visualName = this._addVisual(new ComplexVisual(complex.name, complex));
    this._curVisualName = visualName;

    const desc = this.info();
    this.logger.info(`Parsed ${opts.fileName} (${
      desc.atoms} atoms, ${
      desc.bonds} bonds, ${
      desc.residues} residues, ${
      desc.chains} chains).`);

    if (_.isNumber(this._opts.unit)) {
      complex.setCurrentUnit(this._opts.unit);
    }

    if (opts.preset) {
      // ...removed server access...
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

  // reset global transform
  gfx.root.resetTransform();
  this.resetPivot();

  // set scale to fit everything on the screen
  this._objectControls.setScale(settings.now.radiusToFit / this._getBSphereRadius());

  this._resetObjects();

  if (settings.now.autoResolution) {
    this._tweakResolution();
  }

  if (settings.now.shadow.on) {
    this._updateShadowCamera();
  }

  if (this._opts.view) {
    this.view(this._opts.view);
    delete this._opts.view;
  }

  this._refreshTitle();

  return visualName;
};

Miew.prototype.resetEd = function () {
  if (this._edLoader) {
    this._edLoader.abort();
    this._edLoader = null;
  }

  // free all resources
  this._removeVisual(this._getVolumeVisual());

  this._needRender = true;
};

Miew.prototype.loadEd = function (source) {
  this.resetEd();

  const TheLoader = _.head(io.loaders.find({ source }));
  if (!TheLoader) {
    this.logger.error(LOADER_NOT_FOUND);
    return Promise.reject(new Error(LOADER_NOT_FOUND));
  }

  const loader = this._edLoader = new TheLoader(source, { binary: true });
  loader.context = this;
  return loader.load().then((data) => {
    const TheParser = _.head(io.parsers.find({ format: 'ccp4' }));
    if (!TheParser) {
      throw new Error(PARSER_NOT_FOUND);
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

Miew.prototype._onLoadEd = function (dataSource) {
  dataSource.normalize();

  const volumeVisual = new VolumeVisual('volume', dataSource);
  volumeVisual.getMesh().layers.set(gfxutils.LAYERS.VOLUME); // volume mesh is not visible to common render
  const visualName = this._addVisual(volumeVisual);

  this._needRender = true;
  return visualName;
};

Miew.prototype._needRebuild = function () {
  let needsRebuild = false;
  this._forEachComplexVisual((visual) => {
    needsRebuild = needsRebuild || visual.needsRebuild();
  });
  return needsRebuild;
};

Miew.prototype._rebuildObjects = function () {
  const self = this;
  const gfx = this._gfx;
  let i;
  let n;

  // remove old object geometry
  const toRemove = [];
  for (i = 0; i < gfx.pivot.children.length; ++i) {
    const child = gfx.pivot.children[i];
    if (!(child instanceof Visual)) {
      toRemove.push(child);
    }
  }
  for (i = 0; i < toRemove.length; ++i) {
    toRemove[i].parent.remove(toRemove[i]);
  }

  setTimeout(() => {
    const objList = self._objects;
    for (i = 0, n = objList.length; i < n; ++i) {
      const obj = objList[i];
      if (obj.needsRebuild) {
        obj.build();
      }
      if (obj.getGeometry()) {
        gfx.pivot.add(obj.getGeometry());
      }
    }
  }, 10);
};

Miew.prototype.changeUnit = function (unitIdx, name) {
  const visual = this._getComplexVisual(name);
  if (!visual) {
    throw new Error('There is no complex to change!');
  }

  function currentUnitInfo() {
    const unit = visual ? visual.getComplex().getCurrentUnit() : 0;
    const type = unit > 0 ? (`Bio molecule ${unit}`) : 'Asymmetric unit';
    return `Current unit: ${unit} (${type})`;
  }

  if (unitIdx === undefined) {
    return currentUnitInfo();
  }
  if (_.isString(unitIdx)) {
    unitIdx = Math.max(parseInt(unitIdx, 10), 0);
  }
  if (visual.getComplex().setCurrentUnit(unitIdx)) {
    this._resetScene();
    this._updateInfoPanel();
  }
  return currentUnitInfo();
};

/**
 * Start to rebuild geometry asynchronously.
 */
Miew.prototype.rebuild = function () {
  if (this._building) {
    this.logger.warn('Miew.rebuild(): already building!');
    return;
  }
  this._building = true;

  this.dispatchEvent({ type: 'rebuilding' });

  this._rebuildObjects();

  this._gfx.renderer2d.reset();

  const rebuildActions = [];
  this._forEachComplexVisual((visual) => {
    if (visual.needsRebuild()) {
      rebuildActions.push(visual.rebuild().then(() => new Promise(((resolve) => {
        visual.rebuildSelectionGeometry();
        resolve();
      }))));
    }
  });

  // Start asynchronous rebuild
  const self = this;
  this._spinner.spin(this._container);
  Promise.all(rebuildActions).then(() => {
    self._spinner.stop();

    self._needRender = true;

    self._refreshTitle();
    this.dispatchEvent({ type: 'buildingDone' });
    self._building = false;
  });
};

/** Mark all representations for rebuilding */
Miew.prototype.rebuildAll = function () {
  this._forEachComplexVisual((visual) => {
    visual.setNeedsRebuild();
  });
};

Miew.prototype._refreshTitle = function (appendix) {
  let title;
  appendix = appendix === undefined ? '' : appendix;
  const visual = this._getComplexVisual();
  if (visual) {
    title = visual.getComplex().name;
    const rep = visual.repGet(visual.repCurrent());
    title += (rep ? ` – ${rep.mode.name} Mode` : '');
  } else {
    title = Object.keys(this._visuals).length > 0 ? 'Unknown' : 'No Data';
  }
  title += appendix;

  this.dispatchEvent({ type: 'titleChanged', data: title });
};

Miew.prototype.setNeedRender = function () {
  this._needRender = true;
};

Miew.prototype._extractRepresentation = function () {
  const changed = [];

  this._forEachComplexVisual((visual) => {
    if (visual.getSelectionCount() === 0) {
      return;
    }

    const selector = visual.buildSelectorFromMask(1 << visual.getSelectionBit());
    const defPreset = settings.now.presets.default;
    const res = visual.repAdd({
      selector,
      mode: defPreset[0].mode.id,
      colorer: defPreset[0].colorer.id,
      material: defPreset[0].material.id,
    });
    if (!res) {
      if (visual.repCount() === ComplexVisual.NUM_REPRESENTATION_BITS) {
        this.logger.warn(`Number of representations is limited to ${ComplexVisual.NUM_REPRESENTATION_BITS}`);
      }
      return;
    }

    this.dispatchEvent({ type: 'repAdded', index: res.index, name: visual.name });
    visual.repCurrent(res.index);

    changed.push(visual.name);
  });

  if (changed.length > 0) {
    this.logger.report(`New representation from selection for complexes: ${changed.join(', ')}`);
  }
};

/**
 * Change current representation list.
 * @param {array} reps - Representation list.
 */
Miew.prototype._setReps = function (reps) {
  reps = reps || (this._opts && this._opts.reps) || [];
  this._forEachComplexVisual((visual) => visual.resetReps(reps));
};

/**
 * Apply existing preset to current scene.
 * @param preset
 */
Miew.prototype.applyPreset = function (preset) {
  const { presets } = settings.now;
  const presList = [
    preset || settings.defaults.preset,
    settings.defaults.preset,
    Object.keys(presets)[0],
  ];
  let reps = null;
  for (let i = 0; !reps && i < presList.length; ++i) {
    settings.set('preset', presList[i]);
    reps = presets[settings.now.preset];
    if (!reps) {
      this.logger.warn(`Unknown preset "${settings.now.preset}"`);
    }
  }
  this._setReps(reps);
};

/**
 * Reset current representation list to initial values.
 * @param {string} [preset] - The source preset in case of uninitialized representation list.
 */
Miew.prototype.resetReps = function (preset) {
  const reps = this._opts && this._opts.reps;
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
Miew.prototype.repCount = function (name) {
  const visual = this._getComplexVisual(name);
  return visual ? visual.repCount() : 0;
};

/**
 * Get or set the current representation index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
 * @param {string=} [name] - Complex name. Defaults to the current one.
 * @returns {number} The current index.
 */
Miew.prototype.repCurrent = function (index, name) {
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
Miew.prototype.rep = function (index, rep) {
  const visual = this._getComplexVisual('');
  if (!visual) {
    return null;
  }
  const res = visual.rep(index, rep);
  if (res.status === 'created') {
    this.dispatchEvent({ type: 'repAdded', index: res.index, name: visual.name });
  } else if (res.status === 'changed') {
    this.dispatchEvent({ type: 'repChanged', index: res.index, name: visual.name });
  }
  return res.desc;
};

/**
 * Get representation (not just description) by index.
 * @param {number=} index - Zero-based index, up to {@link Miew#repCount}(). Defaults to the current one.
 * @returns {?object} Representation.
 */
Miew.prototype.repGet = function (index, name) {
  const visual = this._getComplexVisual(name);
  return visual ? visual.repGet(index) : null;
};

/**
 * Add new representation.
 * @param {object=} rep - Representation description.
 * @returns {number} Index of the new representation.
 */
Miew.prototype.repAdd = function (rep, name) {
  const visual = this._getComplexVisual(name);
  if (!visual) {
    return -1;
  }

  const res = visual.repAdd(rep);
  if (res) {
    this.dispatchEvent({ type: 'repAdded', index: res.index, name });
    return res.index;
  }
  return -1;
};

/**
 * Remove representation.
 * @param {number=} index - Zero-based representation index.
 */
Miew.prototype.repRemove = function (index, name) {
  const visual = this._getComplexVisual(name);
  if (!visual) {
    return;
  }

  visual.repRemove(index);
  this.dispatchEvent({ type: 'repRemoved', index, name });
};

/**
 * Hide representation.
 * @param {number} index - Zero-based representation index.
 * @param {boolean=} hide - Specify false to make rep visible, true to hide (by default).
 */
Miew.prototype.repHide = function (index, hide, name) {
  this._needRender = true;
  const visual = this._getComplexVisual(name);
  return visual ? visual.repHide(index, hide) : null;
};

Miew.prototype._setEditMode = function (mode) {
  this._editMode = mode;

  const elem = this._msgMode;
  if (elem) {
    elem.style.opacity = (mode === EDIT_MODE.COMPLEX) ? 0.0 : 1.0;

    if (mode !== EDIT_MODE.COMPLEX) {
      const t = elem.getElementsByTagName('p')[0];
      t.innerHTML = (mode === EDIT_MODE.COMPONENT) ? 'COMPONENT EDIT MODE' : 'FRAGMENT EDIT MODE';
    }
  }

  this.dispatchEvent({ type: 'editModeChanged', data: mode === EDIT_MODE.COMPLEX });
};

Miew.prototype._enterComponentEditMode = function () {
  if (this._editMode !== EDIT_MODE.COMPLEX) {
    return;
  }

  const editors = [];
  this._forEachComplexVisual((visual) => {
    const editor = visual.beginComponentEdit();
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

Miew.prototype._applyComponentEdit = function () {
  if (this._editMode !== EDIT_MODE.COMPONENT) {
    return;
  }

  this._objectControls.stop();
  this._objectControls.keysTranslateObj(false);

  for (let i = 0; i < this._editors.length; ++i) {
    this._editors[i].apply();
  }
  this._editors = [];

  this.logger.info('COMPONENT EDIT MODE -- OFF (applied)');
  this._setEditMode(EDIT_MODE.COMPLEX);

  this.rebuildAll();
};

Miew.prototype._discardComponentEdit = function () {
  if (this._editMode !== EDIT_MODE.COMPONENT) {
    return;
  }

  this._objectControls.stop();
  this._objectControls.keysTranslateObj(false);

  for (let i = 0; i < this._editors.length; ++i) {
    this._editors[i].discard();
  }
  this._editors = [];

  this.logger.info('COMPONENT EDIT MODE -- OFF (discarded)');
  this._setEditMode(EDIT_MODE.COMPLEX);

  this._needRender = true;
  this.rebuildAll();
};

Miew.prototype._enterFragmentEditMode = function () {
  if (this._editMode !== EDIT_MODE.COMPLEX) {
    return;
  }

  const selectedVisuals = [];
  this._forEachComplexVisual((visual) => {
    if (visual instanceof ComplexVisual
          && visual.getSelectionCount() > 0) {
      selectedVisuals.push(visual);
    }
  });

  if (selectedVisuals.length !== 1) {
    // either we have no selection or
    // we have selected atoms in two or more visuals -- not supported
    return;
  }

  const editor = selectedVisuals[0].beginFragmentEdit();
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

Miew.prototype._applyFragmentEdit = function () {
  if (this._editMode !== EDIT_MODE.FRAGMENT) {
    return;
  }

  this._objectControls.stop();

  for (let i = 0; i < this._editors.length; ++i) {
    this._editors[i].apply();
  }
  this._editors = [];

  this.logger.info('FRAGMENT EDIT MODE -- OFF (applied)');
  this._setEditMode(EDIT_MODE.COMPLEX);
  this._objectControls.allowTranslation(true);
  this._objectControls.allowAltObjFreeRotation(true);

  this.rebuildAll();
};

Miew.prototype._discardFragmentEdit = function () {
  if (this._editMode !== EDIT_MODE.FRAGMENT) {
    return;
  }

  this._objectControls.stop();

  for (let i = 0; i < this._editors.length; ++i) {
    this._editors[i].discard();
  }
  this._editors = [];

  this.logger.info('FRAGMENT EDIT MODE -- OFF (discarded)');
  this._setEditMode(EDIT_MODE.COMPLEX);
  this._objectControls.allowTranslation(true);
  this._objectControls.allowAltObjFreeRotation(true);

  this._needRender = true;
};

Miew.prototype._onPick = function (event) {
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
  let complex = null;
  if (event.obj.atom) {
    complex = event.obj.atom.residue.getChain().getComplex();
    this._lastPick = event.obj.atom;
  } else if (event.obj.residue) {
    complex = event.obj.residue.getChain().getComplex();
    this._lastPick = event.obj.residue;
  } else if (event.obj.chain) {
    complex = event.obj.chain.getComplex();
    this._lastPick = event.obj.chain;
  } else if (event.obj.molecule) {
    complex = event.obj.molecule.complex;
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
    const visual = this._getVisualForComplex(complex);
    if (visual) {
      _updateSelection(visual);
      this._needRender = true;
    }
  } else {
    this._forEachComplexVisual(_updateSelection);
    this._needRender = true;
  }

  this._updateInfoPanel();
  this.dispatchEvent(event);
};

Miew.prototype._onKeyDown = function (event) {
  if (!this._running || !this._hotKeysEnabled) {
    return;
  }

  // editing keys
  if (settings.now.editing) {
    switch (event.code) {
      case 'KeyC':
        this._enterComponentEditMode();
        break;
      case 'KeyF':
        this._enterFragmentEditMode();
        break;
      case 'KeyA':
        switch (this._editMode) {
          case EDIT_MODE.COMPONENT:
            this._applyComponentEdit();
            break;
          case EDIT_MODE.FRAGMENT:
            this._applyFragmentEdit();
            break;
          default:
            break;
        }
        break;
      case 'KeyD':
        switch (this._editMode) {
          case EDIT_MODE.COMPONENT:
            this._discardComponentEdit();
            break;
          case EDIT_MODE.FRAGMENT:
            this._discardFragmentEdit();
            break;
          default:
            break;
        }
        break;
      default:
    }
  }

  // other keys
  switch (event.code) {
    case 'NumpadAdd':
      if (event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        this._forEachComplexVisual((visual) => {
          visual.expandSelection();
          visual.rebuildSelectionGeometry();
        });
        this._updateInfoPanel();
        this._needRender = true;
      }
      break;
    case 'NumpadSubtract':
      if (event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        this._forEachComplexVisual((visual) => {
          visual.shrinkSelection();
          visual.rebuildSelectionGeometry();
        });
        this._updateInfoPanel();
        this._needRender = true;
      }
      break;
    default:
  }
};

Miew.prototype._onKeyUp = function (event) {
  if (!this._running || !this._hotKeysEnabled) {
    return;
  }

  if (event.code === 'KeyX') {
    this._extractRepresentation();
  }
};

Miew.prototype._updateInfoPanel = function () {
  const info = this._msgAtomInfo.getElementsByTagName('p')[0];
  let atom;
  let residue;

  let count = 0;
  this._forEachComplexVisual((visual) => {
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
    residue = atom.residue;

    aName = atom.name;
    const location = (atom.location !== 32) ? String.fromCharCode(atom.location) : ''; // 32 is code of white-space
    secondLine = `${atom.element.fullName} #${atom.serial}${location}: \
      ${residue._chain._name}.${residue._type._name}${residue._sequence}${residue._icode.trim()}.`;
    secondLine += aName;

    coordLine = `Coord: (${atom.position.x.toFixed(2).toString()},\
     ${atom.position.y.toFixed(2).toString()},\
     ${atom.position.z.toFixed(2).toString()})`;
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

  if (coordLine !== '') {
    info.appendChild(document.createElement('br'));
    info.appendChild(document.createTextNode(coordLine));
  }

  this._msgAtomInfo.style.opacity = 1.0;
};

Miew.prototype._getAltObj = function () {
  if (this._editors) {
    let altObj = null;
    for (let i = 0; i < this._editors.length; ++i) {
      const nextAltObj = this._editors[i].getAltObj();
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
    pivot: new THREE.Vector3(0, 0, 0),
  };
};

Miew.prototype.resetPivot = (function () {
  const boundingBox = new THREE.Box3();
  const center = new THREE.Vector3();

  return function () {
    boundingBox.makeEmpty();
    this._forEachVisual((visual) => {
      boundingBox.union(visual.getBoundaries().boundingBox);
    });

    boundingBox.getCenter(center);
    this._objectControls.setPivot(center.negate());
    this.dispatchEvent({ type: 'transform' });
  };
}());

Miew.prototype.setPivotResidue = (function () {
  const center = new THREE.Vector3();

  return function (residue) {
    const visual = this._getVisualForComplex(residue.getChain().getComplex());
    if (!visual) {
      return;
    }

    if (residue._controlPoint) {
      center.copy(residue._controlPoint);
    } else {
      let x = 0;
      let y = 0;
      let z = 0;
      const amount = residue._atoms.length;
      for (let i = 0; i < amount; ++i) {
        const p = residue._atoms[i].position;
        x += p.x / amount;
        y += p.y / amount;
        z += p.z / amount;
      }
      center.set(x, y, z);
    }
    center.applyMatrix4(visual.matrix).negate();
    this._objectControls.setPivot(center);
    this.dispatchEvent({ type: 'transform' });
  };
}());

Miew.prototype.setPivotAtom = (function () {
  const center = new THREE.Vector3();

  return function (atom) {
    const visual = this._getVisualForComplex(atom.residue.getChain().getComplex());
    if (!visual) {
      return;
    }

    center.copy(atom.position);
    center.applyMatrix4(visual.matrix).negate();
    this._objectControls.setPivot(center);
    this.dispatchEvent({ type: 'transform' });
  };
}());

Miew.prototype.getSelectionCenter = (function () {
  const _centerInVisual = new THREE.Vector3(0.0, 0.0, 0.0);

  return function (center, includesAtom, selector) {
    center.set(0.0, 0.0, 0.0);
    let count = 0;

    this._forEachComplexVisual((visual) => {
      if (visual.getSelectionCenter(_centerInVisual, includesAtom, selector || visual.getSelectionBit())) {
        center.add(_centerInVisual);
        count++;
      }
    });
    if (count === 0) {
      return false;
    }
    center.divideScalar(count);
    center.negate();
    return true;
  };
}());

Miew.prototype.setPivotSubset = (function () {
  const _center = new THREE.Vector3(0.0, 0.0, 0.0);

  function _includesInCurSelection(atom, selectionBit) {
    return atom.mask & (1 << selectionBit);
  }

  function _includesInSelector(atom, selector) {
    return selector.selector.includesAtom(atom);
  }

  return function (selector) {
    const includesAtom = (selector) ? _includesInSelector : _includesInCurSelection;

    if (this.getSelectionCenter(_center, includesAtom, selector)) {
      this._objectControls.setPivot(_center);
      this.dispatchEvent({ type: 'transform' });
    } else {
      this.logger.warn('selection is empty. Center operation not performed');
    }
  };
}());

/**
 * Makes a screenshot.
 * @param {number} [width] - Width of an image. Defaults to the canvas width.
 * @param {number} [height] - Height of an image. Defaults to the width (square) or canvas height,
 *        if width is omitted too.
 * @returns {string} Data URL representing the image contents.
 */
Miew.prototype.screenshot = function (width, height) {
  const gfx = this._gfx;
  const deviceWidth = gfx.renderer.domElement.width;
  const deviceHeight = gfx.renderer.domElement.height;

  function fov2Tan(fov) {
    return Math.tan(THREE.MathUtils.degToRad(0.5 * fov));
  }

  function tan2Fov(tan) {
    return THREE.MathUtils.radToDeg(Math.atan(tan)) * 2.0;
  }

  function getDataURL() {
    let dataURL;
    const currBrowser = utils.getBrowser();

    if (currBrowser === utils.browserType.SAFARI) {
      const canvas = document.createElement('canvas');
      const canvasContext = canvas.getContext('2d');

      canvas.width = width === undefined ? deviceWidth : width;
      canvas.height = height === undefined ? deviceHeight : height;

      canvasContext.drawImage(gfx.renderer.domElement, 0, 0, canvas.width, canvas.height);
      dataURL = canvas.toDataURL('image/png');
    } else {
      // Copy current canvas to screenshot
      dataURL = gfx.renderer.domElement.toDataURL('image/png');
    }
    return dataURL;
  }
  height = height || width;

  let screenshotURI;
  if ((width === undefined && height === undefined)
    || (width === deviceWidth && height === deviceHeight)) {
    // renderer.domElement.toDataURL('image/png') returns flipped image in Safari
    // It hasn't been resolved yet, but getScreenshotSafari()
    // fixes it using an extra canvas.
    screenshotURI = getDataURL();
  } else {
    const originalAspect = gfx.camera.aspect;
    const originalFov = gfx.camera.fov;
    const originalTanFov2 = fov2Tan(gfx.camera.fov);

    // screenshot should contain the principal area of interest (a centered square touching screen sides)
    const areaOfInterestSize = Math.min(gfx.width, gfx.height);
    const areaOfInterestTanFov2 = originalTanFov2 * areaOfInterestSize / gfx.height;

    // set appropriate camera aspect & FOV
    const shotAspect = width / height;
    gfx.renderer.setPixelRatio(1);
    gfx.camera.aspect = shotAspect;
    gfx.camera.fov = tan2Fov(areaOfInterestTanFov2 / Math.min(shotAspect, 1.0));
    gfx.camera.updateProjectionMatrix();

    // resize canvas to the required size of screenshot
    gfx.renderer.setDrawingBufferSize(width, height, 1);

    // make screenshot
    this._renderFrame(settings.now.stereo);
    screenshotURI = getDataURL();

    // restore original camera & canvas proportions
    gfx.renderer.setPixelRatio(window.devicePixelRatio);
    gfx.camera.aspect = originalAspect;
    gfx.camera.fov = originalFov;
    gfx.camera.updateProjectionMatrix();
    gfx.renderer.setDrawingBufferSize(gfx.width, gfx.height, window.devicePixelRatio);
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
Miew.prototype.screenshotSave = function (filename, width, height) {
  const uri = this.screenshot(width, height);
  utils.shotDownload(uri, filename);
};

Miew.prototype.save = function (opts) {
  this._export(opts.fileType).then((dataString) => {
    const filename = this._visuals[this._curVisualName]._complex.name;
    utils.download(dataString, filename, opts.fileType);
    this._refreshTitle();
    this.dispatchEvent({ type: 'exportingDone' });
  }).catch((error) => {
    this.logger.error('Could not export data');
    this.logger.debug(error);
    this._refreshTitle();
    this.dispatchEvent({ type: 'exportingDone', error });
  });
};

Miew.prototype._tweakResolution = function () {
  const maxPerf = [
    ['poor', 100],
    ['low', 500],
    ['medium', 1000],
    ['high', 5000],
    ['ultra', Number.MAX_VALUE],
  ];

  let atomCount = 0;
  this._forEachComplexVisual((visual) => {
    atomCount += visual.getComplex().getAtomCount();
  });

  if (atomCount > 0) {
    const performance = this._gfxScore * 10e5 / atomCount;
    // set resolution based on estimated performance
    for (let i = 0; i < maxPerf.length; ++i) {
      if (performance < maxPerf[i][1]) {
        this._autoChangeResolution(maxPerf[i][0]);
        break;
      }
    }
  }
};

Miew.prototype._autoChangeResolution = function (resolution) {
  if (resolution !== settings.now.resolution) {
    this.logger.report(`Your rendering resolution was changed to "${resolution}" for best performance.`);
  }
  settings.now.resolution = resolution;
};

/**
 * Save current settings to cookies.
 */
Miew.prototype.saveSettings = function () {
  this._cookies.setCookie(this._opts.settingsCookie, JSON.stringify(this.settings.getDiffs(true)));
};

/**
 * Load settings from cookies.
 */
Miew.prototype.restoreSettings = function () {
  try {
    const cookie = this._cookies.getCookie(this._opts.settingsCookie);
    const diffs = cookie ? JSON.parse(cookie) : {};
    this.settings.applyDiffs(diffs, true);
  } catch (e) {
    this.logger.error(`Cookies parse error: ${e.message}`);
  }
};

/**
 * Reset current settings to the defaults.
 */
Miew.prototype.resetSettings = function () {
  this.settings.reset();
};

/*
   * DANGEROUS and TEMPORARY. The method should change or disappear in future versions.
   * @param {string|object} opts - See {@link Miew} constructor.
   * @see {@link Miew#set}, {@link Miew#repAdd}, {@link Miew#rep}.
   */
Miew.prototype.setOptions = function (opts) {
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
    this.load(opts.load, { fileType: opts.type });
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

  const visual = this._getComplexVisual();
  if (visual) {
    visual.getComplex().resetCurrentUnit();
    if (_.isNumber(opts.unit)) {
      visual.getComplex().setCurrentUnit(opts.unit);
    }
    this.resetView();
    this.rebuildAll();
  }
};

Miew.prototype.info = function (name) {
  const visual = this._getComplexVisual(name);
  if (!visual) {
    return {};
  }
  const complex = visual.getComplex();
  const { metadata } = complex;
  return {
    id: metadata.id || complex.name || 'UNKNOWN',
    title: (metadata.title && metadata.title.join(' ')) || 'UNKNOWN DATA',
    atoms: complex.getAtomCount(),
    bonds: complex.getBondCount(),
    residues: complex.getResidueCount(),
    chains: complex.getChainCount(),
  };
};

/*
   * OBJECTS SEGMENT
   */

Miew.prototype.addObject = function (objData, bThrow) {
  let Ctor = null;

  if (objData.type === LinesObject.prototype.type) {
    Ctor = LinesObject;
  }

  if (Ctor === null) {
    throw new Error(`Unknown scene object type - ${objData.type}`);
  }

  try {
    const newObj = new Ctor(objData.params, objData.opts);
    this._addSceneObject(newObj);
  } catch (error) {
    if (!bThrow) {
      this.logger.debug(`Error during scene object creation: ${error.message}`);
    } else {
      throw error;
    }
  }
  this._needRender = true;
};

Miew.prototype._addSceneObject = function (sceneObject) {
  const visual = this._getComplexVisual();
  if (sceneObject.build && visual) {
    sceneObject.build(visual.getComplex());
    this._gfx.pivot.add(sceneObject.getGeometry());
  }
  const objects = this._objects;
  objects[objects.length] = sceneObject;
};

Miew.prototype._updateObjsToFrame = function (frameData) {
  const objs = this._objects;
  for (let i = 0, n = objs.length; i < n; ++i) {
    if (objs[i].updateToFrame) {
      objs[i].updateToFrame(frameData);
    }
  }
};

Miew.prototype._resetObjects = function () {
  const objs = this._opts._objects;

  this._objects = [];
  if (objs) {
    for (let i = 0, n = objs.length; i < n; ++i) {
      this.addObject(objs[i], false);
    }
  }
};

Miew.prototype.removeObject = function (index) {
  const obj = this._objects[index];
  if (!obj) {
    throw new Error(`Scene object with index ${index} does not exist`);
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
Miew.prototype.getURL = function (opts) {
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
Miew.prototype.getScript = function (opts) {
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
Miew.prototype._compareReps = function (complexVisual, compareWithDefaults) {
  const ans = {};
  let repCount = 0;

  if (complexVisual) {
    repCount = complexVisual.repCount();
  }

  const currPreset = settings.defaults.presets[settings.now.preset];
  let compare = compareWithDefaults;
  if (currPreset === undefined || currPreset.length > repCount) {
    compare = false;
    ans.preset = 'empty';
  } else if (settings.now.preset !== settings.defaults.preset) {
    ans.preset = settings.now.preset;
  }

  const repsDiff = [];
  let emptyReps = true;
  for (let i = 0, n = repCount; i < n; ++i) {
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
Miew.prototype.getState = function (opts) {
  const state = {};

  opts = _.defaults(opts, {
    compact: true,
    settings: false,
    view: false,
  });

  // load
  const visual = this._getComplexVisual();
  if (visual !== null) {
    const complex = visual.getComplex();
    const { metadata } = complex;
    if (metadata.id) {
      const format = metadata.format ? `${metadata.format}:` : '';
      state.load = format + metadata.id;
    }
    const unit = complex.getCurrentUnit();
    if (unit !== 1) {
      state.unit = unit;
    }
  }

  // representations
  const repsInfo = this._compareReps(visual, opts.compact);
  if (repsInfo.preset) {
    state.preset = repsInfo.preset;
  }

  if (repsInfo.reps) {
    state.reps = repsInfo.reps;
  }

  // objects
  const objects = this._objects;
  const objectsState = [];
  for (let i = 0, n = objects.length; i < n; ++i) {
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
    const diff = this.settings.getDiffs(false);
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
Miew.prototype.get = function (param, value) {
  return settings.get(param, value);
};

Miew.prototype._clipPlaneUpdateValue = function (radius) {
  const clipPlaneValue = Math.max(
    this._gfx.camera.position.z - radius * settings.now.draft.clipPlaneFactor,
    settings.now.camNear,
  );

  const opts = { clipPlaneValue };
  this._forEachComplexVisual((visual) => {
    visual.setUberOptions(opts);
  });
  for (let i = 0, n = this._objects.length; i < n; ++i) {
    const obj = this._objects[i];
    if (obj._line) {
      obj._line.material.setUberOptions(opts);
    }
  }
  if (this._picker !== null) {
    this._picker.clipPlaneValue = clipPlaneValue;
  }
};

Miew.prototype._fogFarUpdateValue = function () {
  if (this._picker !== null) {
    if (this._gfx.scene.fog) {
      this._picker.fogFarValue = this._gfx.scene.fog.far;
    } else {
      this._picker.fogFarValue = undefined;
    }
  }
};

Miew.prototype._updateShadowmapMeshes = function (process) {
  this._forEachComplexVisual((visual) => {
    const reprList = visual._reprList;
    for (let i = 0, n = reprList.length; i < n; ++i) {
      const repr = reprList[i];
      process(repr.geo, repr.material);
    }
  });
};

Miew.prototype._updateMaterials = function (values, needTraverse = false, process = undefined) {
  this._forEachComplexVisual((visual) => visual.setMaterialValues(values, needTraverse, process));
  for (let i = 0, n = this._objects.length; i < n; ++i) {
    const obj = this._objects[i];
    if (obj._line) {
      obj._line.material.setValues(values);
      obj._line.material.needsUpdate = true;
    }
  }
};

Miew.prototype._fogAlphaChanged = function () {
  this._forEachComplexVisual((visual) => {
    visual.setUberOptions({
      fogAlpha: settings.now.fogAlpha,
    });
  });
};

Miew.prototype._embedWebXR = function () {
  // switch off
  if (settings.now.stereo !== 'WEBVR') {
    if (this.webVR) {
      this.webVR.disable();
    }
    this.webVR = null;
    return;
  }
  // switch on
  if (!this.webVR) {
    this.webVR = new WebVRPoC(() => {
      this._requestAnimationFrame(() => this._onTick());
      this._needRender = true;
      this._onResize();
    });
  }
  this.webVR.enable(this._gfx);
};

Miew.prototype._initOnSettingsChanged = function () {
  const on = (props, func) => {
    props = _.isArray(props) ? props : [props];
    props.forEach((prop) => {
      this.settings.addEventListener(`change:${prop}`, func);
    });
  };

  on('modes.VD.frame', () => {
    const volume = this._getVolumeVisual();
    if (volume === null) return;

    volume.showFrame(settings.now.modes.VD.frame);
    this._needRender = true;
  });

  on('modes.VD.isoMode', () => {
    const volume = this._getVolumeVisual();
    if (volume === null) return;

    volume.getMesh().material.updateDefines();
    this._needRender = true;
  });

  on('bg.color', () => {
    this._onBgColorChanged();
  });

  on('ao', () => {
    if (settings.now.ao && !isAOSupported(this._gfx.renderer.getContext())) {
      this.logger.warn('Your device or browser does not support ao');
      settings.set('ao', false);
    } else {
      const values = { normalsToGBuffer: settings.now.ao };
      this._setUberMaterialValues(values);
    }
  });

  on('zSprites', () => {
    if (settings.now.zSprites && !arezSpritesSupported(this._gfx.renderer.getContext())) {
      this.logger.warn('Your device or browser does not support zSprites');
      settings.set('zSprites', false);
    }
    this.rebuildAll();
  });

  on('fogColor', () => {
    this._onFogColorChanged();
  });

  on('fogColorEnable', () => {
    this._onFogColorChanged();
  });

  on('bg.transparent', (evt) => {
    const gfx = this._gfx;
    if (gfx) {
      gfx.renderer.setClearColor(settings.now.bg.color, Number(!settings.now.bg.transparent));
    }
    // update materials
    this._updateMaterials({ fogTransparent: evt.value });
    this.rebuildAll();
  });

  on('draft.clipPlane', (evt) => {
    // update materials
    this._updateMaterials({ clipPlane: evt.value });
    this.rebuildAll();
  });

  on('shadow.on', (evt) => {
    // update materials
    const values = { shadowmap: evt.value, shadowmapType: settings.now.shadow.type };
    const gfx = this._gfx;
    if (gfx) {
      gfx.renderer.shadowMap.enabled = Boolean(values.shadowmap);
    }
    this._updateMaterials(values, true);
    if (values.shadowmap) {
      this._updateShadowCamera();
      this._updateShadowmapMeshes(meshutils.createShadowmapMaterial);
    } else {
      this._updateShadowmapMeshes(meshutils.removeShadowmapMaterial);
    }
    this._needRender = true;
  });

  on('shadow.type', (evt) => {
    // update materials if shadowmap is enable
    if (settings.now.shadow.on) {
      this._updateMaterials({ shadowmapType: evt.value }, true);
      this._needRender = true;
    }
  });

  on('shadow.radius', (evt) => {
    for (let i = 0; i < this._gfx.scene.children.length; i++) {
      if (this._gfx.scene.children[i].shadow !== undefined) {
        const light = this._gfx.scene.children[i];
        light.shadow.radius = evt.value;
        this._needRender = true;
      }
    }
  });

  on('fps', () => {
    this._fps.show(settings.now.fps);
  });

  on(['fog', 'fogNearFactor', 'fogFarFactor'], () => {
    this._updateFog();
    this._needRender = true;
  });

  on('fogAlpha', () => {
    const { fogAlpha } = settings.now;
    if (fogAlpha < 0 || fogAlpha > 1) {
      this.logger.warn('fogAlpha must belong range [0,1]');
    }
    this._fogAlphaChanged();
    this._needRender = true;
  });

  on('autoResolution', (evt) => {
    if (evt.value && !this._gfxScore) {
      this.logger.warn('Benchmarks are missed, autoresolution will not work! '
        + 'Autoresolution should be set during miew startup.');
    }
  });

  on('stereo', () => {
    this._embedWebXR(settings.now.stereo === 'WEBVR');
    this._needRender = true;
  });

  on(['transparency', 'palette'], () => {
    this.rebuildAll();
  });

  on('resolution', () => {
    // update complex visuals
    this.rebuildAll();

    // update volume visual
    const volume = this._getVolumeVisual();
    if (volume) {
      volume.getMesh().material.updateDefines();
      this._needRender = true;
    }
  });

  on(['axes', 'fxaa', 'ao',
    'outline.on', 'outline.color', 'outline.threshold', 'outline.thickness'], () => {
    this._needRender = true;
  });
};

/**
 * Set parameter value.
 * @param {string|object} params - Parameter name or path (e.g. 'modes.BS.atom') or even settings object.
 * @param {*=} value - Value.
 */
Miew.prototype.set = function (params, value) {
  settings.set(params, value);
};

/**
 * Select atoms with selection string.
 * @param {string} expression - string expression of selection
 * @param {boolean=} append - true to append selection atoms to current selection, false to rewrite selection
 */
Miew.prototype.select = function (expression, append) {
  const visual = this._getComplexVisual();
  if (!visual) {
    return;
  }

  let sel = expression;
  if (_.isString(expression)) {
    sel = selectors.parse(expression).selector;
  }

  visual.select(sel, append);
  this._lastPick = null;

  this._updateInfoPanel();
  this._needRender = true;
};

const VIEW_VERSION = '1';

/**
 * Get or set view info packed into string.
 *
 * **Note:** view is stored for *left-handed* cs, euler angles are stored in radians and *ZXY-order*,
 *
 * @param {string=} expression - Optional string encoded the view
 */
Miew.prototype.view = function (expression) {
  const self = this;
  const { pivot } = this._gfx;
  let transform = [];
  const eulerOrder = 'ZXY';

  function encode() {
    const pos = pivot.position;
    const scale = self._objectControls.getScale() / settings.now.radiusToFit;
    const euler = new THREE.Euler();
    euler.setFromQuaternion(self._objectControls.getOrientation(), eulerOrder);
    transform = [
      pos.x, pos.y, pos.z,
      scale,
      euler.x, euler.y, euler.z,
    ];
    return VIEW_VERSION + utils.arrayToBase64(transform, Float32Array);
  }

  function decode() {
    // backwards compatible: old non-versioned view is the 0th version
    if (expression.length === 40) {
      expression = `0${expression}`;
    }

    const version = expression[0];
    transform = utils.arrayFromBase64(expression.substr(1), Float32Array);

    // apply adapter for old versions
    if (version !== VIEW_VERSION) {
      if (version === '0') {
        // cancel radiusToFit included in old views
        transform[3] /= 8.0;
      } else {
        // do nothing
        self.logger.warn(`Encoded view version mismatch, stored as ${version} vs ${VIEW_VERSION} expected`);
        return;
      }
    }

    const interpolator = self._interpolator;
    const srcView = interpolator.createView();
    srcView.position.copy(pivot.position);
    srcView.scale = self._objectControls.getScale();
    srcView.orientation.copy(self._objectControls.getOrientation());

    const dstView = interpolator.createView();
    dstView.position.set(transform[0], transform[1], transform[2]);

    // hack to make preset views work after we moved centering offset to visual nodes
    // FIXME should only store main pivot offset in preset
    if (self._getComplexVisual()) {
      dstView.position.sub(self._getComplexVisual().position);
    }

    dstView.scale = transform[3]; // eslint-disable-line prefer-destructuring
    dstView.orientation.setFromEuler(new THREE.Euler(transform[4], transform[5], transform[6], eulerOrder));

    interpolator.setup(srcView, dstView);
  }

  if (typeof expression === 'undefined') {
    return encode();
  }
  decode();

  return expression;
};

/*
   * Update current view due to viewinterpolator state
   */
Miew.prototype._updateView = function () {
  const self = this;
  const { pivot } = this._gfx;

  const interpolator = this._interpolator;
  if (!interpolator.wasStarted()) {
    interpolator.start();
  }

  if (!interpolator.isMoving()) {
    return;
  }

  const res = interpolator.getCurrentView();
  if (res.success) {
    const curr = res.view;
    pivot.position.copy(curr.position);
    self._objectControls.setScale(curr.scale * settings.now.radiusToFit);
    self._objectControls.setOrientation(curr.orientation);
    this.dispatchEvent({ type: 'transform' });
    self._needRender = true;
  }
};

/**
 * Translate object by vector
 * @param {number} x - translation value (Ang) along model's X axis
 * @param {number} y - translation value (Ang) along model's Y axis
 * @param {number} z - translation value (Ang) along model's Z axis
 */
Miew.prototype.translate = function (x, y, z) {
  this._objectControls.translatePivot(x, y, z);
  this.dispatchEvent({ type: 'transform' });
  this._needRender = true;
};

/**
 * Rotate object by Euler angles
 * @param {number} x - rotation angle around X axis in radians
 * @param {number} y - rotation angle around Y axis in radians
 * @param {number} z - rotation angle around Z axis in radians
 */
Miew.prototype.rotate = function (x, y, z) {
  this._objectControls.rotate(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ')));
  this.dispatchEvent({ type: 'transform' });
  this._needRender = true;
};

/**
 * Scale object by factor
 * @param {number} factor - scale multiplier, should greater than zero
 */
Miew.prototype.scale = function (factor) {
  if (factor <= 0) {
    throw new RangeError('Scale should be greater than zero');
  }
  this._objectControls.scale(factor);
  this.dispatchEvent({ type: 'transform' });
  this._needRender = true;
};

/**
 * Center view on selection
 * @param {empty | subset | string} selector - defines part of molecule which must be centered (
 * empty - center on current selection;
 * subset - center on picked atom/residue/molecule;
 * string - center on atoms correspond to selection string)
 */
Miew.prototype.center = function (selector) {
  // no arguments - center on current selection;
  if (selector === undefined) {
    this.setPivotSubset();
    this._needRender = true;
    return;
  }
  // subset with atom or residue - center on picked atom/residue;
  if (selector.obj !== undefined && ('atom' in selector.obj || 'residue' in selector.obj)) { // from event with selection
    if ('atom' in selector.obj) {
      this.setPivotAtom(selector.obj.atom);
    } else {
      this.setPivotResidue(selector.obj.residue);
    }
    this._needRender = true;
    return;
  }
  // string - center on atoms correspond to selection string
  if (selector.obj === undefined && selector !== '') {
    const sel = selectors.parse(selector);
    if (sel.error === undefined) {
      this.setPivotSubset(sel);
      this._needRender = true;
      return;
    }
  }
  // empty subset or incorrect/empty string - center on all molecule;
  this.resetPivot();
  this._needRender = true;
};

/**
 * Build selector that contains all atoms within given distance from group of atoms
 * @param {Selector} selector - selector describing source group of atoms
 * @param {number} radius - distance
 * @returns {Selector} selector describing result group of atoms
 */
Miew.prototype.within = function (selector, radius) {
  const visual = this._getComplexVisual();
  if (!visual) {
    return selectors.None();
  }

  if (selector instanceof String) {
    selector = selectors.parse(selector);
  }

  const res = visual.within(selector, radius);
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
Miew.prototype.projected = function (fullAtomName, complexName) {
  const visual = this._getComplexVisual(complexName);
  if (!visual) {
    return false;
  }

  const atom = visual.getComplex().getAtomByFullname(fullAtomName);
  if (atom === null) {
    return false;
  }

  const pos = atom.position.clone();
  // we consider atom position to be affected only by common complex transform
  // ignoring any transformations that may add during editing
  this._gfx.pivot.updateMatrixWorldRecursive();
  this._gfx.camera.updateMatrixWorldRecursive();
  this._gfx.pivot.localToWorld(pos);
  pos.project(this._gfx.camera);

  return {
    x: (pos.x + 1.0) * 0.5 * this._gfx.width,
    y: (1.0 - pos.y) * 0.5 * this._gfx.height,
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
Miew.prototype.dssp = function (complexName) {
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

Miew.prototype.exportCML = function () {
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
    const { root } = self._gfx;
    const mat = extractRotation(root.matrixWorld);
    const v4 = new THREE.Vector4(0, 0, 0, 0);
    const vCenter = new THREE.Vector4(0, 0, 0, 0);
    let xml = null;
    let ap = null;

    // update atoms in cml
    complex.forEachAtom((atom) => {
      if (atom.xmlNodeRef && atom.xmlNodeRef.xmlNode) {
        xml = atom.xmlNodeRef.xmlNode;
        ap = atom.position;
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
    complex.forEachSGroup((sGroup) => {
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

/**
 * Reproduce the RCSB PDB Molecule of the Month style by David S. Goodsell
 *
 * @see http://pdb101.rcsb.org/motm/motm-about
 */
Miew.prototype.motm = function () {
  settings.set({
    fogColorEnable: true,
    fogColor: 0x000000,
    outline: { on: true, threshold: 0.01 },
    bg: { color: 0xffffff },
  });

  this._forEachComplexVisual((visual) => {
    const rep = [];
    const complex = visual.getComplex();
    const palette = palettes.get(settings.now.palette);
    for (let i = 0; i < complex.getChainCount(); i++) {
      const curChainName = complex._chains[i]._name;
      const curChainColor = palette.getChainColor(curChainName);
      rep[i] = {
        selector: `chain ${curChainName}`,
        mode: 'VW',
        colorer: ['CB', { color: curChainColor, factor: 0.9 }],
        material: 'FL',
      };
    }
    visual.resetReps(rep);
  });
};

Miew.prototype.VERSION = (typeof PACKAGE_VERSION !== 'undefined' && PACKAGE_VERSION) || '0.0.0-dev';

// Uncomment this to get debug trace:
// Miew.prototype.debugTracer = new utils.DebugTracer(Miew.prototype);

_.assign(Miew, /** @lends Miew */ {
  VERSION: Miew.prototype.VERSION,

  registeredPlugins: [],

  // export namespaces // TODO: WIP: refactoring external interface
  chem,
  io,
  modes,
  colorers,
  materials,
  palettes,
  options,
  settings,
  utils,
  gfx: {
    Representation,
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
