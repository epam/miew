import FBXGeometry from './FBXGeometry';

/**
 * Fbx geometry, that copies positions+normals, indexes and creates colors filled with defined value.
 * @extends FBXGeometry
 */
export default class FBX1CGeometry extends FBXGeometry {
  /**
   * Initialize geo storing positions, normals, indices and create colors.
   * @param {Object} geo - THREE.BufferGeometry.
   */
  init(geo, _info) {
    super.init(geo, _info);
    const {
      attributes: {
        position,
        normal,
      },
      index,
    } = geo;
    // copy vertices attributes
    this.vertsCount = position.count;
    this.positions = position.array;
    this.normals = normal.array;
    // create color array
    this.colors = new Float32Array(this.vertsCount * this.itemSize.color);
    // indices
    this.indices = index.array;
  }

  /**
   * Set defined color for all items in color attribute
   * @param {Object} color - THREE.Color.
   */
  setColors(color) {
    let offset = 0;
    for (let i = 0, l = this.colors.length, cl = this.itemSize.color; i < l; i += cl) {
      this.colors[offset++] = color.r;
      this.colors[offset++] = color.g;
      this.colors[offset++] = color.b;
    }
  }
}
