/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */

import vertexShader from './ScreenQuad.vert'
import fragmentShader from './Anaglyph.frag'
import { RawShaderMaterial } from 'three'

class AnaglyphMaterial extends RawShaderMaterial {
  constructor() {
    super()
    const settings = {
      uniforms: {
        srcL: { type: 't', value: null },
        srcR: { type: 't', value: null }
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false
    }
    this.setValues(settings)
  }
}

export default AnaglyphMaterial
