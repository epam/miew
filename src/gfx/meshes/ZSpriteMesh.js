

import * as THREE from 'three';
import UberObject from './UberObject';
var Mesh = UberObject(THREE.Mesh);

function ZSpriteMesh(geometry, material) {
  Mesh.call(this, geometry, material);
}

ZSpriteMesh.prototype = Object.create(Mesh.prototype);
ZSpriteMesh.prototype.constructor = ZSpriteMesh;

ZSpriteMesh.prototype._onBeforeRender = function(_renderer, _scene, camera, _geometry, _material, _group) {
  var material = this.material;
  if (!material) {
    return;
  }

  if (material.uniforms.invModelViewMatrix) {
    // NOTE: update of modelViewMatrix inside threejs is done after onBeforeRender call,
    // so we have to do it manually in that place
    this.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);
    // get inverse matrix
    material.uniforms.invModelViewMatrix.value.getInverse(this.modelViewMatrix);
  }
};

export default ZSpriteMesh;

