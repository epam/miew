import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.Mesh);

class ZClippedMesh extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  _onBeforeRender(renderer, scene, camera) {
    const _mvLength = new THREE.Vector3();
    const _center = new THREE.Vector3();
    const _modelView = new THREE.Matrix4();

    return function () {
      Mesh.prototype._onBeforeRender.call(this, renderer, scene, camera);

      const geo = this.geometry;
      const { material } = this;
      if (!geo.zClip || !material.uberOptions) {
        return;
      }

      const zClipCoef = 0.5;

      const modelView = _modelView.multiplyMatrices(this.matrixWorld, camera.matrixWorldInverse);
      const s = _mvLength.setFromMatrixColumn(modelView, 0).length();
      const center = _center.copy(geo.boundingSphere.center);

      this.localToWorld(center);
      material.uberOptions.zClipValue = camera.position.z - center.z
        - s * (zClipCoef * geo.boundingSphere.radius);
    };
  }
}

export default ZClippedMesh;
