/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad_vert.glsl';
import fragmentShader from './Outline_frag.glsl';

var defaultUniforms = THREE.UniformsUtils.merge([
  {
    srcTex:     {type: 't', value: null},
    srcDepthTex:     {type: 't', value: null},
    srcTexSize: {type: 'v2', value: new THREE.Vector2(512, 512)},
    color: {type: 'v3', value: null},
    threshold: {type: 'f', value: null},
    opacity:    {type: 'f', value: 1.0}
  }
]);

function overrideUniforms(params) {
  var uniforms = THREE.UniformsUtils.clone(defaultUniforms);
  for (var p in params) {
    if (uniforms.hasOwnProperty(p)) {
      uniforms[p].value = params[p];
    }
  }
  return uniforms;
}

function OutlineMaterial(params) {
  THREE.ShaderMaterial.call(this);

  //add depth outline
  this.depth = false;

  var settings = {
    uniforms : overrideUniforms(params),
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false
  };

  THREE.ShaderMaterial.prototype.setValues.call(this, settings);
  this.setValues(params);
}

OutlineMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
OutlineMaterial.prototype.constructor = OutlineMaterial;

OutlineMaterial.prototype.copy = function(source) {
  THREE.ShaderMaterial.prototype.copy.call(this, source);
  this.depth = source.depth;
  return this;
};

OutlineMaterial.prototype.setValues = function(values) {
  if (typeof values === 'undefined') {
    return;
  }

  // set direct values
  THREE.ShaderMaterial.prototype.setValues.call(this, values);
  var defines = {};

  if (this.depth) {
    defines.DEPTH_OUTLINE = 1;
  }

  // set dependent values
  this.defines = defines;
};

export default OutlineMaterial;

