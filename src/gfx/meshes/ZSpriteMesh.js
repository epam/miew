

import * as THREE from 'three';
import UberObject from './UberObject';
var Mesh = UberObject(THREE.Mesh);

function ZSpriteMesh(geometry, material) {
  Mesh.call(this, geometry, material);
}

ZSpriteMesh.prototype = Object.create(Mesh.prototype);
ZSpriteMesh.prototype.constructor = ZSpriteMesh;

ZSpriteMesh.prototype._onBeforeRender = function() {
  var material = this.material;
  if (!material) {
    return;
  }

  if (material.uniforms.invModelViewMatrix) {
    material.uniforms.invModelViewMatrix.value.getInverse(this.modelViewMatrix);
  }
};

export default ZSpriteMesh;

