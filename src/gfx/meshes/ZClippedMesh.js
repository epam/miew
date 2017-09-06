

import * as THREE from 'three';
import UberObject from './UberObject';
var Mesh = UberObject(THREE.Mesh);

function ZClippedMesh(geometry, material) {
  Mesh.call(this, geometry, material);
}

ZClippedMesh.prototype = Object.create(Mesh.prototype);
ZClippedMesh.prototype.constructor = ZClippedMesh;

ZClippedMesh.prototype._onBeforeRender = function(renderer, scene, camera) {
  var geo = this.geometry;
  var material = this.material;
  if (!geo.zClip || !material.uberOptions) {
    return;
  }

  var zClipCoef = 0.5;
  // TODO remove these instantiations
  var modelView = new THREE.Matrix4().multiplyMatrices(this.matrixWorld, camera.matrixWorldInverse);
  var scale = new THREE.Vector3().setFromMatrixColumn(modelView, 0);
  var s = scale.length();

  var center = new THREE.Vector3().copy(geo.boundingSphere.center);
  this.localToWorld(center);
  material.uberOptions.zClipValue = camera.position.z - center.z -
      s * (zClipCoef * geo.boundingSphere.radius);
};

export default ZClippedMesh;

