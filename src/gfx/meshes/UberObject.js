

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

    if (renderer.shadowMap.enabled) {
      for (var i = 0; i < scene.children.length; i++) { //FIXME add something for more than one light source with shadows
        if (scene.children[i].shadow !== undefined) {
          material.uberOptions.dirShadowMatrix.copy(scene.children[i].shadow.matrix);
          material.uberOptions.directionalShadowMap = scene.children[i].shadow.map.texture;
          break;
        }
      }
    }
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

