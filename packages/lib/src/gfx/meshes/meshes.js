import UberObject from './UberObject'
import ZSpriteMesh from './ZSpriteMesh'
import ZClippedMesh from './ZClippedMesh'
import TextMesh from './TextMesh'
import SimpleMesh from './SimpleMesh'
import ThickLineMesh from './ThickLineMesh'
import InstancedMesh from './InstancedMesh'
import { Line, LineSegments } from 'three'

export default {
  ZClipped: ZClippedMesh,
  ZSprite: ZSpriteMesh,
  Text: TextMesh,
  Line: UberObject(Line),
  LineSegments: UberObject(LineSegments),
  Mesh: SimpleMesh,
  ThickLineMesh,
  Instanced: InstancedMesh
}
