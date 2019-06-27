import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.Mesh);

class ZClippedMesh extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  static _mvLength = new THREE.Vector3();

  static _center = new THREE.Vector3();

  static _modelView = new THREE.Matrix4();

  _onBeforeRender(renderer, scene, camera) {
    Mesh.prototype._onBeforeRender.call(this, renderer, scene, camera);

    const geo = this.geometry;
    const { material } = this;
    if (!geo.zClip || !material.uberOptions) {
      return;
    }

    const zClipCoef = 0.5;

    const modelView = ZClippedMesh._modelView;
    const mvLength = ZClippedMesh._mvLength;
    const center = ZClippedMesh._center;

    modelView.multiplyMatrices(this.matrixWorld, camera.matrixWorldInverse);
    const s = mvLength.setFromMatrixColumn(modelView, 0).length();
    center.copy(geo.boundingSphere.center);

    this.localToWorld(center);
    material.uberOptions.zClipValue = camera.position.z - center.z
      - s * (zClipCoef * geo.boundingSphere.radius);
  }
}

export default ZClippedMesh;
