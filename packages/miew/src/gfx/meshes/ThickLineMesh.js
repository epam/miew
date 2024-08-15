import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.Mesh);
const _viewport = new THREE.Vector2();

class ThickLineMesh extends Mesh {
  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    const { material } = this;
    if (!material.uberOptions) {
      return;
    }

    material.uberOptions.projMatrixInv.copy(camera.projectionMatrix).invert();
    renderer.getSize(_viewport);
    material.uberOptions.viewport.set(_viewport.width, _viewport.height);
  }
}

export default ThickLineMesh;
