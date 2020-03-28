/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad.vert';
import fragmentShader from './FXAA.frag';

class FXAAMaterial extends THREE.RawShaderMaterial {
  constructor(params) {
    super(params);

    // set default values
    this.setValues.call(this, {
      uniforms: {
        srcTex: { type: 't', value: null },
        srcTexelSize: { type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0) },
        bgColor: { type: 'c', value: new THREE.Color(0xffffff) },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    });

    this.setValues(params);
  }

  copy(source) {
    super.copy(source);
    this.depth = source.depth;
  }

  setValues(values) {
    if (typeof values === 'undefined') {
      return;
    }

    // set direct values
    super.setValues(values);

    const defines = {};

    if (this.bgTransparent) {
      defines.BG_TRANSPARENT = 1;
    }
    // set dependent values
    this.defines = defines;
  }
}

FXAAMaterial.prototype.bgTransparent = false;

export default FXAAMaterial;
