

import * as THREE from 'three';
import UberObject from './UberObject';
var Mesh = UberObject(THREE.Mesh);

function ThickLineMesh(geometry, material) {
  Mesh.call(this, geometry, material);
}

ThickLineMesh.prototype = Object.create(Mesh.prototype);
ThickLineMesh.prototype.constructor = ThickLineMesh;

ThickLineMesh.prototype._onBeforeRender = function(renderer, scene, camera) {
  var material = this.material;
  if (!material.uberOptions) {
    return;
  }

  material.uberOptions.projMatrixInv.getInverse(camera.projectionMatrix, true);
  var viewport = renderer.getSize();
  material.uberOptions.viewport.set(viewport.width, viewport.height);
};

export default ThickLineMesh;

