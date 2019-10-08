/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexShader from './ScreenQuad.vert';
import fragmentShader from './AOVertBlurWithBlend.frag';

const _kernelOffsets = [-2.0, -1.0, 0.0, 1.0, 2.0];

class AOVertBlurWithBlendMaterial extends THREE.RawShaderMaterial {
  constructor(params) {
    super(params);

    // set default values
    this.setValues.call(this, {
      uniforms: {
        diffuseTexture: { type: 't', value: null },
        depthTexture: { type: 't', value: null },
        srcTexelSize: { type: 'v2', value: new THREE.Vector2(1.0 / 512.0, 1.0 / 512.0) },
        aoMap: { type: 't', value: null },
        samplesOffsets: { type: 'fv1', value: _kernelOffsets },
        projMatrix: { type: 'mat4', value: new THREE.Matrix4() },
        aspectRatio: { type: 'f', value: 0.0 },
        tanHalfFOV: { type: 'f', value: 0.0 },
        fogNearFar: { type: 'v2', value: new THREE.Vector2(100.0, 100.0) },
        fogColor: { type: 'v4', value: new THREE.Vector4(0.0, 0.5, 0.0, 1.0) },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false,
    });

    this.setValues(params);
  }

  setValues(values) {
    if (typeof values === 'undefined') {
      return;
    }

    // set direct values
    super.setValues(values);

    const defines = {};

    if (this.useFog) {
      defines.USE_FOG = 1;
    }
    if (this.fogTransparent) {
      defines.FOG_TRANSPARENT = 1;
    }
    // set dependent values
    this.defines = defines;
  }
}

AOVertBlurWithBlendMaterial.prototype.useFog = true;
AOVertBlurWithBlendMaterial.prototype.fogTransparent = false;

export default AOVertBlurWithBlendMaterial;
