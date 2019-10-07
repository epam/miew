/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad.vert';
import fragmentShader from './AOHorBlur.frag';

const _kernelOffsets = [-2.0, -1.0, 0.0, 1.0, 2.0];

class AOHorBlurMaterial extends THREE.RawShaderMaterial {
  constructor() {
    super();

    // set default values
    this.setValues.call(this, {
      uniforms: {
        depthTexture: { type: 't', value: null },
        srcTexelSize: { type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0) },
        aoMap: { type: 't', value: null },
        samplesOffsets: { type: 'fv1', value: _kernelOffsets },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    });
  }
}

export default AOHorBlurMaterial;
