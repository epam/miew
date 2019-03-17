/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad_vert.glsl';
import fragmentShader from './FXAA_frag.glsl';

const defaultUniforms = THREE.UniformsUtils.merge([
  {
    srcTex: { type: 't', value: null },
    srcTexelSize: { type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0) },
    bgColor: { type: 'c', value: new THREE.Color(0xffffff) },
  },
]);

function FXAAMaterial(params) {
  THREE.ShaderMaterial.call(this);
  this.bgTransparent = false;

  // TODO RawShaderMaterial? Why we use ShaderMaterial now ?
  // set default values
  THREE.ShaderMaterial.prototype.setValues.call(this, {
    uniforms: THREE.UniformsUtils.clone(defaultUniforms),
    vertexShader, // TODO make texccord fo samples calculated in VS to reduce PS
    fragmentShader,
    transparent: false,
    depthTest: false,
    depthWrite: false,
  });

  this.setValues(params);
}

FXAAMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
FXAAMaterial.prototype.constructor = FXAAMaterial;

FXAAMaterial.prototype.setValues = function (values) {
  if (typeof values === 'undefined') {
    return;
  }

  // set direct values
  THREE.ShaderMaterial.prototype.setValues.call(this, values);

  const defines = {};

  if (this.bgTransparent) {
    defines.BG_TRANSPARENT = 1;
  }
  // set dependent values
  this.defines = defines;
};

export default FXAAMaterial;
