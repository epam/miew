import * as THREE from 'three';
import ViveController from './ViveController';
import UberMaterial from '../shaders/UberMaterial';

export default class GeoViveController extends  ViveController {

  constructor(id) {
    super(id);

    // visualize controllers with cylinders
    const geometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3);
    const material = new UberMaterial({lights: false, overrideColor: true});
    material.setUberOptions({fixedColor: new THREE.Color(0x4444ff)});
    material.updateUniforms();
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    this.add(cylinder);
  }
}

