import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.LineSegments);
const _viewport = new THREE.Vector2();

class ThinLineMesh extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    const { material } = this;
    if (!material.uberOptions) {
      return;
    }

    material.uberOptions.projMatrixInv.getInverse(camera.projectionMatrix, true);
    renderer.getSize(_viewport);
    material.uberOptions.viewport.set(_viewport.width, _viewport.height);
  }
}

export default ThinLineMesh;
