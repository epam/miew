

import * as THREE from 'three';
import UberObject from './UberObject';
var Mesh = UberObject(THREE.Mesh);

function ThickLineSegments(geometry, material) {
  Mesh.call(this, geometry, material);
}

ThickLineSegments.prototype = Object.create(Mesh.prototype);
ThickLineSegments.prototype.constructor = ThickLineSegments;

ThickLineSegments.prototype._onBeforeRender = function(renderer, scene, camera) {
  var material = this.material;
  if (!material.uberOptions) {
    return;
  }

  material.uberOptions.projMatrixInv.getInverse(camera.projectionMatrix, true);
  var viewport = renderer.getSize();
  material.uberOptions.viewport.set(viewport.width, viewport.height);
};

export default ThickLineSegments;

