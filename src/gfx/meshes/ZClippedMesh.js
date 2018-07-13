import * as THREE from 'three';
import UberObject from './UberObject';
const Mesh = UberObject(THREE.Mesh);

class ZClippedMesh extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);
  }

  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    const geo = this.geometry;
    const material = this.material;
    if (!geo.zClip || !material.uberOptions) {
      return;
    }

    const zClipCoef = 0.5;
    // TODO remove these instantiations
    const modelView = new THREE.Matrix4().multiplyMatrices(this.matrixWorld, camera.matrixWorldInverse);
    const scale = new THREE.Vector3().setFromMatrixColumn(modelView, 0);
    const s = scale.length();

    const center = new THREE.Vector3().copy(geo.boundingSphere.center);
    this.localToWorld(center);
    material.uberOptions.zClipValue = camera.position.z - center.z -
      s * (zClipCoef * geo.boundingSphere.radius);
  }
}

export default ZClippedMesh;
