import _ from 'lodash';
import utils from './utils';
import EventDispatcher from './utils/EventDispatcher';

const VERSION = 0;

//----------------------------------------------------------------------------
// DEFAULT SETTINGS
//----------------------------------------------------------------------------

/**
 * Polygonal complexity settings.
 *
 * @typedef PolyComplexity
 * @property {number} poor
 * @property {number} low
 * @property {number} medium
 * @property {number} high
 * @property {number} ultra
 */

/**
 * @alias SettingsObject
 * @namespace
 */
const defaults = {
  /**
   * Default options for all available modes.
   * Use {@link Mode.id} as a dictionary key to access mode options.
   *
   * Usually you don't need to override these settings. You may specify mode options as a parameter during
   * {@link Mode} construction.
   *
   * @memberof SettingsObject#
   * @type {Object.<string, object>}
   *
   * @property {LinesModeOptions} LN - Lines mode options.
   * @property {LicoriceModeOptions} LC - Licorice mode options.
   * @property {BallsAndSticksModeOptions} BS - Balls and Sticks mode options.
   * @property {VanDerWaalsModeOptions} VW - Van der Waals mode options.
   * @property {TraceModeOptions} TR - Trace mode options.
   * @property {TubeModeOptions} TU - Tube mode options.
   * @property {CartoonModeOptions} CA - Cartoon mode options.
   * @property {QuickSurfaceModeOptions} QS - Contact Surface mode options.
   * @property {IsoSurfaceSASModeOptions} SA - Solvent Accessible Surface mode options.
   * @property {IsoSurfaceSESModeOptions} SE - Solvent Excluded Surface mode options.
   * @property {ContactSurfaceModeOptions} CS - Contact Surface mode options.
   * @property {TextModeOptions} TX - Text mode options.
   * @property {VolumeDensityModeOptions} VD - Volume Density mode options.
   */
  modes: {
    //----------------------------------------------------------------------------
    // BALLS AND STICKS
    //----------------------------------------------------------------------------

    /**
     * Balls and Sticks mode options.
     *
     * @typedef BallsAndSticksModeOptions
     *
     * @property {number} atom - Sphere radius as a fraction of Van der Waals atom radius.
     * @property {number} bond - Cylinder radius in angstroms.
     * @property {number} space - Fraction of the space around one cylinder. Zero means that cylinder fills all
     *   available space.
     * @property {boolean} multibond - Toggles rendering of multiple ordered bonds.
     * @property {number} aromrad - Minor radius of a torus for aromatic loops.
     * @property {boolean} showarom - Toggles rendering of aromatic loops.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     */
    BS: {
      atom: 0.23,
      bond: 0.15,
      space: 0.5,
      multibond: true,
      aromrad: 0.1,
      showarom: true,
      polyComplexity: {
        poor: 3,
        low: 4,
        medium: 6,
        high: 12,
        ultra: 32,
      },
    },

    //----------------------------------------------------------------------------
    // VAN DER WAALS
    //----------------------------------------------------------------------------

    /**
     * Van der Waals mode options.
     *
     * @typedef VanDerWaalsModeOptions
     *
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     */
    VW: {
      polyComplexity: {
        poor: 4,
        low: 6,
        medium: 8,
        high: 16,
        ultra: 32,
      },
    },

    //----------------------------------------------------------------------------
    // LINES
    //----------------------------------------------------------------------------

    /**
     * Lines mode options.
     *
     * @typedef LinesModeOptions
     *
     * @property {boolean} multibond - Flag, that toggles rendering of multiple ordered bonds.
     * @property {boolean} showarom - Flag, that toggles rendering of aromatic loops.
     * @property {number} offsarom - Offset between bonds and aromatic cycle.
     * @property {number} chunkarom - Number of pieces in a-loop arc, corresponding to atom.
     * @property {number} atom - Collision radius for atoms picking.
     * @property {number} lineWidth - Line width in pixels (not used in thin lines).
     */
    LN: {
      multibond: true,
      showarom: true,
      offsarom: 0.2,
      chunkarom: 10,
      atom: 0.23,
      lineWidth: 2,
    },

    //----------------------------------------------------------------------------
    // LICORICE
    //----------------------------------------------------------------------------

    /**
     * Licorice mode options.
     *
     * @typedef LicoriceModeOptions
     *
     * @property {number} bond - Bond cylinder radius.
     * @property {number} space - Fraction of the space around one cylinder. Zero means that cylinder fills all
     *   available space.
     * @property {boolean} multibond - Flag, that toggles rendering of multiple ordered bonds.
     * @property {number} aromrad - Minor radius of a torus for aromatic loops.
     * @property {boolean} showarom - Flag, that toggles rendering of aromatic loops.
     * @property {PolyComplexity} polyComplexity - Poly complexity values for render modes.
     */
    LC: {
      bond: 0.20,
      space: 0.0,
      multibond: true,
      aromrad: 0.1,
      showarom: true,
      polyComplexity: {
        poor: 3,
        low: 4,
        medium: 6,
        high: 12,
        ultra: 32,
      },
    },

    //----------------------------------------------------------------------------
    // SURFACE SAS
    //----------------------------------------------------------------------------

    /**
     * Solvent Accessible Surface mode options.
     *
     * @typedef IsoSurfaceSASModeOptions
     *
     * @property {boolean} zClip - Flag, that toggles z-clipping.
     * @property {number} probeRadius - Radius of the probe.
     * @property {string} subset - Only parts of surface close to selected atoms will be visible.
     *   Empty string means whole surface is visible.
     * @property {boolean} wireframe - Flag that specifies whether or not surface rendered in wireframe mode.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     */
    SA: {
      zClip: false,
      probeRadius: 1.5,
      subset: '',
      wireframe: false,
      polyComplexity: {
        poor: 6,
        low: 8,
        medium: 16,
        high: 30,
        ultra: 60,
      },
    },

    //----------------------------------------------------------------------------
    // SURFACE SES
    //----------------------------------------------------------------------------

    /**
     * Solvent Excluded Surface mode options.
     *
     * @typedef IsoSurfaceSESModeOptions
     *
     * @property {boolean} zClip - Flag, that toggles z-clipping.
     * @property {number} probeRadius - Radius of the probe.
     * @property {string} subset - Only parts of surface close to selected atoms will be visible.
     *   Empty string means whole surface is visible.
     * @property {boolean} wireframe - Flag that specifies whether or not surface rendered in wireframe mode.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     */
    SE: {
      zClip: false,
      probeRadius: 1.5,
      subset: '',
      wireframe: false,
      polyComplexity: {
        poor: 6,
        low: 8,
        medium: 16,
        high: 30,
        ultra: 60,
      },
    },

    //----------------------------------------------------------------------------
    // QUICK SURFACE
    //----------------------------------------------------------------------------

    /**
     * Quick Surface mode options.
     *
     * @typedef QuickSurfaceModeOptions
     *
     * @property {number} isoValue - Isovalue of the surface to extract.
     * @property {number} scale - Radius scale for the surface being built.
     * @property {boolean} zClip - Flag, that toggles z-clipping.
     * @property {string} subset - Only parts of surface close to selected atoms will be visible.
     *   Empty string means whole surface is visible.
     * @property {boolean} wireframe - Flag that specifies whether or not surface rendered in wireframe mode.
     * @property {PolyComplexity} gaussLim - Gauss lim for coloring the bigger the value, the smoother our colors are.
     * @property {PolyComplexity} gridSpacing - Poly complexity values for render modes. In this case the value
     *   corresponds to the grid density.
     */
    QS: {
      isoValue: 0.5,
      gaussLim: {
        poor: 1.5,
        low: 2.0,
        medium: 2.5,
        high: 3.0,
        ultra: 4.0,
      },
      scale: 1.0,
      wireframe: false,
      gridSpacing: {
        poor: 2,
        low: 1.5,
        medium: 1,
        high: 0.5,
        ultra: 0.25,
      },
      subset: '',
      zClip: false,
    },

    //----------------------------------------------------------------------------
    // CONTACT SURFACE
    //----------------------------------------------------------------------------

    /**
     * Contact Surface mode options.
     *
     * @typedef ContactSurfaceModeOptions
     *
     * @property {number} isoValue - Isovalue of the surface to extract.
     * @property {number} probeRadius - Probe radius.
     * @property {number} probePositions
     * @property {boolean} zClip - Flag, that toggles z-clipping.
     * @property {string} subset - Only parts of surface close to selected atoms will be visible.
     *   Empty string means whole surface is visible.
     * @property {boolean} wireframe - Flag that specifies whether or not surface rendered in wireframe mode.
     * @property {PolyComplexity} polyComplexity - Radius scale for the surface being built.
     *   Poly complexity values for render modes. In this case the value corresponds to the grid density.
     */
    CS: {
      probeRadius: 1.4,
      isoValue: 1.5,
      wireframe: false,
      probePositions: 30,
      polyComplexity: {
        poor: 0.5,
        low: 1.0,
        medium: 1.5,
        high: 1.75,
        ultra: 2.0,
      },
      subset: '',
      zClip: false,
    },

    //----------------------------------------------------------------------------
    // TRACE
    //----------------------------------------------------------------------------

    /**
     * Trace mode options.
     *
     * @typedef TraceModeOptions
     *
     * @property {number} radius - Cylinder radius.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     */
    TR: {
      radius: 0.30,
      polyComplexity: {
        poor: 12,
        low: 16,
        medium: 32,
        high: 64,
        ultra: 64,
      },
    },

    //----------------------------------------------------------------------------
    // TUBE
    //----------------------------------------------------------------------------

    /**
     * Tube mode options.
     *
     * @typedef TubeModeOptions
     *
     * @property {number} radius - Cylinder radius.
     * @property {number} tension - Tension for interpolation.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     * @property {number} heightSegmentsRatio - Poly complexity multiplier for height segments.
     */
    TU: {
      radius: 0.30,
      heightSegmentsRatio: 1.5,
      tension: -0.7,
      polyComplexity: {
        poor: 4,
        low: 6,
        medium: 10,
        high: 18,
        ultra: 34,
      },
    },

    //----------------------------------------------------------------------------
    // CARTOON
    //----------------------------------------------------------------------------

    /**
     * Cartoon mode options.
     *
     * @typedef CartoonModeOptions
     *
     * @property {number} radius - Standard tube radius.
     * @property {number} depth - Height of the secondary structure ribbon.
     * @property {number} tension - Tension for interpolation.
     * @proprety {object} ss - Secondary structure parameters.
     * @proprety {object} ss.helix - Options for helices render.
     * @proprety {number} ss.helix.width - Width of the secondary structure ribbon.
     * @proprety {number} ss.helix.arrow - Secondary structure's arrow width.
     * @proprety {object} ss.strand - Options for strands render.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     * polyComplexity must be even for producing symmetric arrows.
     * @property {number} heightSegmentsRatio - Poly complexity multiplier for height segments.
     */
    CA: {
      radius: 0.30,
      depth: 0.25,
      ss: {
        helix: {
          width: 1.0,
          arrow: 2.0,
        },
        strand: {
          width: 1.0,
          arrow: 2.0,
        },
      },
      heightSegmentsRatio: 1.5,
      tension: -0.7,
      polyComplexity: {
        poor: 4,
        low: 6,
        medium: 10,
        high: 18,
        ultra: 34,
      },
    },

    //----------------------------------------------------------------------------
    // TEXT
    //----------------------------------------------------------------------------

    /**
     * Text mode options.
     *
     * @typedef TextModeOptions
     *
     * @property {string} template - Format string for building output text.
     * @property {string} horizontalAlign - Text alignment ('left', 'right', 'center').
     * @property {string} verticalAlign - Vertical text box alignment ('top', 'bottom', 'middle').
     * @property {number} dx - Text offset x in angstroms.
     * @property {number} dy - Text offset y in angstroms.
     * @property {number} dz - Text offset z in angstroms.
     * @property {string} fg - Color rule for foreground.
     * @property {string} bg - Color rule for background.
     * @property {boolean} showBg - Flag, that toggles background rendering.
     *
     */
    TX: {
      template: '{{Chain}}.{{Residue}}{{Sequence}}.{{Name}}',
      horizontalAlign: 'center',
      verticalAlign: 'middle',
      dx: 0,
      dy: 0,
      dz: 1,
      fg: 'none',
      bg: '0x202020',
      showBg: true,
    },

    //----------------------------------------------------------------------------
    // VOLUME DENSITY
    //----------------------------------------------------------------------------

    /**
     * Volume density mode options.
     *
     * @typedef VolumeDensityModeOptions
     *
     * @property {number} kSigma - Noise threshold coefficient.
     * @property {boolean} frame - flag, that turns on box frame painting.
     * @property {boolean} isoMode - flag, that turns on IsoSurface mode instead of Volume Rendering.
     * @property {PolyComplexity} polyComplexity - Polygonal complexity settings for different resolutions.
     */
    VD: {
      kSigma: 1.0,
      kSigmaMed: 2.0,
      kSigmaMax: 4.0,
      frame: true,
      isoMode: false,
      polyComplexity: {
        poor: 2,
        low: 3,
        medium: 4,
        high: 8,
        ultra: 10,
      },
    },
  },

  /**
   * Default options for all available colorers.
   * Use {@link Colorer.id} as a dictionary key to access colorer options.
   *
   * Usually you don't need to override these settings. You may specify colorer options as a parameter during
   * {@link Colorer} construction.
   *
   * Not all colorers have options.
   *
   * @memberof SettingsObject#
   * @type {Object.<string, object>}
   *
   * @property {ElementColorerOptions} EL - Element colorer options.
   * @property {SequenceColorerOptions} SQ - Sequence colorer options.
   * @property {MoleculeColorerOptions} MO - Molecule colorer options.
   * @property {UniformColorerOptions} UN - Uniform colorer options.
   * @property {ConditionalColorerOptions} CO - Conditional colorer options.
   * @property {TemperatureColorerOptions} TM - Temperature colorer options.
   * @property {OccupancyColorerOptions} OC - Occupancy colorer options.
   * @property {HydrophobicityColorerOptions} HY - Hydrophobicity colorer options.
   */
  colorers: {
    /**
     * Element colorer options.
     *
     * @typedef ElementColorerOptions
     *
     * @property {number} carbon - Carbon color or -1 to use default.
     */
    EL: {
      carbon: -1,
    },

    /**
     * Uniform colorer options.
     *
     * @typedef UniformColorerOptions
     *
     * @property {number} color - Single color to paint with.
     */
    UN: {
      color: 0xFFFFFF,
    },

    /**
     * Conditional colorer options.
     *
     * @typedef ConditionalColorerOptions
     *
     * @property {string} subset - Selector string.
     * @property {number} color - Color of selected atoms.
     * @property {number} baseColor - Color of other atoms.
     */
    CO: {
      subset: 'charged',
      color: 0xFF0000,
      baseColor: 0xFFFFFF,
    },

    /**
     * Carbon colorer options.
     *
     * @typedef CarbonColorerOptions
     *
     * @property {number} color - Single color to paint carbons
     * @property {number} factor - Color factor for not carbon atoms.
     */
    CB: {
      color: 0x909090,
      factor: 0.6,
    },

    /**
     * Sequence colorer options.
     *
     * @typedef SequenceColorerOptions
     *
     * @property {string} gradient - Name of gradient to use.
     */
    SQ: {
      gradient: 'rainbow',
    },

    /**
     * Temperature colorer options.
     *
     * @typedef TemperatureColorerOptions
     *
     * @property {string} gradient - Name of gradient to use.
     * @property {number} min - Minimal temperature.
     * @property {number} max - Maximal temperature.
     */
    TM: {
      gradient: 'temp',
      min: 5,
      max: 40,
    },

    /**
     * Occupancy colorer options.
     *
     * @typedef OccupancyColorerOptions
     *
     * @property {string} gradient - Name of gradient to use.
     */
    OC: {
      gradient: 'reds',
    },

    /**
     * Hydrophobicity colorer options.
     *
     * @typedef HydrophobicityColorerOptions
     *
     * @property {string} gradient - Name of gradient to use.
     */
    HY: {
      gradient: 'blue-red',
    },

    /**
     * Molecule colorer options.
     *
     * @typedef MoleculeColorerOptions
     *
     * @property {string} gradient - Name of gradient to use.
     */
    MO: {
      gradient: 'rainbow',
    },
  },

  /*
   * Use antialiasing in WebGL.
   * @type {boolean}
   */
  antialias: true,

  /*
   * Camera field of view in degrees.
   * @type {number}
   */
  camFov: 45.0,

  /*
   * Camera near plane distance.
   * @type {number}
   */
  camNear: 0.5,

  /*
   * Camera far plane distance.
   * @type {number}
   */
  camFar: 100.0,

  camDistance: 2.5,

  radiusToFit: 1.0,

  /**
   * @type {number}
   * @instance
   */
  fogNearFactor: 0.5, // [0, 1]

  /**
   * @type {number}
   * @instance
   */
  fogFarFactor: 1, // [0, 1]
  fogAlpha: 1.0,
  fogColor: 0x000000,
  fogColorEnable: false,

  /**
   * Palette used for molecule coloring.
   * @type {string}
   */
  palette: 'JM',

  /*
   * Geometry resolution.
   * @type {string}
   */
  resolution: 'medium',

  autoResolution: false/* true */,

  autoPreset: true,

  preset: 'default', // TODO: remove 'preset' from settings, implement autodetection

  presets: {
    // Default
    default: [{
      mode: 'BS',
      colorer: 'EL',
      selector: 'all',
      material: 'SF',
    }],

    empty: [],

    // Wireframe
    wire: [{
      mode: 'LN',
      colorer: 'EL',
      selector: 'all',
      material: 'SF',
    }],

    // Small molecules
    small: [{
      mode: 'BS',
      colorer: 'EL',
      selector: 'all',
      material: 'SF',
    }],

    // Proteins, nucleic acids etc.
    macro: [{
      mode: 'CA',
      colorer: 'SS',
      selector: 'not hetatm',
      material: 'SF',
    }, {
      mode: 'BS',
      colorer: 'EL',
      selector: 'hetatm and not water',
      material: 'SF',
    }],
  },

  objects: {
    line: {
      color: 0xFFFFFFFF,
      dashSize: 0.3,
      gapSize: 0.05,
    },
  },

  //----------------------------------------------------------------------------

  bg: {
    color: 0x202020,
    transparent: false,
  },

  draft: {
    clipPlane: false,
    clipPlaneFactor: 0.5,
    clipPlaneSpeed: 0.00003,
  },

  /*
     * Separate group for plugins.
     * Each plugin handles its field by itself.
     */
  plugins: {

  },

  /**
   * @type {boolean}
   * @instance
   */
  axes: true,

  /**
   * @type {boolean}
   * @instance
   */
  fog: true,

  /**
   * @type {boolean}
   * @instance
   */
  fps: true,

  /**
   * Switch using of z-sprites for sphere and cylinder geometry
   * @type {boolean}
   * @instance
   */
  zSprites: true,

  isoSurfaceFakeOpacity: true,

  /**
   * @type {boolean}
   * @instance
   */
  suspendRender: true,

  nowater: false,

  /**
   * @type {boolean}
   * @instance
   */
  autobuild: true,

  /**
   * Anti-aliasing.
   * @type {boolean}
   * @instance
   */
  fxaa: true,
  /**
   * Outline depths
   * @type {boolean}
   * @instance
   */
  outline: {
    on: false,
    color: 0x000000,
    threshold: 0.1,
    thickness: 1,
  },

  /**
   * Ambient Occlusion special effect.
   * @type {boolean}
   * @instance
   */
  ao: false,

  /**
   * Shadows options.
   *
   * @property {boolean} shadowMap - enable/disable.
   * @property {string} basic/percentage-closer filtering/non-uniform randomizing pcf.
   * @property {number} radius for percentage-closer filtering.
   */
  shadow: {
    on: false,
    type: 'random'/* basic, pcf, random */,
    radius: 1.0,
  },

  /**
   * Auto-rotation with constant speed.
   * @type {number}
   * @instance
   */
  autoRotation: 0.0,

  /**
   * Set maximum fps for animation.
   * @type {number}
   * @instance
   */
  maxfps: 30,

  /**
   * Set fbx output precision.
   * @type {number}
   * @instance
   */
  fbxprec: 4,

  /**
   * Auto-rotation axis.
   *
   * - true:  complex auto-rotation is about vertical axis
   * - false: rotation axis is defined by last user rotation
   *
   * @type {boolean}
   * @instance
   */
  autoRotationAxisFixed: true,

  /**
   * Enable zooming with mouse wheel or pinch gesture.
   * @type {boolean}
   * @instance
   */
  zooming: true,

  /**
   * Enable picking atoms & residues with left mouse button or touch.
   * @type {boolean}
   * @instance
   */
  picking: true,

  /**
   * Set picking mode ('atom', 'residue', 'chain', 'molecule').
   * @type {string}
   * @instance
   */
  pick: 'atom',

  /**
   * Make "component" and "fragment" editing modes available.
   * @type {boolean}
   * @instance
   */
  editing: false,

  /**
   * Detect aromatic loops.
   * @type {boolean}
   * @instance
   */
  aromatic: false,

  /**
   * Load only one biological unit from all those described in PDB file.
   * @type {boolean}
   * @instance
   */
  singleUnit: true,

  /**
   * Set stereo mode ('NONE', 'SIMPLE', 'DISTORTED', 'ANAGLYPH', 'WEBVR').
   * @type {string}
   * @instance
   */
  stereo: 'NONE',

  /**
   * Enable smooth transition between views
   * @type {boolean}
   * @instance
   */
  interpolateViews: true,

  /**
   * Set transparency mode ('standard', 'prepass').
   * @type {string}
   * @instance
   */
  transparency: 'prepass',

  /**
   * Mouse translation speed.
   * @type {number}
   * @instance
   */
  translationSpeed: 2,

  debug: {
    example: 3.5,
    text: 'hello!',
    good: true,
    ssaoKernelRadius: 0.7,
    ssaoFactor: 0.7,
    stereoBarrel: 0.25,
  },
  use: {
    multiFile: false,
  },
};

