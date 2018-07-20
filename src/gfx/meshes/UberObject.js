

import UberMaterial from '../shaders/UberMaterial';
import * as THREE from "three";
export default function(SuperClass) {
  function NewObjectType() {
    SuperClass.apply(this, arguments);
    this.onBeforeRender = NewObjectType.prototype.onBeforeRender;
  }

  NewObjectType.prototype = Object.create(SuperClass.prototype);
  NewObjectType.prototype.constructor = NewObjectType;

  NewObjectType.prototype.onBeforeRender = function(renderer, scene, camera, geometry, material, group) {
    this._onBeforeRender(renderer, scene, camera, geometry, material, group);
    this._update();
  };

  NewObjectType.prototype._onBeforeRender = function(renderer, scene/*, camera*/) {
    var material = this.material;
    if (!material.uberOptions) {
      return;
    }

    // TODO remove these instantiations
    //var modelView = new THREE.Matrix4().multiplyMatrices(this.matrixWorld, camera.matrixWorldInverse);
    //var scale = new THREE.Vector3().setFromMatrixColumn(modelView, 0);
    //var s = scale.length();

     //material.uberOptions.dirShadowMatrix.copy(scene.children[1].shadow.matrix);
    //material.uberOptions.dirShadowMatrix.copy(scene.children[1].shadow.camera);
    // const mat = new THREE.Matrix4();
    // mat.multiply(camera.projectionMatrix);
    // mat.multiply(camera.matrixWorldInverse);
    const mat = new THREE.Matrix4();
    //TODO cleanup
    const shadowCam = scene.children[1].shadow.camera;
    shadowCam.updateMatrix();
    shadowCam.updateProjectionMatrix();
    mat.multiply(shadowCam.matrixWorldInverse);
    mat.multiply(shadowCam.projectionMatrix);
    material.uberOptions.dirShadowMatrix.copy(scene.children[1].shadow.matrix);
    material.uberOptions.directionalShadowMap = scene.children[1].shadow.map.texture;
  };

  NewObjectType.prototype._update = function() {
    var material = this.material;
    if (!material) {
      return;
    }

    if (material instanceof UberMaterial) {
      material.updateUniforms();
    }
  };

  return NewObjectType;
}

