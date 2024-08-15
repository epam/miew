/** Base class for fbx geometry contains simply organized attributes: positions+normals+colors, indices. */
export default class FBXGeometry {
  /**
   * Create a base geo with necessary members.
   */
  constructor() {
    this.positions = null;
    this.normals = null;
    this.colors = null;
    this.indices = null;
    this.vertsCount = 0;
    this.itemSize = null;
  }

  /**
   * Initialize base geo storing items info from attributes.
   * @param {Object} geo - THREE.BufferGeometry.
   */
  init(geo, _info) {
    const { attributes } = geo;
    // save item size
    this.itemSize = {
      position: attributes.position.itemSize,
      normal: attributes.normal.itemSize,
      color: attributes.color.itemSize,
    };
  }
}
