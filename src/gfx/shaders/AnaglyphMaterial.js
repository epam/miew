

/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad_vert.glsl';
import fragmentShader from './Anaglyph_frag.glsl';

var defaultUniforms = THREE.UniformsUtils.merge([
  {
    srcL:     {type: 't', value: null},
    srcR:     {type: 't', value: null},
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

function AnaglyphMaterial(params) {
  var settings = {
    uniforms : overrideUniforms(params),
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: false,
    depthTest: false,
    depthWrite: false
  };
  return new THREE.ShaderMaterial(settings);
}

export default AnaglyphMaterial;

