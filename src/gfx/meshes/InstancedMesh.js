import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.Mesh);

class InstancedMesh extends Mesh {
  constructor(...rest) {
    super(...rest);
    this.castShadow = true;
    this.receiveShadow = true;
  }
}

export default InstancedMesh;
