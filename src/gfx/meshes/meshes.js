

import * as THREE from 'three';
import UberObject from './UberObject';
import ZSpriteMesh from './ZSpriteMesh';
import ZClippedMesh from './ZClippedMesh';
import TextMesh from './TextMesh';
import ThickLineMesh from './ThickLineMesh';
export default {
  ZClipped: ZClippedMesh,
  ZSprite: ZSpriteMesh,
  Text: TextMesh,
  Line: UberObject(THREE.Line),
  LineSegments: UberObject(THREE.LineSegments),
  Mesh: UberObject(THREE.Mesh),
  ThickLineMesh: ThickLineMesh
};

