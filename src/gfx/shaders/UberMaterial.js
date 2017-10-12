

/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './Uber_vert.glsl';
import fragmentShader from './Uber_frag.glsl';
import capabilities from './../capabilities';

//  var INSTANCED_SPRITE_OVERSCALE = 1.3;

var defaultUniforms = THREE.UniformsUtils.merge([

  THREE.UniformsLib.common, //FIXME is it needed
  THREE.UniformsLib.fog,
  THREE.UniformsLib.lights, //FIXME simplify use only directional

  {
    'specular' :  {type: 'c', value: new THREE.Color(0x111111)},
    'shininess':  {type: 'f', value: 30},
    'fixedColor': {type: 'c', value: new THREE.Color(0xffffff)},
    'zOffset':    {type: 'f', value: 0.0},
    'zClipValue': {type: 'f', value: 0.0},
    'clipPlaneValue': {type: 'f', value: 0.0},
    'invModelViewMatrix': {type: '4fv', value: new THREE.Matrix4()},
    'world2colorMatrix': {type: '4fv', value: new THREE.Matrix4()},
    'dashedLineSize': {type: 'f', value: 0.1},
    'dashedLinePeriod': {type: 'f', value: 0.2},
    'projMatrixInv': {type: '4fv', value: new THREE.Matrix4()},
    'viewport': {type: 'v2', value: new THREE.Vector2()},
    'lineWidth': {type: 'f', value: 2.0},
  }

]);

var uberOptionNames = [
  'shininess',
  'opacity',
  'zOffset',
  'diffuse',
  'specular',
  'fixedColor',
  'zClipCoef',
  'zClipValue',
  'clipPlaneValue',
  'world2colorMatrix',
  'dashedLineSize',
  'dashedLinePeriod',
  'projMatrixInv',
  'viewport',
  'lineWidth',
];

function UberMaterial(params) {
  THREE.RawShaderMaterial.call(this);

  // add fog
  this.fog = true;
  // used for instanced geometry
  this.instancedPos = false;
  this.instancedMatrix = false;
  // atoms and links color
  this.attrColor = false;
  // second link color for cylinders
  this.attrColor2 = false;
  //
  this.attrAlphaColor = false;
  // overrides color for all vertices (used in selection)
  this.overrideColor = false;
  // zsrpites
  this.sphereSprite = false;
  this.cylinderSprite = false;
  // clip Surfs individually
  this.zClip = false;
  // clip scene with global clip plane
  this.clipPlane = false;
  // enable fake (chess-like) opacity
  this.fakeOpacity = false;
  // render only depth, don't take care about the pixel color (used for transparency depth prepass)
  this.prepassTransparancy = false;
  // used to render pixel positions
  this.colorFromPos = false;
  // used to render dashed line
  this.dashedLine = false;
  // mark as transparent
  this.transparent = true;
  // mark as thick lines
  this.thickLine = false;

  // uber options of "root" materials are inherited from single uber-options object that resides in prototype
  this.uberOptions = Object.create(UberMaterial.prototype.uberOptions);

  // set default values
  THREE.RawShaderMaterial.prototype.setValues.call(this, {
    uniforms: THREE.UniformsUtils.clone(defaultUniforms),
    vertexShader: this.precisionString() + vertexShader,
    fragmentShader: this.precisionString() + fragmentShader,
    lights: true,
    fog: true,
    side: THREE.DoubleSide,
  });

  this.setValues(params);
}

UberMaterial.prototype = Object.create(THREE.RawShaderMaterial.prototype);
UberMaterial.prototype.constructor = UberMaterial;

UberMaterial.prototype.precisionString = function() {
  const precision = capabilities.precision;
  const str = 'precision ' + precision + ' float;\n' +
    'precision ' + precision + ' int;\n\n';
  return str;
};

// properties that convert to uniforms
UberMaterial.prototype.uberOptions = {
  diffuse: new THREE.Color(0xffffff), // used in phong lighting
  specular: new THREE.Color(0x111111), // used in phong lighting
  shininess: 30, // used in phong lighting
  opacity: 1, // set mesh opacity
  fixedColor: new THREE.Color(0xffffff), // color to override (see OVERRIDE_COLOR)
  zOffset: 0.0, // used fo zsprites (see SPHERE_SPRITE CYLINDER_SPRITE)
  zClipCoef: 2.0, // use for Surfs clipping (mesh param, isn't used in shader)  FIXME move to representation param
  zClipValue: 0.0, //  value to clip Surfs in shader  (see ZCLIP)
  clipPlaneValue: 0.0, // value to clip scene globally (see CLIPPLANE)
  world2colorMatrix: new THREE.Matrix4(),
  dashedLineSize: 0.1,
  dashedLinePeriod: 0.3,
  projMatrixInv: new THREE.Matrix4(),
  viewport: new THREE.Vector2(800, 600),
  lineWidth: 2.0,

  copy: function(source) {
    this.diffuse.copy(source.diffuse);
    this.specular.copy(source.specular);
    this.shininess = source.shininess;
    this.opacity = source.opacity;
    this.fixedColor.copy(source.fixedColor);
    this.zOffset = source.zOffset;
    this.zClipCoef = source.zClipCoef;
    this.zClipValue = source.zClipValue;
    this.clipPlaneValue = source.clipPlaneValue;
    this.world2colorMatrix.copy(source.world2colorMatrix);
    this.dashedLineSize = source.dashedLineSize;
    this.dashedLinePeriod = source.dashedLinePeriod;
    this.projMatrixInv = source.projMatrixInv;
    this.viewport = source.viewport;
    this.lineWidth = source.lineWidth; // used for thick lines only
  }
};

