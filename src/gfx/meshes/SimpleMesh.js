

import * as THREE from 'three';
import UberObject from './UberObject';

var Mesh = UberObject(THREE.Mesh);

function SimpleMesh(geometry, material) {
  Mesh.call(this, geometry, material);
  this.castShadow = true;
  this.receiveShadow = true;
}

SimpleMesh.prototype = Object.create(Mesh.prototype);
SimpleMesh.prototype.constructor = SimpleMesh;

export default SimpleMesh;

