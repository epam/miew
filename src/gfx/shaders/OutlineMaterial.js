/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad.vert';
import fragmentShader from './Outline.frag';

class OutlineMaterial extends THREE.RawShaderMaterial {
  constructor(params) {
    // add depth outline
    super(params);

    const settings = {
      uniforms: {
        srcTex: { type: 't', value: null },
        srcDepthTex: { type: 't', value: null },
        srcTexSize: { type: 'v2', value: new THREE.Vector2(512, 512) },
        color: { type: 'v3', value: null },
        threshold: { type: 'f', value: null },
        opacity: { type: 'f', value: 1.0 },
        thickness: { type: 'v2', value: new THREE.Vector2(1, 1) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    };

    this.setValues(settings);
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

    if (this.depth) {
      defines.DEPTH_OUTLINE = 1;
    }

    // set dependent values
    this.defines = defines;
  }
}

OutlineMaterial.prototype.depth = false;

export default OutlineMaterial;
