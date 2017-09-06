

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

  NewObjectType.prototype._onBeforeRender = function() {

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

