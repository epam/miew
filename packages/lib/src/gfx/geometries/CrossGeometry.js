import * as THREE from 'three';
import ChunkedLinesGeometry from './ChunkedLinesGeometry';
import SphereCollisionGeo from './SphereCollisionGeo';

const vectors = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
];
const vecCount = vectors.length;
const tempPos1 = new THREE.Vector3();
const tempPos2 = new THREE.Vector3();

class CrossGeometry extends SphereCollisionGeo(ChunkedLinesGeometry) {
  constructor(chunksCount) {
    super(chunksCount, chunksCount, (vecCount / 2) | 0, false);
  }

  setItem(itemIdx, itemPos, itemRad) {
    this.setSphere(itemIdx, itemPos, itemRad);

    for (let i = 0; i < vecCount / 2; ++i) {
      const first = i * 2;
      tempPos1.x = itemPos.x + vectors[first].x * itemRad;
      tempPos1.y = itemPos.y + vectors[first].y * itemRad;
      tempPos1.z = itemPos.z + vectors[first].z * itemRad;
      const second = first + 1;
      tempPos2.x = itemPos.x + vectors[second].x * itemRad;
      tempPos2.y = itemPos.y + vectors[second].y * itemRad;
      tempPos2.z = itemPos.z + vectors[second].z * itemRad;
      this.setSegment(itemIdx, i, tempPos1, tempPos2);
    }
  }
}
export default CrossGeometry;
