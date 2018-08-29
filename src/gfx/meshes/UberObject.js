

import UberMaterial from '../shaders/UberMaterial';
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

