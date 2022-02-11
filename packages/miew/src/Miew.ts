// eslint-disable-next-line
//@ts-nocheck
import { Spinner } from 'spin.js'
import Stats from './gfx/Stats'
import utils from './utils'
import JobHandle from './utils/JobHandle'
import options from './options'
import settings from './settings'
import chem from './chem'
import Visual from './Visual'
import ComplexVisual from './ComplexVisual'
import Complex from './chem/Complex'
import VolumeVisual from './VolumeVisual'
import io from './io/io'
import modes from './gfx/modes'
import colorers from './gfx/colorers'
import palettes from './gfx/palettes'
import materials from './gfx/materials'
import Representation from './gfx/Representation'
import CSS2DRenderer from './gfx/CSS2DRenderer'
import ObjectControls from './ui/ObjectControls'
import Picker from './ui/Picker'
import Axes from './gfx/Axes'
import gfxutils from './gfx/gfxutils'
import meshutils from './gfx/meshutils'
import FrameInfo from './gfx/FrameInfo'
import meshes from './gfx/meshes/meshes'
import LinesObject from './gfx/objects/LinesObj'
import UberMaterial from './gfx/shaders/UberMaterial'
import OutlineMaterial from './gfx/shaders/OutlineMaterial'
import FXAAMaterial from './gfx/shaders/FXAAMaterial'
import AOMaterial from './gfx/shaders/AOMaterial'
import AOHorBlurMaterial from './gfx/shaders/AOHorBlurMaterial'
import AOVertBlurWithBlendMaterial from './gfx/shaders/AOVertBlurWithBlendMaterial'
import AnaglyphMaterial from './gfx/shaders/AnaglyphMaterial'
import VolumeMaterial from './gfx/shaders/VolumeMaterial'
import ViewInterpolator from './gfx/ViewInterpolator'
import EventDispatcher from './utils/EventDispatcher'
import logger from './utils/logger'
import Cookies from './utils/Cookies'
import capabilities from './gfx/capabilities'
import WebVRPoC from './gfx/vr/WebVRPoC'
import './Miew.scss'
import vertexScreenQuadShader from './gfx/shaders/ScreenQuad.vert'
import fragmentScreenQuadFromDistTex from './gfx/shaders/ScreenQuadFromDistortionTex.frag'
import {
  AmbientLight,
  Box3,
  DepthTexture,
  DirectionalLight,
  FloatType,
  Fog,
  Group,
  Line,
  LinearFilter,
  LineSegments,
  Matrix4,
  Mesh,
  NearestFilter,
  PCFShadowMap,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  Sphere,
  StereoCamera,
  UnsignedShortType,
  Vector2,
  Vector3,
  WebGL1Renderer,
  WebGLRenderTarget,
  Color,
  Euler,
  Vector4,
  Quaternion,
  MathUtils,
  NoBlending,
  RawShaderMaterial,
  OrthographicCamera
} from 'three'
import {
  assign,
  merge,
  isString,
  head,
  defaults,
  isUndefined,
  isNumber,
  get,
  isArray,
  isEmpty
} from 'lodash'

const { selectors, Atom, Residue, Chain, Molecule } = chem

const EDIT_MODE = { COMPLEX: 0, COMPONENT: 1, FRAGMENT: 2 }

const LOADER_NOT_FOUND = 'Could not find suitable loader for this source'
const PARSER_NOT_FOUND = 'Could not find suitable parser for this source'

const { createElement } = utils

function updateFogRange(fog, center, radius) {
  fog.near = center - radius * settings.now.fogNearFactor
  fog.far = center + radius * settings.now.fogFarFactor
}

function removeExtension(fileName) {
  const dot = fileName.lastIndexOf('.')
  if (dot >= 0) {
    fileName = fileName.substr(0, dot)
  }
  return fileName
}

function hasValidResidues(complex) {
  let hasValidRes = false
  complex.forEachComponent((component) => {
    component.forEachResidue((residue) => {
      if (residue._isValid) {
        hasValidRes = true
      }
    })
  })
  return hasValidRes
}

function reportProgress(log, action, percent) {
  const TOTAL_PERCENT = 100
  if (percent !== undefined) {
    log.debug(`${action}... ${Math.floor(percent * TOTAL_PERCENT)}%`)
  } else {
    log.debug(`${action}...`)
  }
}

function chooseFogColor() {
  return settings.now.fogColorEnable
    ? settings.now.fogColor
    : settings.now.bg.color
}

/**
 * Replace viewer container contents with a DOM element.
 * @param {HTMLElement} container - parent container.
 * @param {HTMLElement} element - DOM element to show.
 * @private
 */
function _setContainerContents(container, element) {
  const parent = container
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild)
  }
  parent.appendChild(element)
}

function arezSpritesSupported(context) {
  return context.getExtension('EXT_frag_depth')
}

function isAOSupported(context) {
  return (
    context.getExtension('WEBGL_depth_texture') &&
    context.getExtension('WEBGL_draw_buffers')
  )
}

const rePdbId = /^(?:(pdb|cif|mmtf|ccp4|dsn6):\s*)?(\d[a-z\d]{3})$/i
const rePubchem = /^(?:pc|pubchem):\s*([a-z]+)$/i
const reUrlScheme = /^([a-z][a-z\d\-+.]*):/i

