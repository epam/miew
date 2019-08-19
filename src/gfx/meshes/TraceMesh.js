import * as THREE from 'three';
import UberObject from './UberObject';

const Mesh = UberObject(THREE.Mesh);

class TraceMesh extends Mesh {
  constructor(...rest) {
    super(...rest);
    this.castShadow = true;
    this.receiveShadow = true;
  }
}

export default TraceMesh;
