export default {
  precision: 'mediump',

  /**
   *
   * @param {WebGLRenderer} renderer
   */
  init(renderer) {
    this.precision = renderer.capabilities.getMaxPrecision('highp')
  }
}
