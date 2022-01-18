/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */

import vertexShader from './ScreenQuad.vert'
import fragmentShader from './AO.frag'
import noise from '../noiseTexture'
import { Matrix4, RawShaderMaterial, Vector2, Vector3 } from 'three'

const _samplesKernel = [
  // hemisphere samples adopted to sphere
  new Vector3(0.295184, 0.077723, 0.068429),
  new Vector3(-0.271976, -0.365221, 0.838363),
  new Vector3(0.547713, 0.467576, 0.488515),
  new Vector3(0.662808, -0.031733, 0.584758),
  new Vector3(-0.025717, 0.218955, 0.657094),
  new Vector3(-0.310153, -0.365223, 0.370701),
  new Vector3(-0.101407, -0.006313, 0.747665),
  new Vector3(-0.769138, 0.360399, 0.086847),
  new Vector3(-0.271988, -0.27514, 0.905353),
  new Vector3(0.09674, -0.566901, 0.700151),
  new Vector3(0.562872, -0.735136, 0.094647),
  new Vector3(0.379877, 0.359278, 0.190061),
  new Vector3(0.519064, -0.023055, 0.405068),
  new Vector3(-0.301036, 0.114696, 0.088885),
  new Vector3(-0.282922, 0.598305, 0.487214),
  new Vector3(-0.181859, 0.25167, 0.679702),
  new Vector3(-0.191463, -0.635818, 0.512919),
  new Vector3(-0.293655, 0.427423, 0.078921),
  new Vector3(-0.267983, 0.680534, 0.13288),
  new Vector3(0.139611, 0.319637, 0.477439),
  new Vector3(-0.352086, 0.31104, 0.653913),
  new Vector3(0.321032, 0.805279, 0.487345),
  new Vector3(0.073516, 0.820734, 0.414183),
  new Vector3(-0.155324, 0.589983, 0.41146),
  new Vector3(0.335976, 0.170782, 0.527627),
  new Vector3(0.46346, -0.355658, 0.167689),
  new Vector3(0.222654, 0.59655, 0.769406),
  new Vector3(0.922138, -0.04207, 0.147555),
  new Vector3(-0.72705, -0.329192, 0.369826),
  new Vector3(-0.090731, 0.53382, 0.463767),
  new Vector3(-0.323457, -0.876559, 0.238524),
  new Vector3(-0.663277, -0.372384, 0.342856)
]

class AOMaterial extends RawShaderMaterial {
  constructor() {
    super()

    // set default values
    this.setValues({
      uniforms: {
        noiseTexture: { type: 't', value: noise.noiseTexture },
        noiseTexelSize: {
          type: 'v2',
          value: new Vector2(1.0 / noise.noiseWidth, 1.0 / noise.noiseHeight)
        },
        diffuseTexture: { type: 't', value: null },
        normalTexture: { type: 't', value: null },
        depthTexture: { type: 't', value: null },
        srcTexelSize: {
          type: 'v2',
          value: new Vector2(1.0 / 512.0, 1.0 / 512.0)
        },
        camNearFar: { type: 'v2', value: new Vector2(1.0, 10.0) },
        projMatrix: { type: 'mat4', value: new Matrix4() },
        aspectRatio: { type: 'f', value: 0.0 },
        tanHalfFOV: { type: 'f', value: 0.0 },
        samplesKernel: { type: 'v3v', value: _samplesKernel },
        kernelRadius: { type: 'f', value: 1.0 },
        depthThreshold: { type: 'f', value: 1.0 },
        factor: { type: 'f', value: 1.0 }
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      depthTest: false,
      depthWrite: false
    })
  }
}

export default AOMaterial
