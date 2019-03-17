/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad_vert.glsl';
import fragmentShader from './Anaglyph_frag.glsl';

const defaultUniforms = THREE.UniformsUtils.merge([
  {
    srcL: { type: 't', value: null },
    srcR: { type: 't', value: null },
  },
]);

function overrideUniforms(params) {
  const uniforms = THREE.UniformsUtils.clone(defaultUniforms);
  for (const p in params) {
    if (uniforms.hasOwnProperty(p)) {
      uniforms[p].value = params[p];
    }
  }
  return uniforms;
}

function AnaglyphMaterial(params) {
  const settings = {
    uniforms: overrideUniforms(params),
    vertexShader,
    fragmentShader,
    transparent: false,
    depthTest: false,
    depthWrite: false,
  };
  return new THREE.ShaderMaterial(settings);
}

export default AnaglyphMaterial;
