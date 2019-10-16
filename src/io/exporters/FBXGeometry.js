/** Base class for fbx geometry contains simply organized attributes: positions+normals+colors, indices. */
class Geo {
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
   * @param {Object} geo - THREE.Geometry.
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

/**
 * Fbx geometry, that copies positions+normals, indexes and creates colors filled with defined value.
 * @extends Geo
 */
class OneColorGeo extends Geo {
  /**
   * Initialize geo storing positions, normals, indices and create colors.
   * @param {Object} geo - THREE.Geometry.
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

/**
 * Fbx geometry, that copies positions+normals, indexes from cylinder  geometry and creates colors filled with two
 * defined values.
 * @extends Geo
 */
class TwoColoredCylinder extends Geo {
  constructor() {
    super();
    this._cutRawStart = 0;
    this._cutRawEnd = 0;
    this._facesPerSlice = 0;
  }

  /**
   * Initialize geo by creating new attributes, because we extend number of vertices to make cylinder two-colored.
   * Indices remain the same. We process open- end close-ended cylinders and consider cylinders od 2 segments
   * in height ONLY.
   * NOTE: cylinder consists of 2 height segments and stores parts in the order: tube, topCap, bottomCap
   * @param {Object} geo - THREE.Geometry.
   * @param {Object} info - information needed for geo extend
   */
  init(geo, info) {
    super.init(geo, info);
    const {
      attributes: {
        position,
      },
      index,
    } = geo;
    // extend vertices arrays
    this.vertsCount = position.count + info.addPerCylinder;
    this._facesPerSlice = info.addPerCylinder;
    this.positions = new Float32Array(this.vertsCount * position.itemSize);
    this.normals = new Float32Array(this.vertsCount * this.itemSize.normal);
    this.colors = new Float32Array(this.vertsCount * this.itemSize.color);
    this._extendVertices(geo, info);
    // number of indices stays the same
    this.indices = new Uint32Array(index.count);
    this._extendIndices(geo, info);
  }

  /** Extend vertex attributes to have one more slice to make sharp middle startColor-endColor line. */
  _extendVertices(geo, info) {
    const { position } = geo.attributes;
    const { normal } = geo.attributes;
    const geoParams = geo.getGeoParams();
    const cutRaw = 1; // we expect cylinders of 2 segments in height => so half segment = 1
    this._cutRawStart = cutRaw * geoParams.radialSegments;
    this._cutRawEnd = this._cutRawStart + info.addPerCylinder;
    { // write first half of cylinder
      let temp = position.array.slice(0, this._cutRawEnd * position.itemSize);
      this.positions.set(temp, 0);
      temp = normal.array.slice(0, this._cutRawEnd * normal.itemSize);
      this.normals.set(temp, 0);
    }
    { // write second part of cylinder
      let temp = position.array.slice(this._cutRawStart * position.itemSize, position.array.length);
      this.positions.set(temp, this._cutRawEnd * position.itemSize);
      temp = normal.array.slice(this._cutRawStart * normal.itemSize, normal.array.length);
      this.normals.set(temp, this._cutRawEnd * normal.itemSize);
    }
  }

  /** Shift values of second part (+caps) indices by newly added vertices count. Number of faces remains the same. */
  _extendIndices(geo, info) {
    const { index } = geo;
    const indicesPerQuad = 6; // quad = 2 triangles => 6 indices
    const startToShift = info.addPerCylinder * indicesPerQuad;
    const shift = info.addPerCylinder;
    let shifted = index.array.slice(startToShift, index.count);
    shifted = shifted.map((x) => x + shift); // shift only the endings
    this.indices.set(index.array, 0);
    this.indices.set(shifted, startToShift);
  }

  /**
   * Set defined colors: (first part + bottom cap), (second part + top cap)
   * @param {Object} color1 - THREE.Color.
   * @param {Object} color2 - THREE.Color.
   */
  setColors(color1, color2) {
    const colorSize = this.itemSize.color;
    const part1End = this._cutRawEnd * colorSize;
    const part2End = part1End * 2;
    const capSize = (this._facesPerSlice + 1) * colorSize;
    let color = null;
    let offset = 0;
    for (let i = 0, l = this.colors.length; i < l; i += colorSize) {
      if (i < part1End) { // first part
        color = color1;
      } else if (i < part2End + capSize) { // second part + top cap
        color = color2;
      } else { // bottom cap
        color = color1;
      }
      this.colors[offset++] = color.r;
      this.colors[offset++] = color.g;
      this.colors[offset++] = color.b;
    }
  }
}

export default {
  OneColorGeo,
  TwoColoredCylinder,
};
