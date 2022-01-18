import UberObject from './UberObject'
import { Mesh } from 'three'

const OurMesh = UberObject(Mesh)

class ZSpriteMesh extends OurMesh {
  constructor(...rest) {
    super(...rest)
    this.castShadow = true
    this.receiveShadow = true
  }

  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    OurMesh.prototype._onBeforeRender.call(this, renderer, scene, camera)
    const { material } = this
    if (!material) {
      return
    }

    if (material.uniforms.invModelViewMatrix) {
      // NOTE: update of modelViewMatrix inside threejs is done after onBeforeRender call,
      // so we have to do it manually in that place
      this.modelViewMatrix.multiplyMatrices(
        camera.matrixWorldInverse,
        this.matrixWorld
      )
      // get inverse matrix
      material.uniforms.invModelViewMatrix.value
        .copy(this.modelViewMatrix)
        .invert()
      material.uniforms.nearPlaneValue.value = camera.near
      material.uniformsNeedUpdate = true
    }
  }
}

export default ZSpriteMesh
