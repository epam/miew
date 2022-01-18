import UberObject from './UberObject'
import { Matrix4, Mesh, Vector3 } from 'three'

const OurMesh = UberObject(Mesh)

class ZClippedMesh extends OurMesh {
  constructor(geometry, material) {
    super(geometry, material)
    this.castShadow = true
    this.receiveShadow = true
  }

  static _mvLength = new Vector3()

  static _center = new Vector3()

  static _modelView = new Matrix4()

  _onBeforeRender(renderer, scene, camera) {
    OurMesh.prototype._onBeforeRender.call(this, renderer, scene, camera)

    const geo = this.geometry
    const { material } = this
    if (!geo.zClip || !material.uberOptions) {
      return
    }

    const zClipCoef = 0.5

    const modelView = ZClippedMesh._modelView
    const mvLength = ZClippedMesh._mvLength
    const center = ZClippedMesh._center

    modelView.multiplyMatrices(this.matrixWorld, camera.matrixWorldInverse)
    const s = mvLength.setFromMatrixColumn(modelView, 0).length()
    center.copy(geo.boundingSphere.center)

    this.localToWorld(center)
    material.uberOptions.zClipValue =
      camera.position.z - center.z - s * (zClipCoef * geo.boundingSphere.radius)
  }
}

export default ZClippedMesh
