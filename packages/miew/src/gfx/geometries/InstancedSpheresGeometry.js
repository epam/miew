import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import SphereCollisionGeo from './SphereCollisionGeo';

const tmpColor = new THREE.Color();

const OFFSET_SIZE = 4;
const COLOR_SIZE = 3;
const { copySubArrays } = utils;

function setArrayXYZ(arr, idx, x, y, z) {
  arr[idx] = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
}

function setArrayXYZW(arr, idx, x, y, z, w) {
  arr[idx] = x;
  arr[idx + 1] = y;
  arr[idx + 2] = z;
  arr[idx + 3] = w;
}
class InstancedSpheresGeometry extends SphereCollisionGeo(THREE.InstancedBufferGeometry) {
  constructor(spheresCount, sphereComplexity, useZSprites) {
    super(spheresCount);
    this._sphGeometry = useZSprites ? new THREE.PlaneGeometry(2, 2, 1, 1)
      : new THREE.SphereBufferGeometry(1, sphereComplexity * 2, sphereComplexity, 0, Math.PI * 2, 0, Math.PI);
    this._init(spheresCount, this._sphGeometry);
  }

  setItem(itemIdx, itemPos, itemRad) {
    setArrayXYZW(this._offsets, itemIdx * OFFSET_SIZE, itemPos.x, itemPos.y, itemPos.z, itemRad);
    this.setSphere(itemIdx, itemPos, itemRad);
  }

  setColor(itemIdx, colorVal) {
    tmpColor.set(colorVal);
    setArrayXYZ(this._colors, itemIdx * COLOR_SIZE, tmpColor.r, tmpColor.g, tmpColor.b);
  }

  startUpdate() {
    return true;
  }

  finishUpdate() {
    this.getAttribute('offset').needsUpdate = true;
    this.getAttribute('color').needsUpdate = true;
  }

  finalize() {
    this.finishUpdate();
    this.computeBoundingSphere();
  }

  setOpacity(chunkIndices, value) {
    const alphaArr = this._alpha;
    for (let i = 0, n = chunkIndices.length; i < n; ++i) {
      alphaArr[chunkIndices[i]] = value;
    }
    this.getAttribute('alphaColor').needsUpdate = true;
  }

  getSubset(chunkIndices) {
    const instanceCount = chunkIndices.length;
    const geom = new THREE.InstancedBufferGeometry();
    this._init.call(geom, instanceCount, this._sphGeometry);

    copySubArrays(this._offsets, geom._offsets, chunkIndices, OFFSET_SIZE);
    copySubArrays(this._colors, geom._colors, chunkIndices, COLOR_SIZE);
    geom.boundingSphere = this.boundingSphere;
    geom.boundingBox = this.boundingBox;
    return [geom];
  }

  _init(spheresCount, sphereGeo) {
    this.copy(sphereGeo);

    this._offsets = utils.allocateTyped(Float32Array, spheresCount * OFFSET_SIZE);
    this._colors = utils.allocateTyped(Float32Array, spheresCount * COLOR_SIZE);
    const alpha = this._alpha = utils.allocateTyped(Float32Array, spheresCount);
    _.fill(alpha, 1.0);

    this.setAttribute('offset', new THREE.InstancedBufferAttribute(this._offsets, OFFSET_SIZE, false, 1));
    this.setAttribute('color', new THREE.InstancedBufferAttribute(this._colors, COLOR_SIZE, false, 1));
    this.setAttribute('alphaColor', new THREE.InstancedBufferAttribute(alpha, 1, false, 1));
  }
}
export default InstancedSpheresGeometry;
