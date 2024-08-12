import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.Mesh);

class ZSpriteMesh extends Mesh {
  constructor(...rest) {
    super(...rest);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  _onBeforeRender(renderer, scene, camera, _geometry, _material, _group) {
    Mesh.prototype._onBeforeRender.call(this, renderer, scene, camera);
    const { material } = this;
    if (!material) {
      return;
    }

    if (material.uniforms.invModelViewMatrix) {
      // NOTE: update of modelViewMatrix inside threejs is done after onBeforeRender call,
      // so we have to do it manually in that place
      this.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);
      // get inverse matrix
      material.uniforms.invModelViewMatrix.value.copy(this.modelViewMatrix).invert();
      material.uniforms.nearPlaneValue.value = camera.near;
      material.uniformsNeedUpdate = true;
    }
  }
}

export default ZSpriteMesh;
