import UberObject from './UberObject'
import { Mesh } from 'three'

const OurMesh = UberObject(Mesh)

class InstancedMesh extends OurMesh {
  constructor(...rest) {
    super(...rest)
    this.castShadow = true
    this.receiveShadow = true
  }
}

export default InstancedMesh
