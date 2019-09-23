import * as THREE from 'three';
import UberObject from './UberObject';
import ZSpriteMesh from './ZSpriteMesh';
import ZClippedMesh from './ZClippedMesh';
import TextMesh from './TextMesh';
import SimpleMesh from './SimpleMesh';
import ThickLineMesh from './ThickLineMesh';
import InstancedMesh from './InstancedMesh';

export default {
  ZClipped: ZClippedMesh,
  ZSprite: ZSpriteMesh,
  Text: TextMesh,
  Line: UberObject(THREE.Line),
  LineSegments: UberObject(THREE.LineSegments),
  Mesh: SimpleMesh,
  ThickLineMesh,
  Instanced: InstancedMesh,
};
