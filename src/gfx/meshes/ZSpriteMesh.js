

import * as THREE from 'three';
import UberObject from './UberObject';
const Mesh = UberObject(THREE.Mesh);

class ZSpriteMesh extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);
  }

  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    Mesh.prototype._onBeforeRender.call(this, renderer, scene, camera);
    const material = this.material;
    if (!material) {
      return;
    }

    if (material.uniforms.invModelViewMatrix) {
      // NOTE: update of modelViewMatrix inside threejs is done after onBeforeRender call,
      // so we have to do it manually in that place
      this.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);
      // get inverse matrix
      material.uniforms.invModelViewMatrix.value.getInverse(this.modelViewMatrix);
      material.uniformsNeedUpdate = true;
    }
  }
}

export default ZSpriteMesh;
