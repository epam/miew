import UberMaterial from '../shaders/UberMaterial';

export default function (SuperClass) {
  class NewObjectType extends SuperClass {
    constructor(...rest) {
      super(...rest);
      this.onBeforeRender = NewObjectType.prototype.onBeforeRender;
    }

    onBeforeRender(renderer, scene, camera, geometry, material, group) {
      this._onBeforeRender(renderer, scene, camera, geometry, material, group);
      this._update();
    }

    _onBeforeRender() {
    }

    _update() {
      const { material } = this;
      if (!material) {
        return;
      }

      if (material instanceof UberMaterial) {
        material.updateUniforms();
      }
    }
  }

  return NewObjectType;
}
