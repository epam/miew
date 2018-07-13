
/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad_vert.glsl';
import fragmentShader from './OutlineDepth_frag.glsl';

var defaultUniforms = THREE.UniformsUtils.merge([
  {
    srcTex:     {type: 't', value: null},
    srcDepthTex:     {type: 't', value: null},
    srcTexSize: {type: 'v2', value: new THREE.Vector2(512, 512)},
    color: {type: 'v3', value: null},
    saturation: {type: 'f', value: null},
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
/*Is the same as OutlineMaterial, instead of color uses depth*/
/*TODO remakes as one*/
function OutlineMaterial(params) {
  var settings = {
    uniforms : overrideUniforms(params),
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false
  };
  return new THREE.ShaderMaterial(settings);
}

export default OutlineMaterial;

