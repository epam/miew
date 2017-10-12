export default {

  precision: 'mediump',

  /**
   *
   * @param {THREE.WebGLRenderer} renderer
   */
  init(renderer) {
    this.precision = renderer.capabilities.getMaxPrecision('highp');
  },
};
