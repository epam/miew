/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */

import vertexShader from './ScreenQuad.vert'
import fragmentShader from './AOHorBlur.frag'
import { RawShaderMaterial, Vector2 } from 'three'

const _kernelOffsets = [-2.0, -1.0, 0.0, 1.0, 2.0]

class AOHorBlurMaterial extends RawShaderMaterial {
  constructor() {
    super()

    // set default values
    this.setValues({
      uniforms: {
        depthTexture: { type: 't', value: null },
        srcTexelSize: {
          type: 'v2',
          value: new Vector2(1.0 / 512.0, 1.0 / 512.0)
        },
        aoMap: { type: 't', value: null },
        samplesOffsets: { type: 'fv1', value: _kernelOffsets }
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false
    })
  }
}

export default AOHorBlurMaterial
