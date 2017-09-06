

/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexScreenQuadShader from './ScreenQuad_vert.glsl';
import fragmentSSAOShader from './AO_frag.glsl';
import fragmentHorBilateralBlur5Shader from './AOHBlur_frag.glsl';
import fragmentVertBilateralBlur5Shader from './AOVBlur_frag.glsl';
var SSAOUniforms = THREE.UniformsUtils.merge([
  {
    noiseTexture:   {type: 't', value: null},
    noiseTexelSize: {type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0)}, // FIXME calc uvs in vshader
    diffuseTexture: {type: 't', value: null},
    depthTexture:   {type: 't', value: null},
    srcTexelSize:   {type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0)},
    camNearFar:     {type: 'v2', value: new THREE.Vector2(1.0, 10.0)},
    projMatrix:     {type: 'mat4', value: new THREE.Matrix4()},
    aspectRatio:    {type: 'f', value: 0.0},
    tanHalfFOV:     {type: 'f', value: 0.0},
    samplesKernel:  {type: 'v3v', value: null},
    kernelRadius:   {type: 'f', value: 1.0},
    depthThreshold: {type: 'f', value: 1.0},
    factor:         {type: 'f', value: 1.0},
    fogNearFar:     {type: 'v2', value: new THREE.Vector2(100.0, 100.0)},
  }
]);

var blurUniforms5 = THREE.UniformsUtils.merge([
  {
    diffuseTexture: {type: 't', value: null},
    depthTexture:   {type: 't', value: null},
    srcTexelSize:   {type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0)},
    aoMap:          {type: 't', value: null},
    samplesOffsets: {type: 'fv1', value: null},
    camNearFar:     {type: 'v2', value: new THREE.Vector2(1.0, 10.0)},
    projMatrix:     {type: 'mat4', value: new THREE.Matrix4()},
    aspectRatio:    {type: 'f', value: 0.0},
    tanHalfFOV:     {type: 'f', value: 0.0}
  }
]);

function overrideUniforms(params, defUniforms) {
  var uniforms = THREE.UniformsUtils.clone(defUniforms);
  for (var p in params) {
    if (uniforms.hasOwnProperty(p)) {
      uniforms[p].value = params[p];
    }
  }
  return uniforms;
}

function AOMaterial(params) {
  var settings = {
    uniforms : overrideUniforms(params, SSAOUniforms),
    vertexShader: vertexScreenQuadShader,
    fragmentShader: fragmentSSAOShader,
    transparent: false,
    depthTest: false,
    depthWrite: false
  };
  return new THREE.ShaderMaterial(settings);
}

function HorBilateralBlurMaterial5(params) {
  var settings = {
    uniforms : overrideUniforms(params, blurUniforms5),
    vertexShader: vertexScreenQuadShader,
    fragmentShader: fragmentHorBilateralBlur5Shader,
    transparent: false,
    depthTest: false,
    depthWrite: false
  };
  return new THREE.ShaderMaterial(settings);
}

function VertBilateralBlurMaterial5(params) {
  var settings = {
    uniforms : overrideUniforms(params, blurUniforms5),
    vertexShader: vertexScreenQuadShader,
    fragmentShader: fragmentVertBilateralBlur5Shader,
    transparent: false,
    depthTest: false,
    depthWrite: false
  };
  return new THREE.ShaderMaterial(settings);
}

export default {
  AOMaterial: AOMaterial,
  HorBilateralBlurMaterial: HorBilateralBlurMaterial5,
  VertBilateralBlurMaterial: VertBilateralBlurMaterial5
};

