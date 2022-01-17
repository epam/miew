import UberObject from './UberObject'
import { Mesh } from 'three'

const OurMesh = UberObject(Mesh)

class SimpleMesh extends OurMesh {
  constructor(geometry, material) {
    super(geometry, material)
    this.castShadow = true
    this.receiveShadow = true
  }
}

export default SimpleMesh