function resolveSourceShortcut(source, opts) {
  if (!isString(source)) {
    return source
  }

  // e.g. "mmtf:1CRN"
  const matchesPdbId = rePdbId.exec(source)
  if (matchesPdbId) {
    let [, format = 'pdb', id] = matchesPdbId

    format = format.toLowerCase()
    id = id.toUpperCase()

    switch (format) {
      case 'pdb':
        source = `https://files.rcsb.org/download/${id}.pdb`
        break
      case 'cif':
        source = `https://files.rcsb.org/download/${id}.cif`
        break
      case 'mmtf':
        source = `https://mmtf.rcsb.org/v1.0/full/${id}`
        break
      case 'ccp4':
        source = `https://www.ebi.ac.uk/pdbe/coordinates/files/${id.toLowerCase()}.ccp4`
        break
      case 'dsn6':
        source = `https://edmaps.rcsb.org/maps/${id.toLowerCase()}_2fofc.dsn6`
        break
      default:
        throw new Error('Unexpected data format shortcut')
    }

    opts.fileType = format
    opts.fileName = `${id}.${format}`
    opts.sourceType = 'url'
    return source
  }

  // e.g. "pc:aspirin"
  const matchesPubchem = rePubchem.exec(source)
  if (matchesPubchem) {
    const compound = matchesPubchem[1].toLowerCase()
    source = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${compound}/JSON?record_type=3d`
    opts.fileType = 'pubchem'
    opts.fileName = `${compound}.json`
    opts.sourceType = 'url'
    return source
  }

  // otherwise is should be an URL
  if (opts.sourceType === 'url' || opts.sourceType === undefined) {
    opts.sourceType = 'url'

    // e.g. "./data/1CRN.pdb"
    if (!reUrlScheme.test(source)) {
      source = utils.resolveURL(source)
    }
  }

  return source
}

function updateBinaryMode(opts) {
  let { binary } = opts

  // detect by format
  if (opts.fileType !== undefined) {
    const TheParser = head(io.parsers.find({ format: opts.fileType }))
    if (TheParser) {
      binary = TheParser.binary || false
    } else {
      throw new Error('Could not find suitable parser for this format')
    }
  }

  // detect by file extension
  if (binary === undefined && opts.fileExt !== undefined) {
    const TheParser = head(io.parsers.find({ ext: opts.fileExt }))
    if (TheParser) {
      binary = TheParser.binary || false
    }
  }

  // temporary workaround for animation
  if (opts.fileExt !== undefined && opts.fileExt.toLowerCase() === '.man') {
    opts.binary = true
    opts.animation = true // who cares?
  }

  // update if detected
  if (binary !== undefined) {
    if (opts.binary !== undefined && opts.binary !== binary) {
      opts.context.logger.warn('Overriding incorrect binary mode')
    }
  }

  opts.binary = binary || false
}

function _fetchData(source, opts, job) {
  return new Promise((resolve) => {
    if (job.shouldCancel()) {
      throw new Error('Operation cancelled')
    }
    job.notify({ type: 'fetching' })

    // allow for source shortcuts
    source = resolveSourceShortcut(source, opts)

    // detect a proper loader
    const TheLoader = head(io.loaders.find({ type: opts.sourceType, source }))
    if (!TheLoader) {
      throw new Error(LOADER_NOT_FOUND)
    }

    // split file name
    const fileName = opts.fileName || TheLoader.extractName(source)
    if (fileName) {
      const [name, fileExt] = utils.splitFileName(fileName)
      defaults(opts, { name, fileExt, fileName })
    }

    // should it be text or binary?
    updateBinaryMode(opts)

    // FIXME: All new settings retrieved from server are applied after the loading is complete. However, we need some
    // flags to alter the loading process itself. Here we apply them in advance. Dirty hack. Kill the server, remove
    // all hacks and everybody's happy.
    let newOptions = get(opts, 'preset.expression')
    if (!isUndefined(newOptions)) {
      newOptions = JSON.parse(newOptions)
      if (newOptions && newOptions.settings) {
        const keys = ['singleUnit']
        for (
          let keyIndex = 0, keyCount = keys.length;
          keyIndex < keyCount;
          ++keyIndex
        ) {
          const key = keys[keyIndex]
          const value = get(newOptions.settings, key)
          if (!isUndefined(value)) {
            settings.set(key, value)
          }
        }
      }
    }

    // create a loader
    const loader = new TheLoader(source, opts)
    loader.context = opts.context
    job.addEventListener('cancel', () => loader.abort())

    loader.addEventListener('progress', (event) => {
      if (event.lengthComputable && event.total > 0) {
        reportProgress(loader.logger, 'Fetching', event.loaded / event.total)
      } else {
        reportProgress(loader.logger, 'Fetching')
      }
    })

    console.time('fetch')
    const promise = loader
      .load()
      .then((data) => {
        console.timeEnd('fetch')
        opts.context.logger.info('Fetching finished')
        job.notify({ type: 'fetchingDone', data })
        return data
      })
      .catch((error) => {
        console.timeEnd('fetch')
        opts.context.logger.debug(error.message)
        if (error.stack) {
          opts.context.logger.debug(error.stack)
        }
        opts.context.logger.error('Fetching failed')
        job.notify({ type: 'fetchingDone', error })
        throw error
      })
    resolve(promise)
  })
}

function _parseData(data, opts, job) {
  if (job.shouldCancel()) {
    return Promise.reject(new Error('Operation cancelled'))
  }

  job.notify({ type: 'parsing' })

  const TheParser = head(
    io.parsers.find({ format: opts.fileType, ext: opts.fileExt, data })
  )
  if (!TheParser) {
    return Promise.reject(new Error('Could not find suitable parser'))
  }

  const parser = new TheParser(data, opts)
  parser.context = opts.context
  job.addEventListener('cancel', () => parser.abort())

  console.time('parse')
  return parser
    .parse()
    .then((dataSet) => {
      console.timeEnd('parse')
      job.notify({ type: 'parsingDone', data: dataSet })
      return dataSet
    })
    .catch((error) => {
      console.timeEnd('parse')
      opts.error = error
      opts.context.logger.debug(error.message)
      if (error.stack) {
        opts.context.logger.debug(error.stack)
      }
      opts.context.logger.error('Parsing failed')
      job.notify({ type: 'parsingDone', error })
      throw error
    })
}

function _includesInCurSelection(atom, selectionBit) {
  return atom.mask & (1 << selectionBit)
}

function _includesInSelector(atom, selector) {
  return selector.selector.includesAtom(atom)
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

export interface MiewOptions {
  container?: HTMLDivElement | null
  settingsCookie?: string
  cookiePath?: string
  load?: string
  settings?: {
    palette?: string
    shadow?: object
    ao?: boolean
    aromatic?: boolean
    autobuild?: boolean
    autoRotation?: number
    autoRotationAxisFixed?: boolean
    axes?: boolean
    colorers?: object
    editing?: boolean
    fbxprec?: number
    fox?: boolean
    fogFarFactor?: number
    fogNearFactor?: number
    fps?: boolean
    fxaa?: boolean
    interpolateViews?: boolean
    maxfps?: number
    modes?: object
    outline?: boolean
    pick?: string
    picking?: boolean
    singleUnit?: boolean
    stereo?: string
    suspendRender?: boolean
    translationSpeed?: number
    transparency?: string
    zooming?: boolean
    zSprite?: boolean
  }
}

export class Miew extends EventDispatcher {
  constructor(opts: MiewOptions) {
    super()
    this._opts = merge(
      {
        settingsCookie: 'settings',
        cookiePath: '/'
      },
      opts
    )
    /** @type {?object} */
    this._gfx = null
    /** @type {ViewInterpolator} */
    this._interpolator = new ViewInterpolator()
    /** @type {HTMLElement} */
    this._container =
      (opts && opts.container) ||
      document.getElementById('miew-container') ||
      head(document.getElementsByClassName('miew-container')) ||
      document.body
    /** @type {HTMLElement} */
    this._containerRoot = this._container

    /** @type {boolean} */
    this._running = false
    /** @type {boolean} */
    this._halting = false
    /** @type {boolean} */
    this._building = false
    /** @type {boolean} */
    this._needRender = true
    /** @type {boolean} */
    this._hotKeysEnabled = true

    /** @type {Settings} */
    this.settings = settings
    const log = logger
    log.console = DEBUG
    log.level = DEBUG ? 'debug' : 'info'
    /**
     * @type {Logger}
     * @example
     * miew.logger.addEventListener('message', function _onLogMessage(evt) {
     *   console.log(evt.message);
     * });
     */
    this.logger = log

    this._cookies = new Cookies(this)
    this.restoreSettings()
    if (opts && opts.settings) {
      this.settings.set(opts.settings)
    }

    /** @type {?Spinner} */
    this._spinner = null
    /** @type {JobHandle[]} */
    this._loading = []
    /** @type {?number}
     * @deprecated until Animation system refactoring
     */
    this._animInterval = null

    /** @type {object} */
    this._visuals = {}
    /** @type {?string} */
    this._curVisualName = null

    /** @type {array} */
    this._objects = []

    /** @type {object} */
    this._sourceWindow = null

    this.reset()

    if (this._repr) {
      log.debug(
        `Selected ${this._repr.mode.name} mode with ${this._repr.colorer.name} colorer.`
      )
    }

    const self = this
    Miew.registeredPlugins.forEach((plugin) => {
      plugin.call(self)
    })

    this._initOnSettingsChanged()
    this.shadowMatrix = new Matrix4()
    this.direction = new Vector3()
    this.OBB = { center: new Vector3(), halfSize: new Vector3() }
    this._bSphereForOneVisual = new Sphere()
    this._bBoxForOneVisual = new Box3()
    this._bBox = new Box3()
    this._invMatrix = new Matrix4()
    this._points = [new Vector3(), new Vector3(), new Vector3(), new Vector3()]
    this._anaglyphMat = new AnaglyphMaterial()
    this._size = new Vector2()
    this._scene = new Scene()
    this._camera = new OrthographicCamera(-1.0, 1.0, 1.0, -1.0, -500, 1000)
    this._material = new RawShaderMaterial({
      uniforms: {
        srcTex: { type: 't', value: null },
        aberration: { type: 'fv3', value: new Vector3(1.0) }
      },
      vertexShader: vertexScreenQuadShader,
      fragmentShader: fragmentScreenQuadFromDistTex,
      transparent: false,
      depthTest: false,
      depthWrite: false
    })
    this._geo = gfxutils.buildDistorionMesh(
      10,
      10,
      settings.now.debug.stereoBarrel
    )
    this._outlineMaterial = new OutlineMaterial({ depth: true })
    this.pars = {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      format: RGBAFormat
    }
    this.VERSION =
      (typeof PACKAGE_VERSION !== 'undefined' && PACKAGE_VERSION) || '0.0.0-dev'
    // Uncomment this to get debug trace:
    // this.debugTracer = new utils.DebugTracer(Miew);
  }

  getMaxRepresentationCount() {
    return ComplexVisual.NUM_REPRESENTATION_BITS
  }

  /**
   * Update Shadow Camera target position and frustum.
   * @private
   */
  _updateShadowCamera() {
    this._gfx.scene.updateMatrixWorld()
    for (let i = 0; i < this._gfx.scene.children.length; i++) {
      if (this._gfx.scene.children[i].type === 'DirectionalLight') {
        const light = this._gfx.scene.children[i]
        this.shadowMatrix.copy(light.shadow.camera.matrixWorldInverse)
        this.getOBB(this.shadowMatrix, this.OBB)

        this.direction.subVectors(light.target.position, light.position)
        light.position.subVectors(this.OBB.center, this.direction)
        light.target.position.copy(this.OBB.center)

        light.shadow.bias = 0.09
        light.shadow.camera.bottom = -this.OBB.halfSize.y
        light.shadow.camera.top = this.OBB.halfSize.y
        light.shadow.camera.right = this.OBB.halfSize.x
        light.shadow.camera.left = -this.OBB.halfSize.x
        light.shadow.camera.near = this.direction.length() - this.OBB.halfSize.z
        light.shadow.camera.far = this.direction.length() + this.OBB.halfSize.z

        light.shadow.camera.updateProjectionMatrix()
      }
    }
  }

  /**
   * Initialize the viewer.
   * @returns {boolean} true on success.
   * @throws Forwards exception raised during initialization.
   * @see Miew#term
   */
  init() {
    const container = this._container
    const elem = utils.createElement('div', { class: 'miew-canvas' })
    _setContainerContents(container, elem)
    this._container = elem

    const frag = document.createDocumentFragment()
    frag.appendChild(
      (this._msgMode = createElement(
        'div',
        { class: 'mode-message overlay' },
        createElement('p', {}, 'COMPONENT EDIT MODE')
      ))
    )
    frag.appendChild(
      (this._msgAtomInfo = createElement(
        'div',
        { class: 'atom-info overlay' },
        createElement('p', {}, '')
      ))
    )
    container.appendChild(frag)

    if (this._gfx !== null) {
      // block double init
      return true
    }

    const self = this
    this._showMessage('Viewer is being initialized...')
    try {
      this._initGfx()

      this._initListeners()
      this._spinner = new Spinner({
        lines: 13,
        length: 28,
        width: 14,
        radius: 42,
        color: '#fff',
        zIndex: 700
      })

      window.top.addEventListener('keydown', (event) => {
        self._onKeyDown(event)
      })

      window.top.addEventListener('keyup', (event) => {
        self._onKeyUp(event)
      })

      this._objectControls = new ObjectControls(
        this._gfx.root,
        this._gfx.pivot,
        this._gfx.camera,
        this._gfx.renderer.domElement,
        () => self._getAltObj()
      )
      this._objectControls.addEventListener('change', (e) => {
        if (settings.now.shadow.on) {
          self._updateShadowCamera()
        }
        // route rotate, zoom, translate and translatePivot events to the external API
        switch (e.action) {
          case 'rotate':
            self.dispatchEvent({ type: 'rotate', quaternion: e.quaternion })
            break
          case 'zoom':
            self.dispatchEvent({ type: 'zoom', factor: e.factor })
            break
          default:
            self.dispatchEvent({ type: e.action })
        }
        self.dispatchEvent({ type: 'transform' })
        self._needRender = true
      })

      const gfx = this._gfx
      this._picker = new Picker(gfx.root, gfx.camera, gfx.renderer.domElement)
      this._picker.addEventListener('newpick', (event) => {
        self._onPick(event)
      })
      this._picker.addEventListener('dblclick', (event) => {
        self.center(event)
      })
    } catch (error) {
      if (
        error.name === 'TypeError' &&
        error.message === "Cannot read property 'getExtension' of null"
      ) {
        this._showMessage('Could not create WebGL context.')
      } else if (error.message.search(/webgl/i) > 1) {
        this._showMessage(error.message)
      } else {
        this._showMessage('Viewer initialization failed.')
        throw error
      }
      return false
    }

    // automatically load default file
    const file = this._opts && this._opts.load
    if (file) {
      const type = this._opts && this._opts.type
      this.load(file, { fileType: type, keepRepsInfo: true })
    }

    return true
  }

  /**
   * Terminate the viewer completely.
   * @see Miew#init
   */
  term() {
    this._showMessage('Viewer has been terminated.')
    this._loading.forEach((job) => {
      job.cancel()
    })
    this._loading.length = 0
    this.halt()
    this._gfx = null
  }

  /**
   * Display message inside the viewer container, hiding WebGL canvas.
   * @param {string} msg - Message to show.
   * @private
   */
  _showMessage(msg) {
    const element = document.createElement('div')
    element.setAttribute('class', 'miew-message')
    element
      .appendChild(document.createElement('p'))
      .appendChild(document.createTextNode(msg))
    _setContainerContents(this._container, element)
  }

  /**
   * Display WebGL canvas inside the viewer container, hiding any message shown.
   * @private
   */
  _showCanvas() {
    _setContainerContents(this._container, this._gfx.renderer.domElement)
  }

  _requestAnimationFrame(callback) {
    const { xr } = this._gfx.renderer
    if (xr && xr.enabled) {
      this._gfx.renderer.setAnimationLoop(callback)
      return
    }
    requestAnimationFrame(callback)
  }

  /**
   * Initialize WebGL and set 3D scene up.
   * @private
   */
  _initGfx() {
    const gfx = {
      width: this._container.clientWidth,
      height: this._container.clientHeight
    }

    const webGLOptions = {
      preserveDrawingBuffer: true,
      alpha: true,
      premultipliedAlpha: false
    }
    if (settings.now.antialias) {
      webGLOptions.antialias = true
    }

    gfx.renderer2d = new CSS2DRenderer()

    gfx.renderer = new WebGL1Renderer(webGLOptions)
    gfx.renderer.shadowMap.enabled = settings.now.shadow.on
    gfx.renderer.shadowMap.autoUpdate = false
    gfx.renderer.shadowMap.type = PCFShadowMap
    capabilities.init(gfx.renderer)

    // z-sprites and ambient occlusion possibility
    if (!arezSpritesSupported(gfx.renderer.getContext())) {
      settings.set('zSprites', false)
    }
    if (!isAOSupported(gfx.renderer.getContext())) {
      settings.set('ao', false)
    }

    gfx.renderer.autoClear = false
    gfx.renderer.setPixelRatio(window.devicePixelRatio)
    gfx.renderer.setSize(gfx.width, gfx.height)
    gfx.renderer.setClearColor(
      settings.now.bg.color,
      Number(!settings.now.bg.transparent)
    )
    gfx.renderer.clearColor()

    gfx.renderer2d.setSize(gfx.width, gfx.height)

    gfx.camera = new PerspectiveCamera(
      settings.now.camFov,
      gfx.width / gfx.height,
      settings.now.camNear,
      settings.now.camFar
    )
    gfx.camera.setMinimalFov(settings.now.camFov)
    gfx.camera.position.z = settings.now.camDistance
    gfx.camera.updateProjectionMatrix()
    gfx.camera.layers.set(gfxutils.LAYERS.DEFAULT)
    gfx.camera.layers.enable(gfxutils.LAYERS.VOLUME)
    gfx.camera.layers.enable(gfxutils.LAYERS.VOLUME_BFPLANE)

    gfx.stereoCam = new StereoCamera()

    gfx.scene = new Scene()

    const color = chooseFogColor()
    gfx.scene.fog = new Fog(color, settings.now.camNear, settings.now.camFar)

    gfx.root = new gfxutils.RCGroup()
    gfx.scene.add(gfx.root)

    gfx.pivot = new gfxutils.RCGroup()
    gfx.root.add(gfx.pivot)

    gfx.selectionScene = new Scene()
    gfx.selectionRoot = new Group()
    gfx.selectionRoot.matrixAutoUpdate = false
    gfx.selectionScene.add(gfx.selectionRoot)

    gfx.selectionPivot = new Group()
    gfx.selectionPivot.matrixAutoUpdate = false
    gfx.selectionRoot.add(gfx.selectionPivot)

    const light12 = new DirectionalLight(0xffffff, 0.45)
    light12.position.set(0, 0.414, 1)
    light12.layers.enable(gfxutils.LAYERS.TRANSPARENT)
    light12.castShadow = true
    light12.shadow.bias = 0.09
    light12.shadow.radius = settings.now.shadow.radius
    light12.shadow.camera.layers.set(gfxutils.LAYERS.SHADOWMAP)

    const pixelRatio = gfx.renderer.getPixelRatio()
    const shadowMapSize = Math.max(gfx.width, gfx.height) * pixelRatio
    light12.shadow.mapSize.width = shadowMapSize
    light12.shadow.mapSize.height = shadowMapSize
    light12.target.position.set(0.0, 0.0, 0.0)
    gfx.scene.add(light12)
    gfx.scene.add(light12.target)

    const light3 = new AmbientLight(0x666666)
    light3.layers.enable(gfxutils.LAYERS.TRANSPARENT)
    gfx.scene.add(light3)

    // add axes
    gfx.axes = new Axes(gfx.root, gfx.camera)
    const deviceWidth = gfx.width * pixelRatio
    const deviceHeight = gfx.height * pixelRatio

    gfx.offscreenBuf = new WebGLRenderTarget(deviceWidth, deviceHeight, {
      minFilter: LinearFilter,
      magFilter: NearestFilter,
      format: RGBAFormat,
      depthBuffer: true
    })

    if (gfx.renderer.getContext().getExtension('WEBGL_depth_texture')) {
      gfx.offscreenBuf.depthTexture = new DepthTexture()
      gfx.offscreenBuf.depthTexture.type = UnsignedShortType
    }

    gfx.offscreenBuf2 = new WebGLRenderTarget(deviceWidth, deviceHeight, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthBuffer: false
    })

    gfx.offscreenBuf3 = new WebGLRenderTarget(deviceWidth, deviceHeight, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthBuffer: false
    })

    gfx.offscreenBuf4 = new WebGLRenderTarget(deviceWidth, deviceHeight, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthBuffer: false
    })

    gfx.volBFTex = gfx.offscreenBuf3
    gfx.volFFTex = gfx.offscreenBuf4
    gfx.volWFFTex = gfx.offscreenBuf

    // use float textures for volume rendering if possible
    if (gfx.renderer.getContext().getExtension('OES_texture_float')) {
      gfx.offscreenBuf5 = new WebGLRenderTarget(deviceWidth, deviceHeight, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: FloatType,
        depthBuffer: false
      })

      gfx.offscreenBuf6 = new WebGLRenderTarget(deviceWidth, deviceHeight, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: FloatType,
        depthBuffer: false
      })

      gfx.offscreenBuf7 = new WebGLRenderTarget(deviceWidth, deviceHeight, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        format: RGBAFormat,
        type: FloatType,
        depthBuffer: true
      })

      gfx.volBFTex = gfx.offscreenBuf5
      gfx.volFFTex = gfx.offscreenBuf6
      gfx.volWFFTex = gfx.offscreenBuf7
    } else {
      this.logger.warn("Device doesn't support OES_texture_float extension")
    }

    gfx.stereoBufL = new WebGLRenderTarget(deviceWidth, deviceHeight, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthBuffer: false
    })

    gfx.stereoBufR = new WebGLRenderTarget(deviceWidth, deviceHeight, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
      depthBuffer: false
    })

    this._gfx = gfx
    this._showCanvas()

    this._embedWebXR(settings.now.stereo === 'WEBVR')

    this._container.appendChild(gfx.renderer2d.getElement())

    // add FPS counter
    const stats = new Stats()
    stats.domElement.style.position = 'absolute'
    stats.domElement.style.right = '0'
    stats.domElement.style.bottom = '0'
    this._container.appendChild(stats.domElement)
    this._fps = stats
    this._fps.show(settings.now.fps)
  }

  /**
   * Setup event listeners.
   * @private
   */
  _initListeners() {
    const self = this
    window.addEventListener('resize', () => {
      self._onResize()
    })
  }

  /**
   * Try to add numbers to the base name to make it unique among visuals
   * @private
   */
  _makeUniqueVisualName(baseName) {
    if (!baseName) {
      return Math.random().toString()
    }

    let name = baseName
    let suffix = 1
    while (this._visuals.hasOwnProperty(name)) {
      name = `${baseName} (${suffix.toString()})`
      suffix++
    }

    return name
  }

  /**
   * Add visual to the viewer
   * @private
   */
  _addVisual(visual) {
    if (!visual) {
      return null
    }

    // change visual name in order to make it unique
    const name = this._makeUniqueVisualName(visual.name)
    visual.name = name

    this._visuals[name] = visual
    this._gfx.pivot.add(visual)
    if (visual.getSelectionGeo) {
      this._gfx.selectionPivot.add(visual.getSelectionGeo())
    }

    return name
  }

  /**
   * Remove visual from the viewer
   * @private
   */
  _removeVisual(visual) {
    let name = ''
    let obj = null
    if (visual instanceof Visual) {
      ;({ name } = visual)
      obj = visual
    } else if (typeof visual === 'string') {
      name = visual
      obj = this._visuals[name]
    }

    if (
      !obj ||
      !this._visuals.hasOwnProperty(name) ||
      this._visuals[name] !== obj
    ) {
      return
    }

    if (name === this._curVisualName) {
      this._curVisualName = undefined
    }

    delete this._visuals[name]
    obj.release() // removes nodes from scene

    this._needRender = true
  }

  /**
   * Call specified function for each Visual
   * @private
   */
  _forEachVisual(callback) {
    for (const name in this._visuals) {
      if (this._visuals.hasOwnProperty(name)) {
        callback(this._visuals[name])
      }
    }
  }

  /**
   * Release (destroy) all visuals in the scene
   * @private
   */
  _releaseAllVisuals() {
    if (!this._gfx || !this._gfx.pivot) {
      return
    }

    for (const name in this._visuals) {
      if (this._visuals.hasOwnProperty(name)) {
        this._visuals[name].release()
      }
    }

    this._visuals = {}
  }

  /**
   * Call specified function for each ComplexVisual
   * @private
   */
  _forEachComplexVisual(callback) {
    if (!this._gfx || !this._gfx.pivot) {
      return
    }

    for (const name in this._visuals) {
      if (
        this._visuals.hasOwnProperty(name) &&
        this._visuals[name] instanceof ComplexVisual
      ) {
        callback(this._visuals[name])
      }
    }
  }

  /**
   * Returns ComplexVisual with specified name, or current (if not found), or any, or null
   * @private
   */
  _getComplexVisual(name) {
    name = name || this._curVisualName
    let any = null
    let named = null
    this._forEachComplexVisual((visual) => {
      any = visual
      if (visual.name === name) {
        named = visual
      }
    })
    return named || any
  }

  /**
   * Returns first found VolumeVisual (no more than one should be present actually)
   * @private
   */
  _getVolumeVisual() {
    let any = null
    this._forEachVisual((visual) => {
      if (visual instanceof VolumeVisual) {
        any = visual
      }
    })
    return any
  }

  /**
   * Returns ComplexVisual corresponding to specified complex
   * @private
   */
  _getVisualForComplex(complex) {
    if (!complex) {
      return null
    }

    let found = null
    this._forEachComplexVisual((visual) => {
      if (visual.getComplex() === complex) {
        found = visual
      }
    })
    return found
  }

  /*
   * Get a list of names of visuals currently shown by the viewer
   */
  getVisuals() {
    return Object.keys(this._visuals)
  }

  /*
   * Get complex visuals count
   */
  getComplexVisualsCount() {
    let count = 0
    this._forEachComplexVisual(() => count++)
    return count
  }

  /*
   * Get current visual
   */
  getCurrentVisual() {
    return this._curVisualName
  }

  /*
   * Set current visual.
   * All further operations will be performed on this visual (complex) if not stated otherwise.
   */
  setCurrentVisual(name) {
    if (!this._visuals[name]) {
      return
    }

    this._curVisualName = name
  }

  /**
   * Run the viewer, start processing update/render frames periodically.
   * Has no effect if already running.
   * @see Miew#halt
   */
  run() {
    if (!this._running) {
      this._running = true
      if (this._halting) {
        this._halting = false
        return
      }

      this._objectControls.enable(true)
      this._interpolator.resume()

      this._requestAnimationFrame(() => this._onTick())
    }
  }

  /**
   * Request the viewer to stop.
   * Will be processed during the next frame.
   * @see Miew#run
   */
  halt() {
    if (this._running) {
      this._discardComponentEdit()
      this._discardFragmentEdit()
      this._objectControls.enable(false)
      this._interpolator.pause()
      this._halting = true
    }
  }

  /**
   * Request the viewer to start / stop responsing
   * on hot keys.
   * @param enabled - start (true) or stop (false) response on hot keys.
   */
  enableHotKeys(enabled) {
    this._hotKeysEnabled = enabled
    this._objectControls.enableHotkeys(enabled)
  }

  /**
   * Callback which processes window resize.
   * @private
   */
  _onResize() {
    this._needRender = true

    const gfx = this._gfx
    gfx.width = this._container.clientWidth
    gfx.height = this._container.clientHeight

    gfx.camera.aspect = gfx.width / gfx.height
    gfx.camera.setMinimalFov(settings.now.camFov)
    gfx.camera.updateProjectionMatrix()

    gfx.renderer.setSize(gfx.width, gfx.height)
    gfx.renderer2d.setSize(gfx.width, gfx.height)

    this.dispatchEvent({ type: 'resize' })
  }

  _resizeOffscreenBuffers(width, height, stereo) {
    const gfx = this._gfx
    stereo = stereo || 'NONE'
    const isAnaglyph = stereo === 'NONE' || stereo === 'ANAGLYPH'
    const multi = isAnaglyph ? 1 : 0.5
    gfx.offscreenBuf.setSize(multi * width, height)
    gfx.offscreenBuf2.setSize(multi * width, height)
    gfx.offscreenBuf3.setSize(multi * width, height)
    gfx.offscreenBuf4.setSize(multi * width, height)
    if (gfx.offscreenBuf5) {
      gfx.offscreenBuf5.setSize(multi * width, height)
    }
    if (gfx.offscreenBuf6) {
      gfx.offscreenBuf6.setSize(multi * width, height)
    }
    if (gfx.offscreenBuf7) {
      gfx.offscreenBuf7.setSize(multi * width, height)
    }
    if (isAnaglyph) {
      gfx.stereoBufL.setSize(width, height)
      gfx.stereoBufR.setSize(width, height)
    }
  }

  /**
   * Callback which processes update/render frames.
   * @private
   */
  _onTick() {
    if (this._halting) {
      this._running = false
      this._halting = false
      return
    }

    this._fps.update()

    this._requestAnimationFrame(() => this._onTick())

    this._onUpdate()
    if (this._needRender) {
      this._onRender()
      this._needRender =
        !settings.now.suspendRender || settings.now.stereo === 'WEBVR'
    }
  }

  _getBSphereRadius() {
    // calculate radius that would include all visuals
    let radius = 0
    this._forEachVisual((visual) => {
      radius = Math.max(radius, visual.getBoundaries().boundingSphere.radius)
    })
    return radius * this._objectControls.getScale()
  }

  /**
   * Calculate bounding box that would include all visuals and being axis aligned in world defined by
   * transformation matrix: matrix
   * @param {Matrix4} matrix - transformation matrix.
   * @param {object}  OBB           - calculating bounding box.
   * @param {Vector3} OBB.center    - OBB center.
   * @param {Vector3} OBB.halfSize  - half magnitude of OBB sizes.
   */
  getOBB(matrix, OBB) {
    this._bBox.makeEmpty()

    this._forEachVisual((visual) => {
      this._bSphereForOneVisual.copy(visual.getBoundaries().boundingSphere)
      this._bSphereForOneVisual
        .applyMatrix4(visual.matrixWorld)
        .applyMatrix4(matrix)
      this._bSphereForOneVisual.getBoundingBox(this._bBoxForOneVisual)
      this._bBox.union(this._bBoxForOneVisual)
    })
    this._bBox.getCenter(OBB.center)

    this._invMatrix.copy(matrix).invert()
    OBB.center.applyMatrix4(this._invMatrix)

    const { min } = this._bBox
    const { max } = this._bBox
    this._points[0].set(min.x, min.y, min.z) // 000
    this._points[1].set(max.x, min.y, min.z) // 100
    this._points[2].set(min.x, max.y, min.z) // 010
    this._points[3].set(min.x, min.y, max.z) // 001
    for (let i = 0, l = this._points.length; i < l; i++) {
      this._points[i].applyMatrix4(this._invMatrix)
    }

    OBB.halfSize
      .set(
        Math.abs(this._points[0].x - this._points[1].x),
        Math.abs(this._points[0].y - this._points[2].y),
        Math.abs(this._points[0].z - this._points[3].z)
      )
      .multiplyScalar(0.5)
  }

  _updateFog() {
    const gfx = this._gfx

    if (settings.now.fog) {
      if (typeof gfx.scene.fog === 'undefined' || gfx.scene.fog === null) {
        const color = chooseFogColor()
        gfx.scene.fog = new Fog(color)
        this._setUberMaterialValues({ fog: settings.now.fog })
      }
      updateFogRange(
        gfx.scene.fog,
        gfx.camera.position.z,
        this._getBSphereRadius()
      )
    } else if (gfx.scene.fog) {
      gfx.scene.fog = undefined
      this._setUberMaterialValues({ fog: settings.now.fog })
    }
  }

  _onUpdate() {
    this._objectControls.update()

    this._forEachComplexVisual((visual) => {
      visual.getComplex().update()
    })

    if (
      settings.now.autobuild &&
      !this._loading.length &&
      !this._building &&
      this._needRebuild()
    ) {
      this.rebuild()
    }

    if (!this._loading.length && !this._building && !this._needRebuild()) {
      this._updateView()
    }

    this._updateFog()

    if (this._gfx.renderer.xr.enabled) {
      this.webVR.updateMoleculeScale()
    }
  }

  _onRender() {
    const gfx = this._gfx

    // update all matrices
    gfx.scene.updateMatrixWorld()
    gfx.camera.updateMatrixWorld()

    this._clipPlaneUpdateValue(this._getBSphereRadius())
    this._fogFarUpdateValue()

    gfx.renderer.setRenderTarget(null)
    gfx.renderer.clear()

    this._renderFrame(settings.now.stereo)
  }

  _renderFrame(stereo) {
    const gfx = this._gfx
    const { renderer } = gfx

    renderer.getSize(this._size)

    if (stereo !== 'NONE') {
      gfx.camera.focus = gfx.camera.position.z // set focus to the center of the object
      gfx.stereoCam.aspect = 1.0

      // in anaglyph mode we render full-size image for each eye
      // while in other stereo modes only half-size (two images on the screen)
      if (stereo === 'ANAGLYPH') {
        gfx.stereoCam.update(gfx.camera)
      } else {
        gfx.stereoCam.updateHalfSized(gfx.camera, settings.now.camFov)
      }
    }

    // resize offscreen buffers to match the target
    const pixelRatio = gfx.renderer.getPixelRatio()
    this._resizeOffscreenBuffers(
      this._size.width * pixelRatio,
      this._size.height * pixelRatio,
      stereo
    )

    this._renderShadowMap()

    switch (stereo) {
      case 'WEBVR':
      case 'NONE':
        this._renderScene(gfx.camera, false)
        break
      case 'SIMPLE':
      case 'DISTORTED':
        renderer.setScissorTest(true)

        renderer.setScissor(0, 0, this._size.width / 2, this._size.height)
        renderer.setViewport(0, 0, this._size.width / 2, this._size.height)
        this._renderScene(this._gfx.stereoCam.cameraL, stereo === 'DISTORTED')

        renderer.setScissor(
          this._size.width / 2,
          0,
          this._size.width / 2,
          this._size.height
        )
        renderer.setViewport(
          this._size.width / 2,
          0,
          this._size.width / 2,
          this._size.height
        )
        this._renderScene(this._gfx.stereoCam.cameraR, stereo === 'DISTORTED')

        renderer.setScissorTest(false)
        break
      case 'ANAGLYPH':
        this._renderScene(this._gfx.stereoCam.cameraL, false, gfx.stereoBufL)
        this._renderScene(this._gfx.stereoCam.cameraR, false, gfx.stereoBufR)
        renderer.setRenderTarget(null)
        this._anaglyphMat.uniforms.srcL.value = gfx.stereoBufL.texture
        this._anaglyphMat.uniforms.srcR.value = gfx.stereoBufR.texture
        gfx.renderer.renderScreenQuad(this._anaglyphMat)
        break
      default:
    }

    gfx.renderer2d.render(gfx.scene, gfx.camera)

    if (settings.now.axes && gfx.axes && !gfx.renderer.xr.enabled) {
      gfx.axes.render(renderer)
    }
  }

  _onBgColorChanged() {
    const gfx = this._gfx
    const color = chooseFogColor()
    if (gfx) {
      if (gfx.scene.fog) {
        gfx.scene.fog.color.set(color)
      }
      gfx.renderer.setClearColor(
        settings.now.bg.color,
        Number(!settings.now.bg.transparent)
      )
    }
    this._needRender = true
  }

  _onFogColorChanged() {
    const gfx = this._gfx
    const color = chooseFogColor()
    if (gfx && gfx.scene.fog) {
      gfx.scene.fog.color.set(color)
    }
    this._needRender = true
  }

  _setUberMaterialValues(values) {
    this._gfx.root.traverse((obj) => {
      if (
        (obj instanceof Mesh ||
          obj instanceof LineSegments ||
          obj instanceof Line) &&
        obj.material instanceof UberMaterial
      ) {
        obj.material.setValues(values)
        obj.material.needsUpdate = true
      }
    })
  }

  _enableMRT(on, renderBuffer, textureBuffer) {
    const gfx = this._gfx
    const gl = gfx.renderer.getContext()
    const ext = gl.getExtension('WEBGL_draw_buffers')
    const { properties } = gfx.renderer

    if (!on) {
      ext.drawBuffersWEBGL([gl.COLOR_ATTACHMENT0, null])
      return
    }

    // take extra texture from Texture Buffer
    gfx.renderer.setRenderTarget(textureBuffer)
    const tx8 = properties.get(textureBuffer.texture).__webglTexture
    gl.bindTexture(gl.TEXTURE_2D, tx8)

    // take texture and framebuffer from renderbuffer
    gfx.renderer.setRenderTarget(renderBuffer)
    const fb = properties.get(renderBuffer).__webglFramebuffer
    const tx = properties.get(renderBuffer.texture).__webglTexture

    // set framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    fb.width = renderBuffer.width
    fb.height = renderBuffer.height
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      tx,
      0
    )
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      ext.COLOR_ATTACHMENT1_WEBGL,
      gl.TEXTURE_2D,
      tx8,
      0
    )

    // mapping textures
    ext.drawBuffersWEBGL([gl.COLOR_ATTACHMENT0, ext.COLOR_ATTACHMENT1_WEBGL])
  }

  _renderScene(camera, distortion, target) {
    distortion = distortion || false
    target = target || null

    const gfx = this._gfx

    // render to offscreen buffer
    gfx.renderer.setClearColor(
      settings.now.bg.color,
      Number(!settings.now.bg.transparent)
    )
    gfx.renderer.setRenderTarget(target)
    gfx.renderer.clear()
    if (gfx.renderer.xr.enabled) {
      gfx.renderer.render(gfx.scene, camera)
      return
    }

    // clean buffer for normals texture
    gfx.renderer.setClearColor(0x000000, 0.0)
    gfx.renderer.setRenderTarget(gfx.offscreenBuf4)
    gfx.renderer.clearColor()

    gfx.renderer.setClearColor(
      settings.now.bg.color,
      Number(!settings.now.bg.transparent)
    )
    gfx.renderer.setRenderTarget(gfx.offscreenBuf)
    gfx.renderer.clear()

    const bHaveComplexes = this._getComplexVisual() !== null
    const volumeVisual = this._getVolumeVisual()
    const ssao = bHaveComplexes && settings.now.ao

    if (ssao) {
      this._enableMRT(true, gfx.offscreenBuf, gfx.offscreenBuf4)
    }

    if (settings.now.transparency === 'prepass') {
      this._renderWithPrepassTransparency(camera, gfx.offscreenBuf)
    } else if (settings.now.transparency === 'standard') {
      gfx.renderer.setRenderTarget(gfx.offscreenBuf)
      gfx.renderer.render(gfx.scene, camera)
    }

    if (ssao) {
      this._enableMRT(false, null, null)
    }

    // when fxaa we should get resulting image in temp off-screen buff2 for further postprocessing with fxaa filter
    // otherwise we render to canvas
    const outline = bHaveComplexes && settings.now.outline.on
    const fxaa = bHaveComplexes && settings.now.fxaa
    const volume =
      volumeVisual !== null && volumeVisual.getMesh().material != null
    let dstBuffer =
      ssao || outline || volume || fxaa || distortion
        ? gfx.offscreenBuf2
        : target
    let srcBuffer = gfx.offscreenBuf

    if (ssao) {
      this._performAO(
        srcBuffer,
        gfx.offscreenBuf4,
        gfx.offscreenBuf.depthTexture,
        dstBuffer,
        gfx.offscreenBuf3,
        gfx.offscreenBuf2
      )
      if (!fxaa && !distortion && !volume && !outline) {
        srcBuffer = dstBuffer
        dstBuffer = target
        gfx.renderer.setRenderTarget(dstBuffer)
        gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 1.0)
      }
    } else {
      // just copy color buffer to dst buffer
      gfx.renderer.setRenderTarget(dstBuffer)
      gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 1.0)
    }

    // outline
    if (outline) {
      srcBuffer = dstBuffer
      dstBuffer = volume || fxaa || distortion ? gfx.offscreenBuf3 : target
      if (srcBuffer != null) {
        this._renderOutline(camera, gfx.offscreenBuf, srcBuffer, dstBuffer)
      }
    }

    // render selected part with outline material
    this._renderSelection(camera, gfx.offscreenBuf, dstBuffer)

    if (volume) {
      // copy current picture to the buffer that retains depth-data of the original molecule render
      // so that volume renderer could use depth-test
      gfx.renderer.setRenderTarget(gfx.offscreenBuf)
      gfx.renderer.renderScreenQuadFromTex(dstBuffer.texture, 1.0)
      dstBuffer = gfx.offscreenBuf
      this._renderVolume(
        volumeVisual,
        camera,
        dstBuffer,
        gfx.volBFTex,
        gfx.volFFTex,
        gfx.volWFFTex
      )

      // if this is the last stage -- copy image to target
      if (!fxaa && !distortion) {
        gfx.renderer.setRenderTarget(target)
        gfx.renderer.renderScreenQuadFromTex(dstBuffer.texture, 1.0)
      }
    }

    srcBuffer = dstBuffer

    if (fxaa) {
      dstBuffer = distortion ? gfx.offscreenBuf4 : target
      this._performFXAA(srcBuffer, dstBuffer)
      srcBuffer = dstBuffer
    }

    if (distortion) {
      dstBuffer = target
      this._performDistortion(srcBuffer, dstBuffer, true)
    }
  }

  _performDistortion(srcBuffer, targetBuffer, mesh) {
    this._scene.add(new meshes.Mesh(this._geo, this._material))
    this._gfx.renderer.setRenderTarget(targetBuffer)
    this._gfx.renderer.clear()

    if (mesh) {
      this._material.uniforms.srcTex.value = srcBuffer.texture
      this._material.uniforms.aberration.value.set(0.995, 1.0, 1.01)
      this._gfx.renderer.render(this._scene, this._camera)
    } else {
      this._gfx.renderer.renderScreenQuadFromTexWithDistortion(
        srcBuffer,
        settings.now.debug.stereoBarrel
      )
    }
  }

  _renderOutline(camera, srcDepthBuffer, srcColorBuffer, targetBuffer) {
    const self = this
    const gfx = self._gfx

    // apply Sobel filter -- draw outline
    this._outlineMaterial.uniforms.srcTex.value = srcColorBuffer.texture
    this._outlineMaterial.uniforms.srcDepthTex.value =
      srcDepthBuffer.depthTexture
    this._outlineMaterial.uniforms.srcTexSize.value.set(
      srcDepthBuffer.width,
      srcDepthBuffer.height
    )
    this._outlineMaterial.uniforms.color.value = new Color(
      settings.now.outline.color
    )
    this._outlineMaterial.uniforms.threshold.value =
      settings.now.outline.threshold
    this._outlineMaterial.uniforms.thickness.value = new Vector2(
      settings.now.outline.thickness,
      settings.now.outline.thickness
    )

    gfx.renderer.setRenderTarget(targetBuffer)
    gfx.renderer.renderScreenQuad(this._outlineMaterial)
  }

  _renderShadowMap() {
    if (!settings.now.shadow.on) {
      return
    }

    const gfx = this._gfx
    const currentRenderTarget = gfx.renderer.getRenderTarget()
    const activeCubeFace = gfx.renderer.getActiveCubeFace()
    const activeMipmapLevel = gfx.renderer.getActiveMipmapLevel()

    const _state = gfx.renderer.state

    // Set GL state for depth map.
    _state.setBlending(NoBlending)
    _state.buffers.color.setClear(1, 1, 1, 1)
    _state.buffers.depth.setTest(true)
    _state.setScissorTest(false)

    for (let i = 0; i < gfx.scene.children.length; i++) {
      if (gfx.scene.children[i].type === 'DirectionalLight') {
        const light = gfx.scene.children[i]

        if (light.shadow.map == null) {
          light.shadow.map = new WebGLRenderTarget(
            light.shadow.mapSize.width,
            light.shadow.mapSize.height,
            pars
          )
          light.shadow.camera.updateProjectionMatrix()
        }
        light.shadow.updateMatrices(light)

        gfx.renderer.setRenderTarget(light.shadow.map)
        gfx.renderer.clear()

        gfx.renderer.render(gfx.scene, light.shadow.camera)
      }
    }
    gfx.renderer.setRenderTarget(
      currentRenderTarget,
      activeCubeFace,
      activeMipmapLevel
    )
  }

  /**
   * Check if there is selection which must be rendered or not.
   * @private
   * @returns {boolean} true on existing selection to render
   */
  _hasSelectionToRender() {
    const selPivot = this._gfx.selectionPivot

    for (let i = 0; i < selPivot.children.length; i++) {
      const selPivotChild = selPivot.children[i]
      if (selPivotChild.children.length > 0) {
        return true
      }
    }
    return false
  }

  _renderSelection(camera, srcBuffer, targetBuffer) {
    const _outlineMaterial = new OutlineMaterial()
    const self = this
    const gfx = self._gfx

    // clear offscreen buffer (leave z-buffer intact)
    gfx.renderer.setClearColor('black', 0)

    // render selection to offscreen buffer
    gfx.renderer.setRenderTarget(srcBuffer)
    gfx.renderer.clear(true, false, false)
    if (self._hasSelectionToRender()) {
      gfx.selectionRoot.matrix = gfx.root.matrix
      gfx.selectionPivot.matrix = gfx.pivot.matrix
      gfx.renderer.render(gfx.selectionScene, camera)
    } else {
      // just render something to force "target clear" operation to finish
      gfx.renderer.renderDummyQuad()
    }

    // overlay to screen
    gfx.renderer.setRenderTarget(targetBuffer)
    gfx.renderer.renderScreenQuadFromTex(srcBuffer.texture, 0.6)

    // apply Sobel filter -- draw outline
    _outlineMaterial.uniforms.srcTex.value = srcBuffer.texture
    _outlineMaterial.uniforms.srcTexSize.value.set(
      srcBuffer.width,
      srcBuffer.height
    )
    gfx.renderer.renderScreenQuad(_outlineMaterial)
  }

  _checkVolumeRenderingSupport(renderTarget) {
    if (!renderTarget) {
      return false
    }
    const gfx = this._gfx
    const oldRT = gfx.renderer.getRenderTarget()

    gfx.renderer.setRenderTarget(renderTarget)
    const context = gfx.renderer.getContext()
    const result = context.checkFramebufferStatus(context.FRAMEBUFFER)
    gfx.renderer.setRenderTarget(oldRT)
    if (result !== context.FRAMEBUFFER_COMPLETE) {
      // floatFrameBufferWarning = ;
      this.logger.warn("Device doesn't support electron density rendering")
      return false
    }
    return true
  }

  _renderVolume(volumeVisual, camera, dstBuf, tmpBuf1, tmpBuf2, tmpBuf3) {
    const volumeBFMat = new VolumeMaterial.BackFacePosMaterial()
    const volumeFFMat = new VolumeMaterial.FrontFacePosMaterial()
    const cubeOffsetMat = new Matrix4().makeTranslation(0.5, 0.5, 0.5)
    const world2colorMat = new Matrix4()
    let volumeRenderingSupported
    const gfx = this._gfx

    if (typeof volumeRenderingSupported === 'undefined') {
      volumeRenderingSupported = this._checkVolumeRenderingSupport(tmpBuf1)
    }

    if (!volumeRenderingSupported) {
      return
    }

    const mesh = volumeVisual.getMesh()

    mesh.rebuild(gfx.camera)

    // use main camera to prepare special textures to be used by volumetric rendering
    // these textures have the size of the window and are stored in offscreen buffers
    gfx.renderer.setClearColor('black', 0)
    gfx.renderer.setRenderTarget(tmpBuf1)
    gfx.renderer.clear()
    gfx.renderer.setRenderTarget(tmpBuf2)
    gfx.renderer.clear()
    gfx.renderer.setRenderTarget(tmpBuf3)
    gfx.renderer.clear()

    gfx.renderer.setRenderTarget(tmpBuf1)
    // draw plane with its own material, because it differs slightly from volumeBFMat
    camera.layers.set(gfxutils.LAYERS.VOLUME_BFPLANE)
    gfx.renderer.render(gfx.scene, camera)

    camera.layers.set(gfxutils.LAYERS.VOLUME)
    gfx.scene.overrideMaterial = volumeBFMat
    gfx.renderer.render(gfx.scene, camera)

    gfx.renderer.setRenderTarget(tmpBuf2)
    camera.layers.set(gfxutils.LAYERS.VOLUME)
    gfx.scene.overrideMaterial = volumeFFMat
    gfx.renderer.render(gfx.scene, camera)

    gfx.scene.overrideMaterial = null
    camera.layers.set(gfxutils.LAYERS.DEFAULT)

    // prepare texture that contains molecule positions
    world2colorMat.copy(mesh.matrixWorld).invert()
    UberMaterial.prototype.uberOptions.world2colorMatrix.multiplyMatrices(
      cubeOffsetMat,
      world2colorMat
    )
    camera.layers.set(gfxutils.LAYERS.COLOR_FROM_POSITION)
    gfx.renderer.setRenderTarget(tmpBuf3)
    gfx.renderer.render(gfx.scene, camera)

    // render volume
    const vm = mesh.material
    vm.uniforms._BFRight.value = tmpBuf1.texture
    vm.uniforms._FFRight.value = tmpBuf2.texture
    vm.uniforms._WFFRight.value = tmpBuf3.texture
    camera.layers.set(gfxutils.LAYERS.VOLUME)
    gfx.renderer.setRenderTarget(dstBuf)
    gfx.renderer.render(gfx.scene, camera)
    camera.layers.set(gfxutils.LAYERS.DEFAULT)
  }

  /*  Render scene with 'ZPrepass transparency Effect'
   * Idea: transparent objects are rendered in two passes. The first one writes result only into depth buffer.
   * The second pass reads depth buffer and writes only to color buffer. The method results in
   * correct image of front part of the semi-transparent objects, but we can see only front transparent objects
   * and opaque objects inside, there is no transparent objects inside.
   * Notes: 1. Opaque objects should be rendered strictly before semi-transparent ones.
   * 2. Realization doesn't use camera layers because scene traversing is used for material changes and
   * we can use it to select needed meshes and don't complicate meshes builders with layers
   */
  _renderWithPrepassTransparency(camera, targetBuffer) {
    const gfx = this._gfx
    gfx.renderer.setRenderTarget(targetBuffer)

    // opaque objects
    camera.layers.set(gfxutils.LAYERS.DEFAULT)
    gfx.renderer.render(gfx.scene, camera)

    // transparent objects z prepass
    camera.layers.set(gfxutils.LAYERS.PREPASS_TRANSPARENT)
    gfx.renderer.getContext().colorMask(false, false, false, false) // don't update color buffer
    gfx.renderer.render(gfx.scene, camera)
    gfx.renderer.getContext().colorMask(true, true, true, true) // update color buffer

    // transparent objects color pass
    camera.layers.set(gfxutils.LAYERS.TRANSPARENT)
    gfx.renderer.render(gfx.scene, camera)

    // restore default layer
    camera.layers.set(gfxutils.LAYERS.DEFAULT)
  }

  _performFXAA(srcBuffer, targetBuffer) {
    const _fxaaMaterial = new FXAAMaterial()
    if (
      typeof srcBuffer === 'undefined' ||
      typeof targetBuffer === 'undefined'
    ) {
      return
    }

    const gfx = this._gfx

    // clear canvas
    gfx.renderer.setClearColor(
      settings.now.bg.color,
      Number(!settings.now.bg.transparent)
    )
    gfx.renderer.setRenderTarget(targetBuffer)
    gfx.renderer.clear()

    // do fxaa processing of offscreen buff2
    _fxaaMaterial.uniforms.srcTex.value = srcBuffer.texture
    _fxaaMaterial.uniforms.srcTexelSize.value.set(
      1.0 / srcBuffer.width,
      1.0 / srcBuffer.height
    )
    _fxaaMaterial.uniforms.bgColor.value.set(settings.now.bg.color)

    if (_fxaaMaterial.bgTransparent !== settings.now.bg.transparent) {
      _fxaaMaterial.setValues({ bgTransparent: settings.now.bg.transparent })
      _fxaaMaterial.needsUpdate = true
    }
    gfx.renderer.renderScreenQuad(_fxaaMaterial)
  }

  _performAO(
    srcColorBuffer,
    normalBuffer,
    srcDepthTexture,
    targetBuffer,
    tempBuffer,
    tempBuffer1
  ) {
    const _aoMaterial = new AOMaterial()
    const _horBlurMaterial = new AOHorBlurMaterial()
    const _vertBlurMaterial = new AOVertBlurWithBlendMaterial()

    const _scale = new Vector3()
    if (
      !srcColorBuffer ||
      !normalBuffer ||
      !srcDepthTexture ||
      !targetBuffer ||
      !tempBuffer ||
      !tempBuffer1
    ) {
      return
    }
    const gfx = this._gfx
    const tanHalfFOV = Math.tan(MathUtils.DEG2RAD * 0.5 * gfx.camera.fov)

    _aoMaterial.uniforms.diffuseTexture.value = srcColorBuffer.texture
    _aoMaterial.uniforms.depthTexture.value = srcDepthTexture
    _aoMaterial.uniforms.normalTexture.value = normalBuffer.texture
    _aoMaterial.uniforms.srcTexelSize.value.set(
      1.0 / srcColorBuffer.width,
      1.0 / srcColorBuffer.height
    )
    _aoMaterial.uniforms.camNearFar.value.set(gfx.camera.near, gfx.camera.far)
    _aoMaterial.uniforms.projMatrix.value = gfx.camera.projectionMatrix
    _aoMaterial.uniforms.aspectRatio.value = gfx.camera.aspect
    _aoMaterial.uniforms.tanHalfFOV.value = tanHalfFOV
    gfx.root.matrix.extractScale(_scale)
    _aoMaterial.uniforms.kernelRadius.value =
      settings.now.debug.ssaoKernelRadius * _scale.x
    _aoMaterial.uniforms.depthThreshold.value = 2.0 * this._getBSphereRadius() // diameter
    _aoMaterial.uniforms.factor.value = settings.now.debug.ssaoFactor
    // N: should be tempBuffer1 for proper use of buffers (see buffers using outside the function)
    gfx.renderer.setRenderTarget(tempBuffer1)
    gfx.renderer.renderScreenQuad(_aoMaterial)

    _horBlurMaterial.uniforms.aoMap.value = tempBuffer1.texture
    _horBlurMaterial.uniforms.srcTexelSize.value.set(
      1.0 / tempBuffer1.width,
      1.0 / tempBuffer1.height
    )
    _horBlurMaterial.uniforms.depthTexture.value = srcDepthTexture
    gfx.renderer.setRenderTarget(tempBuffer)
    gfx.renderer.renderScreenQuad(_horBlurMaterial)

    _vertBlurMaterial.uniforms.aoMap.value = tempBuffer.texture
    _vertBlurMaterial.uniforms.diffuseTexture.value = srcColorBuffer.texture
    _vertBlurMaterial.uniforms.srcTexelSize.value.set(
      1.0 / tempBuffer.width,
      1.0 / tempBuffer.height
    )
    _vertBlurMaterial.uniforms.depthTexture.value = srcDepthTexture
    _vertBlurMaterial.uniforms.projMatrix.value = gfx.camera.projectionMatrix
    _vertBlurMaterial.uniforms.aspectRatio.value = gfx.camera.aspect
    _vertBlurMaterial.uniforms.tanHalfFOV.value = tanHalfFOV
    const { fog } = gfx.scene
    if (fog) {
      _vertBlurMaterial.uniforms.fogNearFar.value.set(fog.near, fog.far)
      _vertBlurMaterial.uniforms.fogColor.value.set(
        fog.color.r,
        fog.color.g,
        fog.color.b,
        settings.now.fogAlpha
      )
    }
    if (
      _vertBlurMaterial.useFog !== settings.now.fog ||
      _vertBlurMaterial.fogTransparent !== settings.now.bg.transparent
    ) {
      _vertBlurMaterial.setValues({
        useFog: settings.now.fog,
        fogTransparent: settings.now.bg.transparent
      })
      _vertBlurMaterial.needsUpdate = true
    }
    gfx.renderer.setRenderTarget(targetBuffer)
    gfx.renderer.renderScreenQuad(_vertBlurMaterial)
  }

  /**
   * Reset the viewer, unload molecules.
   * @param {boolean=} keepReps - Keep representations while resetting viewer state.
   */
  reset(/* keepReps */) {
    if (this._picker) {
      this._picker.reset()
    }
    this._lastPick = null

    this._releaseAllVisuals()

    this._setEditMode(EDIT_MODE.COMPLEX)

    this._resetObjects()

    if (this._gfx) {
      gfxutils.clearTree(this._gfx.pivot)
      this._gfx.renderer2d.reset()
    }

    this.setNeedRender()
  }

  _resetScene() {
    this._objectControls.reset()
    this._objectControls.allowTranslation(true)
    this._objectControls.allowAltObjFreeRotation(true)
    this.resetReps()
    this.resetPivot()
    this.rebuildAll()
  }

  resetView() {
    // reset controls
    if (this._picker) {
      this._picker.reset()
    }
    this._setEditMode(EDIT_MODE.COMPLEX)
    this._resetScene()

    // reset selection
    this._forEachComplexVisual((visual) => {
      visual.updateSelectionMask({})
      visual.rebuildSelectionGeometry()
    })
  }

  _export(format) {
    const TheExporter = head(io.exporters.find({ format }))
    if (!TheExporter) {
      this.logger.error('Could not find suitable exporter for this source')
      return Promise.reject(
        new Error('Could not find suitable exporter for this source')
      )
    }
    this.dispatchEvent({ type: 'exporting' })

    if (this._visuals[this._curVisualName] instanceof ComplexVisual) {
      let dataSource = null
      if (TheExporter.SourceClass === ComplexVisual) {
        dataSource = this._visuals[this._curVisualName]
      } else if (TheExporter.SourceClass === Complex) {
        dataSource = this._visuals[this._curVisualName]._complex
      }
      const exporter = new TheExporter(dataSource, {
        miewVersion: Miew.VERSION
      })
      return exporter.export().then((data) => data)
    }
    if (this._visuals[this._curVisualName] instanceof VolumeVisual) {
      return Promise.reject(
        new Error('Sorry, exporter for volume data not implemented yet')
      )
    }
    return Promise.reject(new Error('Unexpected format of data'))
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
  load(source, opts) {
    opts = merge({}, opts, {
      context: this
    })

    // for a single-file scenario
    if (!this.settings.now.use.multiFile) {
      // abort all loaders in progress
      if (this._loading.length) {
        this._loading.forEach((job) => {
          job.cancel()
        })
        this._loading.length = 0
      }

      // reset
      if (!opts.animation) {
        // FIXME: sometimes it is set AFTERWARDS!
        this.reset(true)
      }
    }

    this._interpolator.reset()

    this.dispatchEvent({ type: 'loading', options: opts, source })

    const job = new JobHandle()
    this._loading.push(job)
    job.addEventListener('notification', (e) => {
      this.dispatchEvent(e.slaveEvent)
    })

    this._spinner.spin(this._container)

    const onLoadEnd = (anything) => {
      const jobIndex = this._loading.indexOf(job)
      if (jobIndex !== -1) {
        this._loading.splice(jobIndex, 1)
      }
      this._spinner.stop()
      this._refreshTitle()
      job.notify({ type: 'loadingDone', anything })
      return anything
    }

    return _fetchData(source, opts, job)
      .then((data) => _parseData(data, opts, job))
      .then((object) => {
        const name = this._onLoad(object, opts)
        return onLoadEnd(name)
      })
      .catch((err) => {
        this.logger.error('Could not load data')
        this.logger.debug(err)
        throw onLoadEnd(err)
      })
  }

  /**
   * Unload molecule (delete corresponding visual).
   * @param {string=} name - name of the visual
   */
  unload(name) {
    this._removeVisual(name || this.getCurrentVisual())
    this.resetPivot()
    if (settings.now.shadow.on) {
      this._updateShadowCamera()
    }
  }

  /**
   * Start new animation. Now is broken.
   * @param fileData - new data to animate
   * @private
   * @deprecated until animation system refactoring.
   */
  _startAnimation(fileData) {
    this._stopAnimation()
    const self = this
    const visual = this._getComplexVisual()
    if (visual === null) {
      this.logger.error('Unable to start animation - no molecule is loaded.')
      return
    }
    try {
      this._frameInfo = new FrameInfo(visual.getComplex(), fileData, {
        onLoadStatusChanged() {
          self.dispatchEvent({
            type: 'mdPlayerStateChanged',
            state: {
              isPlaying: self._isAnimating,
              isLoading: self._frameInfo ? self._frameInfo.isLoading : true
            }
          })
        },
        onError(message) {
          self._stopAnimation()
          self.logger.error(message)
        }
      })
    } catch (e) {
      this.logger.error('Animation file does not fit to current complex!')
      return
    }
    this._continueAnimation()
  }

  /**
   * Pause current animation. Now is broken.
   * @private
   * @deprecated until animation system refactoring.
   */
  _pauseAnimation() {
    if (this._animInterval === null) {
      return
    }
    this._isAnimating = false
    clearInterval(this._animInterval)
    this._animInterval = null
    if (this._frameInfo) {
      this.dispatchEvent({
        type: 'mdPlayerStateChanged',
        state: {
          isPlaying: this._isAnimating,
          isLoading: this._frameInfo.isLoading
        }
      })
    }
  }

  /**
   * Continue current animation after pausing. Now is broken.
   * @private
   * @deprecated until animation system refactoring.
   */
  _continueAnimation() {
    this._isAnimating = true
    let minFrameTime = 1000 / settings.now.maxfps
    minFrameTime = Number.isNaN(minFrameTime) ? 0 : minFrameTime
    const self = this
    const { pivot } = self._gfx
    const visual = this._getComplexVisual()
    if (visual) {
      visual.resetSelectionMask()
      visual.rebuildSelectionGeometry()
      this._msgAtomInfo.style.opacity = 0.0
    }
    this._animInterval = setInterval(() => {
      self.dispatchEvent({
        type: 'mdPlayerStateChanged',
        state: {
          isPlaying: self._isAnimating,
          isLoading: self._frameInfo.isLoading
        }
      })
      if (self._frameInfo.frameIsReady) {
        pivot.updateToFrame(self._frameInfo)
        self._updateObjsToFrame(self._frameInfo)
        self._refreshTitle(
          ` Frame ${self._frameInfo._currFrame} of ${self._frameInfo._framesCount} time interval - ${self._frameInfo._timeStep}`
        )
        try {
          self._frameInfo.nextFrame()
        } catch (e) {
          self.logger.error('Error during animation')
          self._stopAnimation()
          return
        }
        self._needRender = true
      }
    }, minFrameTime)
  }

  /**
   * Stop current animation. Now is broken.
   * @private
   * @deprecated until animation system refactoring.
   */
  _stopAnimation() {
    if (this._animInterval === null) {
      return
    }
    clearInterval(this._animInterval)
    this._frameInfo.disableEvents()
    this._frameInfo = null
    this._animInterval = null
    this.dispatchEvent({
      type: 'mdPlayerStateChanged',
      state: null
    })
  }

  /**
   * Invoked upon successful loading of some data source
   * @param {DataSource} dataSource - Data source for visualization (molecular complex or other)
   * @param {object} opts - Options.
   * @private
   */
  _onLoad(dataSource, opts) {
    const gfx = this._gfx
    let visualName = null

    if (opts.animation) {
      this._refreshTitle()
      this._startAnimation(dataSource)
      return null
    }
    this._stopAnimation()
    if (!opts || !opts.keepRepsInfo) {
      this._opts.reps = null
      this._opts._objects = null
    }

    if (dataSource.id === 'Complex') {
      const complex = dataSource

      // update title
      if (opts.fileName) {
        complex.name =
          complex.name || removeExtension(opts.fileName).toUpperCase()
      } else if (opts.amberFileName) {
        complex.name =
          complex.name || removeExtension(opts.amberFileName).toUpperCase()
      } else {
        complex.name = `Dynamic ${opts.fileType} molecule`
      }

      visualName = this._addVisual(new ComplexVisual(complex.name, complex))
      this._curVisualName = visualName

      const desc = this.info()
      this.logger.info(
        `Parsed ${opts.fileName} (${desc.atoms} atoms, ${desc.bonds} bonds, ${desc.residues} residues, ${desc.chains} chains).`
      )

      if (isNumber(this._opts.unit)) {
        complex.setCurrentUnit(this._opts.unit)
      }

      if (opts.preset) {
        // ...removed server access...
      } else if (settings.now.autoPreset) {
        switch (opts.fileType) {
          case 'cml':
            this.resetReps('small')
            break
          case 'pdb':
          case 'mmtf':
          case 'cif':
            if (hasValidResidues(complex)) {
              this.resetReps('macro')
            } else {
              this.resetReps('small')
            }
            break
          default:
            this.resetReps('default')
            break
        }
      } else {
        this.resetReps('default')
      }
    } else if (dataSource.id === 'Volume') {
      this.resetEd()
      visualName = this._onLoadEd(dataSource)
    }

    gfx.camera.updateProjectionMatrix()
    this._updateFog()

    // reset global transform
    gfx.root.resetTransform()
    this.resetPivot()

    // set scale to fit everything on the screen
    this._objectControls.setScale(
      settings.now.radiusToFit / this._getBSphereRadius()
    )

    this._resetObjects()

    if (settings.now.autoResolution) {
      this._tweakResolution()
    }

    if (settings.now.shadow.on) {
      this._updateShadowCamera()
    }

    if (this._opts.view) {
      this.view(this._opts.view)
      delete this._opts.view
    }

    this._refreshTitle()

    return visualName
  }

  resetEd() {
    if (this._edLoader) {
      this._edLoader.abort()
      this._edLoader = null
    }

    // free all resources
    this._removeVisual(this._getVolumeVisual())

    this._needRender = true
  }

  loadEd(source) {
    this.resetEd()

    const TheLoader = head(io.loaders.find({ source }))
    if (!TheLoader) {
      this.logger.error(LOADER_NOT_FOUND)
      return Promise.reject(new Error(LOADER_NOT_FOUND))
    }

    const loader = (this._edLoader = new TheLoader(source, { binary: true }))
    loader.context = this
    return loader
      .load()
      .then((data) => {
        const TheParser = head(io.parsers.find({ format: 'ccp4' }))
        if (!TheParser) {
          throw new Error(PARSER_NOT_FOUND)
        }
        const parser = new TheParser(data)
        parser.context = this
        return parser.parse().then((dataSource) => {
          this._onLoadEd(dataSource)
        })
      })
      .catch((error) => {
        this.logger.error('Could not load ED data')
        this.logger.debug(error)
      })
  }

  _onLoadEd(dataSource) {
    dataSource.normalize()

    const volumeVisual = new VolumeVisual('volume', dataSource)
    volumeVisual.getMesh().layers.set(gfxutils.LAYERS.VOLUME) // volume mesh is not visible to common render
    const visualName = this._addVisual(volumeVisual)

    this._needRender = true
    return visualName
  }

  _needRebuild() {
    let needsRebuild = false
    this._forEachComplexVisual((visual) => {
      needsRebuild = needsRebuild || visual.needsRebuild()
    })
    return needsRebuild
  }

  _rebuildObjects() {
    const self = this
    const gfx = this._gfx
    let i
    let n

    // remove old object geometry
    const toRemove = []
    for (i = 0; i < gfx.pivot.children.length; ++i) {
      const child = gfx.pivot.children[i]
      if (!(child instanceof Visual)) {
        toRemove.push(child)
      }
    }
    for (i = 0; i < toRemove.length; ++i) {
      toRemove[i].parent.remove(toRemove[i])
    }

    setTimeout(() => {
      const objList = self._objects
      for (i = 0, n = objList.length; i < n; ++i) {
        const obj = objList[i]
        if (obj.needsRebuild) {
          obj.build()
        }
        if (obj.getGeometry()) {
          gfx.pivot.add(obj.getGeometry())
        }
      }
    }, 10)
  }

  changeUnit(unitIdx, name) {
    const visual = this._getComplexVisual(name)
    if (!visual) {
      throw new Error('There is no complex to change!')
    }

    function currentUnitInfo() {
      const unit = visual ? visual.getComplex().getCurrentUnit() : 0
      const type = unit > 0 ? `Bio molecule ${unit}` : 'Asymmetric unit'
      return `Current unit: ${unit} (${type})`
    }

    if (unitIdx === undefined) {
      return currentUnitInfo()
    }
    if (isString(unitIdx)) {
      unitIdx = Math.max(parseInt(unitIdx, 10), 0)
    }
    if (visual.getComplex().setCurrentUnit(unitIdx)) {
      this._resetScene()
      this._updateInfoPanel()
    }
    return currentUnitInfo()
  }

  /**
   * Start to rebuild geometry asynchronously.
   */
  rebuild() {
    if (this._building) {
      this.logger.warn('Miew.rebuild(): already building!')
      return
    }
    this._building = true

    this.dispatchEvent({ type: 'rebuilding' })

    this._rebuildObjects()

    this._gfx.renderer2d.reset()

    const rebuildActions = []
    this._forEachComplexVisual((visual) => {
      if (visual.needsRebuild()) {
        rebuildActions.push(
          visual.rebuild().then(
            () =>
              new Promise((resolve) => {
                visual.rebuildSelectionGeometry()
                resolve()
              })
          )
        )
      }
    })

    // Start asynchronous rebuild
    const self = this
    this._spinner.spin(this._container)
    Promise.all(rebuildActions).then(() => {
      self._spinner.stop()

      self._needRender = true

      self._refreshTitle()
      this.dispatchEvent({ type: 'buildingDone' })
      self._building = false
    })
  }

  /** Mark all representations for rebuilding */
  rebuildAll() {
    this._forEachComplexVisual((visual) => {
      visual.setNeedsRebuild()
    })
  }

  _refreshTitle(appendix) {
    let title
    appendix = appendix === undefined ? '' : appendix
    const visual = this._getComplexVisual()
    if (visual) {
      title = visual.getComplex().name
      const rep = visual.repGet(visual.repCurrent())
      title += rep ? ` – ${rep.mode.name} Mode` : ''
    } else {
      title = Object.keys(this._visuals).length > 0 ? 'Unknown' : 'No Data'
    }
    title += appendix

    this.dispatchEvent({ type: 'titleChanged', data: title })
  }

  setNeedRender() {
    this._needRender = true
  }

  _extractRepresentation() {
    const changed = []

    this._forEachComplexVisual((visual) => {
      if (visual.getSelectionCount() === 0) {
        return
      }

      const selector = visual.buildSelectorFromMask(
        1 << visual.getSelectionBit()
      )
      const defPreset = settings.now.presets.default
      const res = visual.repAdd({
        selector,
        mode: defPreset[0].mode.id,
        colorer: defPreset[0].colorer.id,
        material: defPreset[0].material.id
      })
      if (!res) {
        if (visual.repCount() === ComplexVisual.NUM_REPRESENTATION_BITS) {
          this.logger.warn(
            `Number of representations is limited to ${ComplexVisual.NUM_REPRESENTATION_BITS}`
          )
        }
        return
      }

      this.dispatchEvent({
        type: 'repAdded',
        index: res.index,
        name: visual.name
      })
      visual.repCurrent(res.index)

      changed.push(visual.name)
    })

    if (changed.length > 0) {
      this.logger.report(
        `New representation from selection for complexes: ${changed.join(', ')}`
      )
    }
  }

  /**
   * Change current representation list.
   * @param {array} reps - Representation list.
   */
  _setReps(reps) {
    reps = reps || (this._opts && this._opts.reps) || []
    this._forEachComplexVisual((visual) => visual.resetReps(reps))
  }

  /**
   * Apply existing preset to current scene.
   * @param preset
   */
  applyPreset(preset) {
    const { presets } = settings.now
    const presList = [
      preset || settings.defaults.preset,
      settings.defaults.preset,
      Object.keys(presets)[0]
    ]
    let reps = null
    for (let i = 0; !reps && i < presList.length; ++i) {
      settings.set('preset', presList[i])
      reps = presets[settings.now.preset]
      if (!reps) {
        this.logger.warn(`Unknown preset "${settings.now.preset}"`)
      }
    }
    this._setReps(reps)
  }

  /**
   * Reset current representation list to initial values.
   * @param {string} [preset] - The source preset in case of uninitialized representation list.
   */
  resetReps(preset) {
    const reps = this._opts && this._opts.reps
    if (reps) {
      this._setReps(reps)
    } else {
      this.applyPreset(preset)
    }
  }

  /**
   * Get number of representations created so far.
   * @returns {number} Number of reps.
   */
  repCount(name) {
    const visual = this._getComplexVisual(name)
    return visual ? visual.repCount() : 0
  }

  /**
   * Get or set the current representation index.
   * @param {number=} index - Zero-based index, up to {@link Miew#repCount()}. Defaults to the current one.
   * @param {string=} [name] - Complex name. Defaults to the current one.
   * @returns {number} The current index.
   */
  repCurrent(index, name) {
    const visual = this._getComplexVisual(name)
    const newIdx = visual ? visual.repCurrent(index) : -1
    if (index && newIdx !== index) {
      this.logger.warn(
        `Representation ${index} was not found. Current rep remains unchanged.`
      )
    }
    return newIdx
  }

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
  rep(index, rep) {
    const visual = this._getComplexVisual('')
    if (!visual) {
      return null
    }
    const res = visual.rep(index, rep)
    if (res.status === 'created') {
      this.dispatchEvent({
        type: 'repAdded',
        index: res.index,
        name: visual.name
      })
    } else if (res.status === 'changed') {
      this.dispatchEvent({
        type: 'repChanged',
        index: res.index,
        name: visual.name
      })
    }
    return res.desc
  }

  /**
   * Get representation (not just description) by index.
   * @param {number=} index - Zero-based index, up to {@link Miew#repCount}(). Defaults to the current one.
   * @returns {?object} Representation.
   */
  repGet(index, name) {
    const visual = this._getComplexVisual(name)
    return visual ? visual.repGet(index) : null
  }

  /**
   * Add new representation.
   * @param {object=} rep - Representation description.
   * @returns {number} Index of the new representation.
   */
  repAdd(rep, name) {
    const visual = this._getComplexVisual(name)
    if (!visual) {
      return -1
    }

    const res = visual.repAdd(rep)
    if (res) {
      this.dispatchEvent({ type: 'repAdded', index: res.index, name })
      return res.index
    }
    return -1
  }

  /**
   * Remove representation.
   * @param {number=} index - Zero-based representation index.
   */
  repRemove(index, name) {
    const visual = this._getComplexVisual(name)
    if (!visual) {
      return
    }

    visual.repRemove(index)
    this.dispatchEvent({ type: 'repRemoved', index, name })
  }

  /**
   * Hide representation.
   * @param {number} index - Zero-based representation index.
   * @param {boolean=} hide - Specify false to make rep visible, true to hide (by default).
   */
  repHide(index, hide, name) {
    this._needRender = true
    const visual = this._getComplexVisual(name)
    return visual ? visual.repHide(index, hide) : null
  }

  _setEditMode(mode) {
    this._editMode = mode

    const elem = this._msgMode
    if (elem) {
      elem.style.opacity = mode === EDIT_MODE.COMPLEX ? 0.0 : 1.0

      if (mode !== EDIT_MODE.COMPLEX) {
        const t = elem.getElementsByTagName('p')[0]
        t.innerHTML =
          mode === EDIT_MODE.COMPONENT
            ? 'COMPONENT EDIT MODE'
            : 'FRAGMENT EDIT MODE'
      }
    }

    this.dispatchEvent({
      type: 'editModeChanged',
      data: mode === EDIT_MODE.COMPLEX
    })
  }

  _enterComponentEditMode() {
    if (this._editMode !== EDIT_MODE.COMPLEX) {
      return
    }

    const editors = []
    this._forEachComplexVisual((visual) => {
      const editor = visual.beginComponentEdit()
      if (editor) {
        editors.push(editor)
      }
    })

    if (editors === []) {
      return
    }

    this._editors = editors

    this.logger.info('COMPONENT EDIT MODE -- ON')
    this._setEditMode(EDIT_MODE.COMPONENT)
    this._objectControls.keysTranslateObj(true)
  }

  _applyComponentEdit() {
    if (this._editMode !== EDIT_MODE.COMPONENT) {
      return
    }

    this._objectControls.stop()
    this._objectControls.keysTranslateObj(false)

    for (let i = 0; i < this._editors.length; ++i) {
      this._editors[i].apply()
    }
    this._editors = []

    this.logger.info('COMPONENT EDIT MODE -- OFF (applied)')
    this._setEditMode(EDIT_MODE.COMPLEX)

    this.rebuildAll()
  }

  _discardComponentEdit() {
    if (this._editMode !== EDIT_MODE.COMPONENT) {
      return
    }

    this._objectControls.stop()
    this._objectControls.keysTranslateObj(false)

    for (let i = 0; i < this._editors.length; ++i) {
      this._editors[i].discard()
    }
    this._editors = []

    this.logger.info('COMPONENT EDIT MODE -- OFF (discarded)')
    this._setEditMode(EDIT_MODE.COMPLEX)

    this._needRender = true
    this.rebuildAll()
  }

  _enterFragmentEditMode() {
    if (this._editMode !== EDIT_MODE.COMPLEX) {
      return
    }

    const selectedVisuals = []
    this._forEachComplexVisual((visual) => {
      if (visual instanceof ComplexVisual && visual.getSelectionCount() > 0) {
        selectedVisuals.push(visual)
      }
    })

    if (selectedVisuals.length !== 1) {
      // either we have no selection or
      // we have selected atoms in two or more visuals -- not supported
      return
    }

    const editor = selectedVisuals[0].beginFragmentEdit()
    if (!editor) {
      return
    }
    this._editors = [editor]

    this.logger.info('FRAGMENT EDIT MODE -- ON (single bond)')
    this._setEditMode(EDIT_MODE.FRAGMENT)
    this._objectControls.allowTranslation(false)
    this._objectControls.allowAltObjFreeRotation(editor.isFreeRotationAllowed())

    this._needRender = true
  }

  _applyFragmentEdit() {
    if (this._editMode !== EDIT_MODE.FRAGMENT) {
      return
    }

    this._objectControls.stop()

    for (let i = 0; i < this._editors.length; ++i) {
      this._editors[i].apply()
    }
    this._editors = []

    this.logger.info('FRAGMENT EDIT MODE -- OFF (applied)')
    this._setEditMode(EDIT_MODE.COMPLEX)
    this._objectControls.allowTranslation(true)
    this._objectControls.allowAltObjFreeRotation(true)

    this.rebuildAll()
  }

  _discardFragmentEdit() {
    if (this._editMode !== EDIT_MODE.FRAGMENT) {
      return
    }

    this._objectControls.stop()

    for (let i = 0; i < this._editors.length; ++i) {
      this._editors[i].discard()
    }
    this._editors = []

    this.logger.info('FRAGMENT EDIT MODE -- OFF (discarded)')
    this._setEditMode(EDIT_MODE.COMPLEX)
    this._objectControls.allowTranslation(true)
    this._objectControls.allowAltObjFreeRotation(true)

    this._needRender = true
  }

  _onPick(event) {
    if (!settings.now.picking) {
      // picking is disabled
      return
    }

    if (this._animInterval !== null) {
      // animation playback is on
      return
    }

    if (this._editMode === EDIT_MODE.FRAGMENT) {
      // prevent picking in fragment edit mode
      return
    }

    if (this._objectControls.isEditingAltObj()) {
      // prevent picking during component rotation
      return
    }

    // update last pick & find complex
    let complex = null
    if (event.obj.atom) {
      complex = event.obj.atom.residue.getChain().getComplex()
      this._lastPick = event.obj.atom
    } else if (event.obj.residue) {
      complex = event.obj.residue.getChain().getComplex()
      this._lastPick = event.obj.residue
    } else if (event.obj.chain) {
      complex = event.obj.chain.getComplex()
      this._lastPick = event.obj.chain
    } else if (event.obj.molecule) {
      complex = event.obj.molecule.complex
      this._lastPick = event.obj.molecule
    } else {
      this._lastPick = null
    }

    function _updateSelection(visual) {
      visual.updateSelectionMask(event.obj)
      visual.rebuildSelectionGeometry()
    }

    // update visual
    if (complex) {
      const visual = this._getVisualForComplex(complex)
      if (visual) {
        _updateSelection(visual)
        this._needRender = true
      }
    } else {
      this._forEachComplexVisual(_updateSelection)
      this._needRender = true
    }

    this._updateInfoPanel()
    this.dispatchEvent(event)
  }

  _onKeyDown(event) {
    if (!this._running || !this._hotKeysEnabled) {
      return
    }

    switch (event.keyCode) {
      case 'C'.charCodeAt(0):
        if (settings.now.editing) {
          this._enterComponentEditMode()
        }
        break
      case 'F'.charCodeAt(0):
        if (settings.now.editing) {
          this._enterFragmentEditMode()
        }
        break
      case 'A'.charCodeAt(0):
        switch (this._editMode) {
          case EDIT_MODE.COMPONENT:
            this._applyComponentEdit()
            break
          case EDIT_MODE.FRAGMENT:
            this._applyFragmentEdit()
            break
          default:
            break
        }
        break
      case 'D'.charCodeAt(0):
        switch (this._editMode) {
          case EDIT_MODE.COMPONENT:
            this._discardComponentEdit()
            break
          case EDIT_MODE.FRAGMENT:
            this._discardFragmentEdit()
            break
          default:
            break
        }
        break
      case 'S'.charCodeAt(0):
        event.preventDefault()
        event.stopPropagation()
        settings.set('ao', !settings.now.ao)
        this._needRender = true
        break
      case 107:
        event.preventDefault()
        event.stopPropagation()
        this._forEachComplexVisual((visual) => {
          visual.expandSelection()
          visual.rebuildSelectionGeometry()
        })
        this._updateInfoPanel()
        this._needRender = true
        break
      case 109:
        event.preventDefault()
        event.stopPropagation()
        this._forEachComplexVisual((visual) => {
          visual.shrinkSelection()
          visual.rebuildSelectionGeometry()
        })
        this._updateInfoPanel()
        this._needRender = true
        break
      default:
    }
  }

  _onKeyUp(event) {
    if (!this._running || !this._hotKeysEnabled) {
      return
    }

    if (event.keyCode === 'X'.charCodeAt(0)) {
      this._extractRepresentation()
    }
  }

  _updateInfoPanel() {
    const info = this._msgAtomInfo.getElementsByTagName('p')[0]
    let atom
    let residue

    let count = 0
    this._forEachComplexVisual((visual) => {
      count += visual.getSelectionCount()
    })

    while (info.firstChild) {
      info.removeChild(info.firstChild)
    }

    if (count === 0) {
      this._msgAtomInfo.style.opacity = 0.0
      return
    }

    let firstLine = `${String(count)} atom${count !== 1 ? 's' : ''} selected`
    if (this._lastPick !== null) {
      firstLine += ', the last pick:'
    }
    let secondLine = ''
    let aName = ''
    let coordLine = ''

    if (this._lastPick instanceof Atom) {
      atom = this._lastPick
      residue = atom.residue

      aName = atom.name
      const location =
        atom.location !== 32 ? String.fromCharCode(atom.location) : '' // 32 is code of white-space
      secondLine = `${atom.element.fullName} #${atom.serial}${location}: \
      ${residue._chain._name}.${residue._type._name}${
        residue._sequence
      }${residue._icode.trim()}.`
      secondLine += aName

      coordLine = `Coord: (${atom.position.x.toFixed(2).toString()},\
     ${atom.position.y.toFixed(2).toString()},\
     ${atom.position.z.toFixed(2).toString()})`
    } else if (this._lastPick instanceof Residue) {
      residue = this._lastPick

      secondLine = `${residue._type._fullName}: \
      ${residue._chain._name}.${residue._type._name}${
        residue._sequence
      }${residue._icode.trim()}`
    } else if (this._lastPick instanceof Chain) {
      secondLine = `chain ${this._lastPick._name}`
    } else if (this._lastPick instanceof Molecule) {
      secondLine = `molecule ${this._lastPick._name}`
    }

    info.appendChild(document.createTextNode(firstLine))

    if (secondLine !== '') {
      info.appendChild(document.createElement('br'))
      info.appendChild(document.createTextNode(secondLine))
    }

    if (coordLine !== '') {
      info.appendChild(document.createElement('br'))
      info.appendChild(document.createTextNode(coordLine))
    }

    this._msgAtomInfo.style.opacity = 1.0
  }

  _getAltObj() {
    if (this._editors) {
      let altObj = null
      for (let i = 0; i < this._editors.length; ++i) {
        const nextAltObj = this._editors[i].getAltObj()
        if (nextAltObj.objects.length > 0) {
          if (altObj) {
            // we have selected atoms in two or more visuals -- not supported
            altObj = null
            break
          }
          altObj = nextAltObj
        }
      }
      if (altObj) {
        return altObj
      }
    }

    return {
      objects: [],
      pivot: new Vector3(0, 0, 0)
    }
  }

  resetPivot() {
    const boundingBox = new Box3()
    const center = new Vector3()
    boundingBox.makeEmpty()
    this._forEachVisual((visual) => {
      boundingBox.union(visual.getBoundaries().boundingBox)
    })

    boundingBox.getCenter(center)
    this._objectControls.setPivot(center.negate())
    this.dispatchEvent({ type: 'transform' })
  }

  setPivotResidue(residue) {
    const center = new Vector3()
    const visual = this._getVisualForComplex(residue.getChain().getComplex())
    if (!visual) {
      return
    }

    if (residue._controlPoint) {
      center.copy(residue._controlPoint)
    } else {
      let x = 0
      let y = 0
      let z = 0
      const amount = residue._atoms.length
      for (let i = 0; i < amount; ++i) {
        const p = residue._atoms[i].position
        x += p.x / amount
        y += p.y / amount
        z += p.z / amount
      }
      center.set(x, y, z)
    }
    center.applyMatrix4(visual.matrix).negate()
    this._objectControls.setPivot(center)
    this.dispatchEvent({ type: 'transform' })
  }

  setPivotAtom(atom) {
    const center = new Vector3()
    const visual = this._getVisualForComplex(
      atom.residue.getChain().getComplex()
    )
    if (!visual) {
      return
    }

    center.copy(atom.position)
    center.applyMatrix4(visual.matrix).negate()
    this._objectControls.setPivot(center)
    this.dispatchEvent({ type: 'transform' })
  }

  getSelectionCenter(center, includesAtom, selector) {
    const _centerInVisual = new Vector3(0.0, 0.0, 0.0)
    center.set(0.0, 0.0, 0.0)
    let count = 0

    this._forEachComplexVisual((visual) => {
      if (
        visual.getSelectionCenter(
          _centerInVisual,
          includesAtom,
          selector || visual.getSelectionBit()
        )
      ) {
        center.add(_centerInVisual)
        count++
      }
    })
    if (count === 0) {
      return false
    }
    center.divideScalar(count)
    center.negate()
    return true
  }

  setPivotSubset(selector) {
    const _center = new Vector3(0.0, 0.0, 0.0)
    const includesAtom = selector
      ? _includesInSelector
      : _includesInCurSelection

    if (this.getSelectionCenter(_center, includesAtom, selector)) {
      this._objectControls.setPivot(_center)
      this.dispatchEvent({ type: 'transform' })
    } else {
      this.logger.warn('selection is empty. Center operation not performed')
    }
  }

  /**
   * Makes a screenshot.
   * @param {number} [width] - Width of an image. Defaults to the canvas width.
   * @param {number} [height] - Height of an image. Defaults to the width (square) or canvas height,
   *        if width is omitted too.
   * @returns {string} Data URL representing the image contents.
   */
  screenshot(width, height) {
    const gfx = this._gfx
    const deviceWidth = gfx.renderer.domElement.width
    const deviceHeight = gfx.renderer.domElement.height

    function fov2Tan(fov) {
      return Math.tan(MathUtils.degToRad(0.5 * fov))
    }

    function tan2Fov(tan) {
      return MathUtils.radToDeg(Math.atan(tan)) * 2.0
    }

    function getDataURL() {
      let dataURL
      const currBrowser = utils.getBrowser()

      if (currBrowser === utils.browserType.SAFARI) {
        const canvas = document.createElement('canvas')
        const canvasContext = canvas.getContext('2d')

        canvas.width = width === undefined ? deviceWidth : width
        canvas.height = height === undefined ? deviceHeight : height

        canvasContext.drawImage(
          gfx.renderer.domElement,
          0,
          0,
          canvas.width,
          canvas.height
        )
        dataURL = canvas.toDataURL('image/png')
      } else {
        // Copy current canvas to screenshot
        dataURL = gfx.renderer.domElement.toDataURL('image/png')
      }
      return dataURL
    }
    height = height || width

    let screenshotURI
    if (
      (width === undefined && height === undefined) ||
      (width === deviceWidth && height === deviceHeight)
    ) {
      // renderer.domElement.toDataURL('image/png') returns flipped image in Safari
      // It hasn't been resolved yet, but getScreenshotSafari()
      // fixes it using an extra canvas.
      screenshotURI = getDataURL()
    } else {
      const originalAspect = gfx.camera.aspect
      const originalFov = gfx.camera.fov
      const originalTanFov2 = fov2Tan(gfx.camera.fov)

      // screenshot should contain the principal area of interest (a centered square touching screen sides)
      const areaOfInterestSize = Math.min(gfx.width, gfx.height)
      const areaOfInterestTanFov2 =
        (originalTanFov2 * areaOfInterestSize) / gfx.height

      // set appropriate camera aspect & FOV
      const shotAspect = width / height
      gfx.renderer.setPixelRatio(1)
      gfx.camera.aspect = shotAspect
      gfx.camera.fov = tan2Fov(
        areaOfInterestTanFov2 / Math.min(shotAspect, 1.0)
      )
      gfx.camera.updateProjectionMatrix()

      // resize canvas to the required size of screenshot
      gfx.renderer.setDrawingBufferSize(width, height, 1)

      // make screenshot
      this._renderFrame(settings.now.stereo)
      screenshotURI = getDataURL()

      // restore original camera & canvas proportions
      gfx.renderer.setPixelRatio(window.devicePixelRatio)
      gfx.camera.aspect = originalAspect
      gfx.camera.fov = originalFov
      gfx.camera.updateProjectionMatrix()
      gfx.renderer.setDrawingBufferSize(
        gfx.width,
        gfx.height,
        window.devicePixelRatio
      )
      this._needRender = true
    }

    return screenshotURI
  }

  /**
   * Makes screenshot and initiates a download.
   * @param {string} [filename] - Name of a file. Default to a 'screenshot-XXXXX.png', where XXXXX is a current
   *        date/time in seconds.
   * @param {number} [width] - Width of an image. Defaults to the canvas width.
   * @param {number} [height] - Height of an image. Defaults to the width (square) or canvas height,
   *        if width is omitted too.
   */
  screenshotSave(filename, width, height) {
    const uri = this.screenshot(width, height)
    utils.shotDownload(uri, filename)
  }

  save(opts) {
    this._export(opts.fileType)
      .then((dataString) => {
        const filename = this._visuals[this._curVisualName]._complex.name
        utils.download(dataString, filename, opts.fileType)
        this._refreshTitle()
        this.dispatchEvent({ type: 'exportingDone' })
      })
      .catch((error) => {
        this.logger.error('Could not export data')
        this.logger.debug(error)
        this._refreshTitle()
        this.dispatchEvent({ type: 'exportingDone', error })
      })
  }

  _tweakResolution() {
    const maxPerf = [
      ['poor', 100],
      ['low', 500],
      ['medium', 1000],
      ['high', 5000],
      ['ultra', Number.MAX_VALUE]
    ]

    let atomCount = 0
    this._forEachComplexVisual((visual) => {
      atomCount += visual.getComplex().getAtomCount()
    })

    if (atomCount > 0) {
      const performance = (this._gfxScore * 10e5) / atomCount
      // set resolution based on estimated performance
      for (let i = 0; i < maxPerf.length; ++i) {
        if (performance < maxPerf[i][1]) {
          this._autoChangeResolution(maxPerf[i][0])
          break
        }
      }
    }
  }

  _autoChangeResolution(resolution) {
    if (resolution !== settings.now.resolution) {
      this.logger.report(
        `Your rendering resolution was changed to "${resolution}" for best performance.`
      )
    }
    settings.now.resolution = resolution
  }

  /**
   * Save current settings to cookies.
   */
  saveSettings() {
    this._cookies.setCookie(
      this._opts.settingsCookie,
      JSON.stringify(this.settings.getDiffs(true))
    )
  }

  /**
   * Load settings from cookies.
   */
  restoreSettings() {
    try {
      const cookie = this._cookies.getCookie(this._opts.settingsCookie)
      const diffs = cookie ? JSON.parse(cookie) : {}
      this.settings.applyDiffs(diffs, true)
    } catch (e) {
      this.logger.error(`Cookies parse error: ${e.message}`)
    }
  }

  /**
   * Reset current settings to the defaults.
   */
  resetSettings() {
    this.settings.reset()
  }

  /*
   * DANGEROUS and TEMPORARY. The method should change or disappear in future versions.
   * @param {string|object} opts - See {@link Miew} constructor.
   * @see {@link Miew#set}, {@link Miew#repAdd}, {@link Miew#rep}.
   */
  setOptions(opts) {
    if (typeof opts === 'string') {
      opts = Miew.options.fromAttr(opts)
    }
    if (opts.reps) {
      this._opts.reps = null
    }
    merge(this._opts, opts)
    if (opts.settings) {
      this.set(opts.settings)
    }

    this._opts._objects = opts._objects
    this._resetObjects()

    if (opts.load) {
      this.load(opts.load, { fileType: opts.type })
    }

    if (opts.preset) {
      settings.now.preset = opts.preset
    }

    if (opts.reps) {
      this.resetReps(opts.preset)
    }

    if (this._opts.view) {
      this.view(this._opts.view)
      delete this._opts.view
    }

    const visual = this._getComplexVisual()
    if (visual) {
      visual.getComplex().resetCurrentUnit()
      if (isNumber(opts.unit)) {
        visual.getComplex().setCurrentUnit(opts.unit)
      }
      this.resetView()
      this.rebuildAll()
    }
  }

  info(name) {
    const visual = this._getComplexVisual(name)
    if (!visual) {
      return {}
    }
    const complex = visual.getComplex()
    const { metadata } = complex
    return {
      id: metadata.id || complex.name || 'UNKNOWN',
      title: (metadata.title && metadata.title.join(' ')) || 'UNKNOWN DATA',
      atoms: complex.getAtomCount(),
      bonds: complex.getBondCount(),
      residues: complex.getResidueCount(),
      chains: complex.getChainCount()
    }
  }

  /*
   * OBJECTS SEGMENT
   */

  addObject(objData, bThrow) {
    let Ctor = null

    if (objData.type === LinesObject.prototype.type) {
      Ctor = LinesObject
    }

    if (Ctor === null) {
      throw new Error(`Unknown scene object type - ${objData.type}`)
    }

    try {
      const newObj = new Ctor(objData.params, objData.opts)
      this._addSceneObject(newObj)
    } catch (error) {
      if (!bThrow) {
        this.logger.debug(
          `Error during scene object creation: ${error.message}`
        )
      } else {
        throw error
      }
    }
    this._needRender = true
  }

  _addSceneObject(sceneObject) {
    const visual = this._getComplexVisual()
    if (sceneObject.build && visual) {
      sceneObject.build(visual.getComplex())
      this._gfx.pivot.add(sceneObject.getGeometry())
    }
    const objects = this._objects
    objects[objects.length] = sceneObject
  }

  _updateObjsToFrame(frameData) {
    const objs = this._objects
    for (let i = 0, n = objs.length; i < n; ++i) {
      if (objs[i].updateToFrame) {
        objs[i].updateToFrame(frameData)
      }
    }
  }

  _resetObjects() {
    const objs = this._opts._objects

    this._objects = []
    if (objs) {
      for (let i = 0, n = objs.length; i < n; ++i) {
        this.addObject(objs[i], false)
      }
    }
  }

  removeObject(index) {
    const obj = this._objects[index]
    if (!obj) {
      throw new Error(`Scene object with index ${index} does not exist`)
    }
    obj.destroy()
    this._objects.splice(index, 1)
    this._needRender = true
  }

  /**
   * Get a string with a URL to reproduce the current scene.
   *
   * @param {boolean} [opts.compact=true] - set this flag to false if you want to include full
   * preset information regardless of the differences with settings
   * @param {boolean} [opts.settings=false] - when this flag is true, changes in settings are included
   * @param {boolean} [opts.view=false] - when this flag is true, a view information is included
   * @returns {string} URL
   */
  getURL(opts) {
    return options.toURL(
      this.getState(
        defaults(opts, {
          compact: true,
          settings: false,
          view: false
        })
      )
    )
  }

  /**
   * Get a string with a script to reproduce the current scene.
   *
   * @param {boolean} [opts.compact=true] - set this flag to false if you want to include full
   * preset information regardless of the differences with settings
   * @param {boolean} [opts.settings=true] - when this flag is true, changes in settings are included
   * @param {boolean} [opts.view=true] - when this flag is true, a view information is included
   * @returns {string} script
   */
  getScript(opts) {
    return options.toScript(
      this.getState(
        defaults(opts, {
          compact: true,
          settings: true,
          view: true
        })
      )
    )
  }

  /*
   * Generates object that represents the current state of representations list
   * @param {boolean} compareWithDefaults - when this flag is true, reps list is compared (if possible)
   * to preset's defaults and only diffs are generated
   */
  _compareReps(complexVisual, compareWithDefaults) {
    const ans = {}
    let repCount = 0

    if (complexVisual) {
      repCount = complexVisual.repCount()
    }

    const currPreset = settings.defaults.presets[settings.now.preset]
    let compare = compareWithDefaults
    if (currPreset === undefined || currPreset.length > repCount) {
      compare = false
      ans.preset = 'empty'
    } else if (settings.now.preset !== settings.defaults.preset) {
      ans.preset = settings.now.preset
    }

    const repsDiff = []
    let emptyReps = true
    for (let i = 0, n = repCount; i < n; ++i) {
      repsDiff[i] = complexVisual
        .repGet(i)
        .compare(compare ? currPreset[i] : null)
      if (!isEmpty(repsDiff[i])) {
        emptyReps = false
      }
    }
    if (!emptyReps) {
      ans.reps = repsDiff
    }
    return ans
  }

  /*
   * Obtain object that represents current state of miew (might be used as options in constructor).
   * @param {boolean} [opts.compact=true] - set this flag to false if you want to include full
   * preset information regardless of the differences with settings
   * @param {boolean} [opts.settings=false] - when this flag is true, changes in settings are included
   * @param {boolean} [opts.view=false] - when this flag is true, a view information is included
   * @returns {Object} State object.
   */
  getState(opts) {
    const state = {}

    opts = defaults(opts, {
      compact: true,
      settings: false,
      view: false
    })

    // load
    const visual = this._getComplexVisual()
    if (visual !== null) {
      const complex = visual.getComplex()
      const { metadata } = complex
      if (metadata.id) {
        const format = metadata.format ? `${metadata.format}:` : ''
        state.load = format + metadata.id
      }
      const unit = complex.getCurrentUnit()
      if (unit !== 1) {
        state.unit = unit
      }
    }

    // representations
    const repsInfo = this._compareReps(visual, opts.compact)
    if (repsInfo.preset) {
      state.preset = repsInfo.preset
    }

    if (repsInfo.reps) {
      state.reps = repsInfo.reps
    }

    // objects
    const objects = this._objects
    const objectsState = []
    for (let i = 0, n = objects.length; i < n; ++i) {
      objectsState[i] = objects[i].identify()
    }
    if (objects.length > 0) {
      state._objects = objectsState
    }

    // view
    if (opts.view) {
      state.view = this.view()
    }

    // settings
    if (opts.settings) {
      const diff = this.settings.getDiffs(false)
      if (!isEmpty(diff)) {
        state.settings = diff
      }
    }

    return state
  }

  /**
   * Get parameter value.
   * @param {string} param - Parameter name or path (e.g. 'modes.BS.atom').
   * @param {*=} value - Default value.
   * @returns {*} Parameter value.
   */
  get(param, value) {
    return settings.get(param, value)
  }

  _clipPlaneUpdateValue(radius) {
    const clipPlaneValue = Math.max(
      this._gfx.camera.position.z - radius * settings.now.draft.clipPlaneFactor,
      settings.now.camNear
    )

    const opts = { clipPlaneValue }
    this._forEachComplexVisual((visual) => {
      visual.setUberOptions(opts)
    })
    for (let i = 0, n = this._objects.length; i < n; ++i) {
      const obj = this._objects[i]
      if (obj._line) {
        obj._line.material.setUberOptions(opts)
      }
    }
    if (this._picker !== null) {
      this._picker.clipPlaneValue = clipPlaneValue
    }
  }

  _fogFarUpdateValue() {
    if (this._picker !== null) {
      if (this._gfx.scene.fog) {
        this._picker.fogFarValue = this._gfx.scene.fog.far
      } else {
        this._picker.fogFarValue = undefined
      }
    }
  }

  _updateShadowmapMeshes(process) {
    this._forEachComplexVisual((visual) => {
      const reprList = visual._reprList
      for (let i = 0, n = reprList.length; i < n; ++i) {
        const repr = reprList[i]
        process(repr.geo, repr.material)
      }
    })
  }

  _updateMaterials(values, needTraverse = false, process = undefined) {
    this._forEachComplexVisual((visual) =>
      visual.setMaterialValues(values, needTraverse, process)
    )
    for (let i = 0, n = this._objects.length; i < n; ++i) {
      const obj = this._objects[i]
      if (obj._line) {
        obj._line.material.setValues(values)
        obj._line.material.needsUpdate = true
      }
    }
  }

  _fogAlphaChanged() {
    this._forEachComplexVisual((visual) => {
      visual.setUberOptions({
        fogAlpha: settings.now.fogAlpha
      })
    })
  }

  _embedWebXR() {
    // switch off
    if (settings.now.stereo !== 'WEBVR') {
      if (this.webVR) {
        this.webVR.disable()
      }
      this.webVR = null
      return
    }
    // switch on
    if (!this.webVR) {
      this.webVR = new WebVRPoC(() => {
        this._requestAnimationFrame(() => this._onTick())
        this._needRender = true
        this._onResize()
      })
    }
    this.webVR.enable(this._gfx)
  }

  _initOnSettingsChanged() {
    const on = (props, func) => {
      props = isArray(props) ? props : [props]
      props.forEach((prop) => {
        this.settings.addEventListener(`change:${prop}`, func)
      })
    }

    on('modes.VD.frame', () => {
      const volume = this._getVolumeVisual()
      if (volume === null) return

      volume.showFrame(settings.now.modes.VD.frame)
      this._needRender = true
    })

    on('modes.VD.isoMode', () => {
      const volume = this._getVolumeVisual()
      if (volume === null) return

      volume.getMesh().material.updateDefines()
      this._needRender = true
    })

    on('bg.color', () => {
      this._onBgColorChanged()
    })

    on('ao', () => {
      if (settings.now.ao && !isAOSupported(this._gfx.renderer.getContext())) {
        this.logger.warn('Your device or browser does not support ao')
        settings.set('ao', false)
      } else {
        const values = { normalsToGBuffer: settings.now.ao }
        this._setUberMaterialValues(values)
      }
    })

    on('zSprites', () => {
      if (
        settings.now.zSprites &&
        !arezSpritesSupported(this._gfx.renderer.getContext())
      ) {
        this.logger.warn('Your device or browser does not support zSprites')
        settings.set('zSprites', false)
      }
      this.rebuildAll()
    })

    on('fogColor', () => {
      this._onFogColorChanged()
    })

    on('fogColorEnable', () => {
      this._onFogColorChanged()
    })

    on('bg.transparent', (evt) => {
      const gfx = this._gfx
      if (gfx) {
        gfx.renderer.setClearColor(
          settings.now.bg.color,
          Number(!settings.now.bg.transparent)
        )
      }
      // update materials
      this._updateMaterials({ fogTransparent: evt.value })
      this.rebuildAll()
    })

    on('draft.clipPlane', (evt) => {
      // update materials
      this._updateMaterials({ clipPlane: evt.value })
      this.rebuildAll()
    })

    on('shadow.on', (evt) => {
      // update materials
      const values = {
        shadowmap: evt.value,
        shadowmapType: settings.now.shadow.type
      }
      const gfx = this._gfx
      if (gfx) {
        gfx.renderer.shadowMap.enabled = Boolean(values.shadowmap)
      }
      this._updateMaterials(values, true)
      if (values.shadowmap) {
        this._updateShadowCamera()
        this._updateShadowmapMeshes(meshutils.createShadowmapMaterial)
      } else {
        this._updateShadowmapMeshes(meshutils.removeShadowmapMaterial)
      }
      this._needRender = true
    })

    on('shadow.type', (evt) => {
      // update materials if shadowmap is enable
      if (settings.now.shadow.on) {
        this._updateMaterials({ shadowmapType: evt.value }, true)
        this._needRender = true
      }
    })

    on('shadow.radius', (evt) => {
      for (let i = 0; i < this._gfx.scene.children.length; i++) {
        if (this._gfx.scene.children[i].shadow !== undefined) {
          const light = this._gfx.scene.children[i]
          light.shadow.radius = evt.value
          this._needRender = true
        }
      }
    })

    on('fps', () => {
      this._fps.show(settings.now.fps)
    })

    on(['fog', 'fogNearFactor', 'fogFarFactor'], () => {
      this._updateFog()
      this._needRender = true
    })

    on('fogAlpha', () => {
      const { fogAlpha } = settings.now
      if (fogAlpha < 0 || fogAlpha > 1) {
        this.logger.warn('fogAlpha must belong range [0,1]')
      }
      this._fogAlphaChanged()
      this._needRender = true
    })

    on('autoResolution', (evt) => {
      if (evt.value && !this._gfxScore) {
        this.logger.warn(
          'Benchmarks are missed, autoresolution will not work! ' +
            'Autoresolution should be set during miew startup.'
        )
      }
    })

    on('stereo', () => {
      this._embedWebXR(settings.now.stereo === 'WEBVR')
      this._needRender = true
    })

    on(['transparency', 'palette'], () => {
      this.rebuildAll()
    })

    on('resolution', () => {
      // update complex visuals
      this.rebuildAll()

      // update volume visual
      const volume = this._getVolumeVisual()
      if (volume) {
        volume.getMesh().material.updateDefines()
        this._needRender = true
      }
    })

    on(
      [
        'axes',
        'fxaa',
        'ao',
        'outline.on',
        'outline.color',
        'outline.threshold',
        'outline.thickness'
      ],
      () => {
        this._needRender = true
      }
    )
  }

  /**
   * Set parameter value.
   * @param {string|object} params - Parameter name or path (e.g. 'modes.BS.atom') or even settings object.
   * @param {*=} value - Value.
   */
  set(params, value) {
    settings.set(params, value)
  }

  /**
   * Select atoms with selection string.
   * @param {string} expression - string expression of selection
   * @param {boolean=} append - true to append selection atoms to current selection, false to rewrite selection
   */
  select(expression, append) {
    const visual = this._getComplexVisual()
    if (!visual) {
      return
    }

    let sel = expression
    if (isString(expression)) {
      sel = selectors.parse(expression).selector
    }

    visual.select(sel, append)
    this._lastPick = null

    this._updateInfoPanel()
    this._needRender = true
  }

  /**
   * Get or set view info packed into string.
   *
   * **Note:** view is stored for *left-handed* cs, euler angles are stored in radians and *ZXY-order*,
   *
   * @param {string=} expression - Optional string encoded the view
   */
  view(expression) {
    const VIEW_VERSION = '1'
    const self = this
    const { pivot } = this._gfx
    let transform = []
    const eulerOrder = 'ZXY'

    function encode() {
      const pos = pivot.position
      const scale = self._objectControls.getScale() / settings.now.radiusToFit
      const euler = new Euler()
      euler.setFromQuaternion(self._objectControls.getOrientation(), eulerOrder)
      transform = [pos.x, pos.y, pos.z, scale, euler.x, euler.y, euler.z]
      return VIEW_VERSION + utils.arrayToBase64(transform, Float32Array)
    }

    function decode() {
      // backwards compatible: old non-versioned view is the 0th version
      if (expression.length === 40) {
        expression = `0${expression}`
      }

      const version = expression[0]
      transform = utils.arrayFromBase64(expression.substr(1), Float32Array)

      // apply adapter for old versions
      if (version !== VIEW_VERSION) {
        if (version === '0') {
          // cancel radiusToFit included in old views
          transform[3] /= 8.0
        } else {
          // do nothing
          self.logger.warn(
            `Encoded view version mismatch, stored as ${version} vs ${VIEW_VERSION} expected`
          )
          return
        }
      }

      const interpolator = self._interpolator
      const srcView = interpolator.createView()
      srcView.position.copy(pivot.position)
      srcView.scale = self._objectControls.getScale()
      srcView.orientation.copy(self._objectControls.getOrientation())

      const dstView = interpolator.createView()
      dstView.position.set(transform[0], transform[1], transform[2])

      // hack to make preset views work after we moved centering offset to visual nodes
      // FIXME should only store main pivot offset in preset
      if (self._getComplexVisual()) {
        dstView.position.sub(self._getComplexVisual().position)
      }

      dstView.scale = transform[3] // eslint-disable-line prefer-destructuring
      dstView.orientation.setFromEuler(
        new Euler(transform[4], transform[5], transform[6], eulerOrder)
      )

      interpolator.setup(srcView, dstView)
    }

    if (typeof expression === 'undefined') {
      return encode()
    }
    decode()

    return expression
  }

  /*
   * Update current view due to viewinterpolator state
   */
  _updateView() {
    const self = this
    const { pivot } = this._gfx

    const interpolator = this._interpolator
    if (!interpolator.wasStarted()) {
      interpolator.start()
    }

    if (!interpolator.isMoving()) {
      return
    }

    const res = interpolator.getCurrentView()
    if (res.success) {
      const curr = res.view
      pivot.position.copy(curr.position)
      self._objectControls.setScale(curr.scale * settings.now.radiusToFit)
      self._objectControls.setOrientation(curr.orientation)
      this.dispatchEvent({ type: 'transform' })
      self._needRender = true
    }
  }

  /**
   * Translate object by vector
   * @param {number} x - translation value (Ang) along model's X axis
   * @param {number} y - translation value (Ang) along model's Y axis
   * @param {number} z - translation value (Ang) along model's Z axis
   */
  translate(x, y, z) {
    this._objectControls.translatePivot(x, y, z)
    this.dispatchEvent({ type: 'transform' })
    this._needRender = true
  }

  /**
   * Rotate object by Euler angles
   * @param {number} x - rotation angle around X axis in radians
   * @param {number} y - rotation angle around Y axis in radians
   * @param {number} z - rotation angle around Z axis in radians
   */
  rotate(x, y, z) {
    this._objectControls.rotate(
      new Quaternion().setFromEuler(new Euler(x, y, z, 'XYZ'))
    )
    this.dispatchEvent({ type: 'transform' })
    this._needRender = true
  }

  /**
   * Scale object by factor
   * @param {number} factor - scale multiplier, should greater than zero
   */
  scale(factor) {
    if (factor <= 0) {
      throw new RangeError('Scale should be greater than zero')
    }
    this._objectControls.scale(factor)
    this.dispatchEvent({ type: 'transform' })
    this._needRender = true
  }

  /**
   * Center view on selection
   * @param {empty | subset | string} selector - defines part of molecule which must be centered (
   * empty - center on current selection;
   * subset - center on picked atom/residue/molecule;
   * string - center on atoms correspond to selection string)
   */
  center(selector) {
    // no arguments - center on current selection;
    if (selector === undefined) {
      this.setPivotSubset()
      this._needRender = true
      return
    }
    // subset with atom or residue - center on picked atom/residue;
    if (
      selector.obj !== undefined &&
      ('atom' in selector.obj || 'residue' in selector.obj)
    ) {
      // from event with selection
      if ('atom' in selector.obj) {
        this.setPivotAtom(selector.obj.atom)
      } else {
        this.setPivotResidue(selector.obj.residue)
      }
      this._needRender = true
      return
    }
    // string - center on atoms correspond to selection string
    if (selector.obj === undefined && selector !== '') {
      const sel = selectors.parse(selector)
      if (sel.error === undefined) {
        this.setPivotSubset(sel)
        this._needRender = true
        return
      }
    }
    // empty subset or incorrect/empty string - center on all molecule;
    this.resetPivot()
    this._needRender = true
  }

  /**
   * Build selector that contains all atoms within given distance from group of atoms
   * @param {Selector} selector - selector describing source group of atoms
   * @param {number} radius - distance
   * @returns {Selector} selector describing result group of atoms
   */
  within(selector, radius) {
    const visual = this._getComplexVisual()
    if (!visual) {
      return selectors.None()
    }

    if (selector instanceof String) {
      selector = selectors.parse(selector)
    }

    const res = visual.within(selector, radius)
    if (res) {
      visual.rebuildSelectionGeometry()
      this._needRender = true
    }
    return res
  }

  /**
   * Get atom position in 2D canvas coords
   * @param {string} fullAtomName - full atom name, like A.38.CG
   * @returns {Object} {x, y} or false if atom not found
   */
  projected(fullAtomName, complexName) {
    const visual = this._getComplexVisual(complexName)
    if (!visual) {
      return false
    }

    const atom = visual.getComplex().getAtomByFullname(fullAtomName)
    if (atom === null) {
      return false
    }

    const pos = atom.position.clone()
    // we consider atom position to be affected only by common complex transform
    // ignoring any transformations that may add during editing
    this._gfx.pivot.updateMatrixWorldRecursive()
    this._gfx.camera.updateMatrixWorldRecursive()
    this._gfx.pivot.localToWorld(pos)
    pos.project(this._gfx.camera)

    return {
      x: (pos.x + 1.0) * 0.5 * this._gfx.width,
      y: (1.0 - pos.y) * 0.5 * this._gfx.height
    }
  }

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
  dssp(complexName) {
    const visual = this._getComplexVisual(complexName)
    if (!visual) {
      return
    }
    visual.getComplex().dssp()

    // rebuild dependent representations (cartoon or ss-colored)
    visual._reprList.forEach((rep) => {
      if (rep.mode.id === 'CA' || rep.colorer.id === 'SS') {
        rep.needsRebuild = true
      }
    })
  }

  exportCML() {
    const self = this

    function extractRotation(m) {
      const xAxis = new Vector3()
      const yAxis = new Vector3()
      const zAxis = new Vector3()
      m.extractBasis(xAxis, yAxis, zAxis)
      xAxis.normalize()
      yAxis.normalize()
      zAxis.normalize()
      const retMat = new Matrix4()
      retMat.identity()
      retMat.makeBasis(xAxis, yAxis, zAxis)
      return retMat
    }

    function updateCMLData(complex) {
      const { root } = self._gfx
      const mat = extractRotation(root.matrixWorld)
      const v4 = new Vector4(0, 0, 0, 0)
      const vCenter = new Vector4(0, 0, 0, 0)
      let xml = null
      let ap = null

      // update atoms in cml
      complex.forEachAtom((atom) => {
        if (atom.xmlNodeRef && atom.xmlNodeRef.xmlNode) {
          xml = atom.xmlNodeRef.xmlNode
          ap = atom.position
          v4.set(ap.x, ap.y, ap.z, 1.0)
          v4.applyMatrix4(mat)
          xml.setAttribute('x3', v4.x.toString())
          xml.setAttribute('y3', v4.y.toString())
          xml.setAttribute('z3', v4.z.toString())
          xml.removeAttribute('x2')
          xml.removeAttribute('y2')
        }
      })
      // update stereo groups in cml
      complex.forEachSGroup((sGroup) => {
        if (sGroup.xmlNodeRef && sGroup.xmlNodeRef.xmlNode) {
          xml = sGroup.xmlNodeRef.xmlNode
          ap = sGroup.getPosition()
          v4.set(ap.x, ap.y, ap.z, 1.0)
          const cp = sGroup.getCentralPoint()
          if (cp === null) {
            v4.applyMatrix4(mat)
          } else {
            vCenter.set(cp.x, cp.y, cp.z, 0.0)
            v4.add(vCenter)
            v4.applyMatrix4(mat) // pos in global space
            vCenter.set(cp.x, cp.y, cp.z, 1.0)
            vCenter.applyMatrix4(mat)
            v4.sub(vCenter)
          }
          xml.setAttribute('x', v4.x.toString())
          xml.setAttribute('y', v4.y.toString())
          xml.setAttribute('z', v4.z.toString())
        }
      })
    }

    const visual = self._getComplexVisual()
    const complex = visual ? visual.getComplex() : null
    if (complex && complex.originalCML) {
      updateCMLData(complex)

      // serialize xml structure to string
      const oSerializer = new XMLSerializer()
      return oSerializer.serializeToString(complex.originalCML)
    }

    return null
  }

  /**
   * Reproduce the RCSB PDB Molecule of the Month style by David S. Goodsell
   *
   * @see http://pdb101.rcsb.org/motm/motm-about
   */
  motm() {
    settings.set({
      fogColorEnable: true,
      fogColor: 0x000000,
      outline: { on: true, threshold: 0.01 },
      bg: { color: 0xffffff }
    })

    this._forEachComplexVisual((visual) => {
      const rep = []
      const complex = visual.getComplex()
      const palette = palettes.get(settings.now.palette)
      for (let i = 0; i < complex.getChainCount(); i++) {
        const curChainName = complex._chains[i]._name
        const curChainColor = palette.getChainColor(curChainName)
        rep[i] = {
          selector: `chain ${curChainName}`,
          mode: 'VW',
          colorer: ['CB', { color: curChainColor, factor: 0.9 }],
          material: 'FL'
        }
      }
      visual.resetReps(rep)
    })
  }
}

assign(
  Miew,
  /** @lends Miew */ {
    VERSION: Miew.VERSION,

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
      Representation
    }
  }
)