//----------------------------------------------------------------------------
// SETTINGS CLASS
//----------------------------------------------------------------------------

function Settings() {
  EventDispatcher.call(this);

  this.old = null;
  this.now = {};
  this._changed = {};

  this.reset();
}

utils.deriveClass(Settings, EventDispatcher, {
  defaults,

  set(path, value) {
    if (_.isString(path)) {
      const oldValue = _.get(this.now, path);
      if (oldValue !== value) {
        _.set(this.now, path, value);
        this._notifyChange(path, value);
      }
    } else {
      const diff = utils.objectsDiff(path, this.now);
      if (!_.isEmpty(diff)) {
        _.merge(this.now, diff);
        this._notifyChanges(diff);
      }
    }
  },

  get(path, defaultValue) {
    return _.get(this.now, path, defaultValue);
  },

  reset() {
    const diff = utils.objectsDiff(defaults, this.now);
    this.now = _.cloneDeep(defaults);
    this.old = null;
    this._notifyChanges(diff);
    this._changed = {};
  },

  checkpoint() {
    this.old = _.cloneDeep(this.now);
    this._changed = {};
  },

  _notifyChange(path, value) {
    this._changed[path] = true;
    this.dispatchEvent({ type: `change:${path}`, value });
  },

  _notifyChanges(diff) {
    utils.forInRecursive(diff, (deepValue, deepPath) => {
      this._notifyChange(deepPath, deepValue);
    });
  },

  changed() {
    if (!this.old) {
      return [];
    }
    const { old, now } = this;
    const keys = _.filter(Object.keys(this._changed), (key) => _.get(old, key) !== _.get(now, key));
    return keys;
  },

  applyDiffs(diffs) {
    if (diffs.hasOwnProperty('VERSION') && diffs.VERSION !== VERSION) {
      throw new Error('Settings version does not match!');
    }
    // VERSION shouldn't be presented inside settings structure
    delete diffs.VERSION;
    this.reset();
    this.set(diffs);
  },

  getDiffs(versioned) {
    const diffs = utils.objectsDiff(this.now, defaults);
    if (versioned) {
      diffs.VERSION = VERSION;
    }
    return diffs;
  },

  setPluginOpts(plugin, opts) {
    defaults.plugins[plugin] = _.cloneDeep(opts);
    this.now.plugins[plugin] = _.cloneDeep(opts);
  },
});

export default new Settings();
