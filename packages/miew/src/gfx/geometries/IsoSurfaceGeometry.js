import * as THREE from 'three';
import utils from '../../utils';

const POS_RAD_SIZE = 4;
const COLOR_SIZE = 3;
const tmpColor = new THREE.Color();

/**
 * This is a base class for isosurface algorithms.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */
class IsoSurfaceGeometry extends THREE.BufferGeometry {
  constructor(spheresCount, opts) {
    super();

    this._opts = opts;
    this.zClip = this._opts.zClip;
    this._posRad = utils.allocateTyped(Float32Array, spheresCount * POS_RAD_SIZE);
    this._colors = utils.allocateTyped(Float32Array, spheresCount * COLOR_SIZE);
  }

  setItem(chunkIdx, pos, radius) {
    const posRad = this._posRad;
    let idx = POS_RAD_SIZE * chunkIdx;
    posRad[idx++] = pos.x;
    posRad[idx++] = pos.y;
    posRad[idx++] = pos.z;
    posRad[idx] = radius;
  }

  setColor(chunkIdx, colorVal) {
    tmpColor.set(colorVal);
    const colors = this._colors;
    let idx = COLOR_SIZE * chunkIdx;
    colors[idx++] = tmpColor.r;
    colors[idx++] = tmpColor.g;
    colors[idx] = tmpColor.b;
  }

  finalize() {
    this.finishUpdate();
    this.computeBoundingSphere();
  }

  finishUpdate() {
    this._build();
  }

  setOpacity() {
    // not implemented
  }

  raycast() {
  }

  getSubset() {
    return [];
  }
}
export default IsoSurfaceGeometry;
