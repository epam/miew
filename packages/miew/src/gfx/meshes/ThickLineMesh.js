import UberObject from './UberObject'
import { Mesh, Vector2 } from 'three'

const OurMesh = UberObject(Mesh)
const _viewport = new Vector2()

class ThickLineMesh extends OurMesh {
  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    const { material } = this
    if (!material.uberOptions) {
      return
    }

    material.uberOptions.projMatrixInv.copy(camera.projectionMatrix).invert()
    renderer.getSize(_viewport)
    material.uberOptions.viewport.set(_viewport.width, _viewport.height)
  }
}

export default ThickLineMesh