UberMaterial.prototype.copy = function(source) {

  THREE.ShaderMaterial.prototype.copy.call(this, source);

  this.fog = source.fog;
  this.instancedPos = source.instancedPos;
  this.instancedMatrix = source.instancedMatrix;
  this.attrColor = source.attrColor;
  this.attrColor2 = source.attrColor2;
  this.attrAlphaColor = source.attrAlphaColor;
  this.overrideColor = source.overrideColor;
  this.sphereSprite = source.sphereSprite;
  this.cylinderSprite = source.cylinderSprite;
  this.zClip = source.zClip;
  this.clipPlane = source.clipPlane;
  this.fakeOpacity = source.fakeOpacity;
  this.colorFromPos = source.colorFromPos;
  this.prepassTransparancy = source.prepassTransparancy;
  this.dashedLine = source.dashedLine;
  this.thickLine = source.thickLine;

  this.uberOptions.copy(source.uberOptions);

  return this;
};

// create copy of this material
// its options are prototyped after this material's options
UberMaterial.prototype.createInstance = function() {
  var inst = new UberMaterial();
  inst.copy(this);
  inst.uberOptions = Object.create(this.uberOptions);
  return inst;
};

UberMaterial.prototype.setValues = function(values) {
  if (typeof values === 'undefined') {
    return;
  }

  // set direct values
  THREE.RawShaderMaterial.prototype.setValues.call(this, values);

  var defines = {};
  var extensions = {};

  if (this.fog) {
    defines.USE_FOG = 1;
  }
  if (this.instancedPos) {
    defines.INSTANCED_POS = 1;
  }
  if (this.instancedMatrix) {
    defines.INSTANCED_MATRIX = 1;
  }
  if (this.attrColor) {
    defines.ATTR_COLOR = 1;
  }
  if (this.attrColor2) {
    defines.ATTR_COLOR2 = 1;
  }
  if (this.attrAlphaColor) {
    defines.ATTR_ALPHA_COLOR = 1;
  }
  if (this.overrideColor) {
    defines.OVERRIDE_COLOR = 1;
  }
  if (this.sphereSprite) {
    defines.SPHERE_SPRITE = 1;
    extensions.fragDepth = 1;
  }
  if (this.cylinderSprite) {
    defines.CYLINDER_SPRITE = 1;
    extensions.fragDepth = 1;
  }
  if (this.zClip) {
    defines.ZCLIP = 1;
  }
  if (this.clipPlane) {
    defines.CLIP_PLANE = 1;
  }
  if (this.fakeOpacity) {
    defines.FAKE_OPACITY = 1;
  }
  if (this.lights) {
    defines.USE_LIGHTS = 1;
  }
  if (this.colorFromPos) {
    defines.COLOR_FROM_POS = 1;
  }
  if (this.prepassTransparancy) {
    defines.PREPASS_TRANSP = 1;
  }
  if (this.dashedLine) {
    defines.DASHED_LINE = 1;
  }
  if (this.thickLine) {
    defines.THICK_LINE = 1;
  }
  // set dependent values
  this.defines = defines;
  this.extensions = extensions;
};

UberMaterial.prototype.setUberOptions = function(values) {
  if (typeof values === 'undefined') {
    return;
  }

  for (var key in values) {
    if (!values.hasOwnProperty(key)) {
      continue;
    }

    if (this.uberOptions[key] instanceof THREE.Color) {
      this.uberOptions[key] = values[key].clone();
    } else {
      this.uberOptions[key] = values[key];
    }
  }
};

UberMaterial.prototype.clone = function(shallow) {
  if (!shallow) {
    return THREE.Material.prototype.clone.call(this);
  }
  return this.createInstance();
};

UberMaterial.prototype.updateUniforms = function() {
  var self = this;

  uberOptionNames.forEach(function(p) {
    if (self.uniforms.hasOwnProperty(p)) {
      if (self.uberOptions[p] instanceof THREE.Color ||
            self.uberOptions[p] instanceof THREE.Matrix4) {
        self.uniforms[p].value = self.uberOptions[p].clone();
      } else {
        self.uniforms[p].value = self.uberOptions[p];
      }
    }
  });

  this.transparent = true;
};

export default UberMaterial;

