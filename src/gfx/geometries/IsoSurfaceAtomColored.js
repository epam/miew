import * as THREE from 'three';

/**
 * Class for colored atom. Need for atom structure clusterization
 *
 * @param {Vector3} vCenter   Center of atom
 * @param {number}  radiusAt  Radius of atom
 */
class IsoSurfaceAtomColored {
  constructor(vCenter, radiusAt) {
    this.coord = new THREE.Vector3();
    this.coord.copy(vCenter);
    this.radius = radiusAt;
    this.colorX = 0.99999;
    this.colorY = 0.0;
    this.colorZ = 0.0;
    this.atomType = 0;
    this.srcAtom = null;
  }
}
export default IsoSurfaceAtomColored;
