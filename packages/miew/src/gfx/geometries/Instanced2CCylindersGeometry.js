import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import gfxutils from '../gfxutils';
import Simple2CCylindersGeometry from './Simple2CCylindersGeometry';
import CylinderBufferGeometry from './CylinderBufferGeometry';

const tmpColor = new THREE.Color();
const invMatrix = new THREE.Matrix4();

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

function sortNumber(a, b) {
  return a - b;
}

function _prepareCylinderInfo(chunkIndices) {
  chunkIndices.sort(sortNumber);
  const chunksIdx = [];
  const cylinderInfo = [];
  for (let i = 0, n = chunkIndices.length; i < n; ++i) {
    const val = chunkIndices[i];
    const even = (val | 0) % 2 === 0;
    const newPar = {
      first: false,
      second: false,
    };
    if (even) {
      newPar.first = true;
      newPar.second = i + 1 < n && chunkIndices[i + 1] === chunkIndices[i] + 1;
      if (newPar.second) {
        ++i;
      }
    } else {
      newPar.second = true;
    }
    chunksIdx.push(Math.floor(val / 2));
    cylinderInfo.push(newPar);
  }
  return { indices: chunksIdx, cylinderInfo };
}

function _assignOpacity(cylinderInfo, color1, color2) {
  for (let i = 0, n = cylinderInfo.length; i < n; ++i) {
    const info = cylinderInfo[i];
    if (!info.first) {
      color1[COLOR_SIZE * i] = -0.5;
    }
    if (!info.second) {
      color2[COLOR_SIZE * i] = -0.5;
    }
  }
}
class Instanced2CCylindersGeometry extends THREE.InstancedBufferGeometry {
  constructor(instanceCount, polyComplexity, useZSprites, openEnded) {
    super();
    this._useZSprites = useZSprites;
    this._cylGeometry = useZSprites ? new THREE.PlaneGeometry(2, 2, 1, 1)
      : new CylinderBufferGeometry(1, 1, 1.0, Math.max(3, polyComplexity), 2, openEnded);
    this._init(instanceCount, this._cylGeometry, this._useZSprites);

    this._collisionGeo = new Simple2CCylindersGeometry(instanceCount, 3);
  }

  setItem(itemIdx, botPos, topPos, itemRad) {
    const matrix = gfxutils.calcCylinderMatrix(botPos, topPos, itemRad);
    let me = matrix.elements;
    const mtxOffset = itemIdx * OFFSET_SIZE;

    this._collisionGeo.setItem(itemIdx, botPos, topPos, itemRad);
    setArrayXYZW(this._matVector1, mtxOffset, me[0], me[4], me[8], me[12]);
    setArrayXYZW(this._matVector2, mtxOffset, me[1], me[5], me[9], me[13]);
    setArrayXYZW(this._matVector3, mtxOffset, me[2], me[6], me[10], me[14]);

    if (this._useZSprites) {
      invMatrix.copy(matrix).invert();
      me = invMatrix.elements;
      setArrayXYZW(this._invmatVector1, mtxOffset, me[0], me[4], me[8], me[12]);
      setArrayXYZW(this._invmatVector2, mtxOffset, me[1], me[5], me[9], me[13]);
      setArrayXYZW(this._invmatVector3, mtxOffset, me[2], me[6], me[10], me[14]);
    }
  }

  setColor(itemIdx, colorVal1, colorVal2) {
    const colorIdx = itemIdx * COLOR_SIZE;
    tmpColor.set(colorVal1);
    setArrayXYZ(this._color1, colorIdx, tmpColor.r, tmpColor.g, tmpColor.b);
    tmpColor.set(colorVal2);
    setArrayXYZ(this._color2, colorIdx, tmpColor.r, tmpColor.g, tmpColor.b);
  }

  computeBoundingSphere() {
    this._collisionGeo.computeBoundingSphere();
    this.boundingSphere = this._collisionGeo.boundingSphere;
  }

  computeBoundingBox() {
    this._collisionGeo.computeBoundingBox();
    this.boundingBox = this._collisionGeo.boundingBox;
  }

  raycast(raycaster, intersects) {
    this._collisionGeo.raycast(raycaster, intersects);
  }

  startUpdate() {
    return true;
  }

  finishUpdate() {
    this.getAttribute('matVector1').needsUpdate = true;
    this.getAttribute('matVector2').needsUpdate = true;
    this.getAttribute('matVector3').needsUpdate = true;
    this.getAttribute('color').needsUpdate = true;
    this.getAttribute('color2').needsUpdate = true;
    this.getAttribute('alphaColor').needsUpdate = true;
    if (this._useZSprites) {
      this.getAttribute('invmatVector1').needsUpdate = true;
      this.getAttribute('invmatVector2').needsUpdate = true;
      this.getAttribute('invmatVector3').needsUpdate = true;
    }

    this._collisionGeo.finishUpdate();
  }

  finalize() {
    this.finishUpdate();
    this.computeBoundingSphere();
  }

  setOpacity(chunkIndices, value) {
    const alphaArr = this._alpha;
    for (let i = 0, n = chunkIndices.length; i < n; ++i) {
      alphaArr[Math.floor(chunkIndices[i] / 2)] = value;
    }
    this.getAttribute('alphaColor').needsUpdate = true;
  }

  getSubset(chunkIndices) {
    const info = _prepareCylinderInfo(chunkIndices);
    const cylinderIndices = info.indices;
    const instanceCount = cylinderIndices.length;
    const geom = new THREE.InstancedBufferGeometry();
    this._init.call(geom, instanceCount, this._cylGeometry, this._useZSprites);

    copySubArrays(this._matVector1, geom._matVector1, cylinderIndices, OFFSET_SIZE);
    copySubArrays(this._matVector2, geom._matVector2, cylinderIndices, OFFSET_SIZE);
    copySubArrays(this._matVector3, geom._matVector3, cylinderIndices, OFFSET_SIZE);

    if (this._useZSprites) {
      copySubArrays(this._invmatVector1, geom._invmatVector1, cylinderIndices, OFFSET_SIZE);
      copySubArrays(this._invmatVector2, geom._invmatVector2, cylinderIndices, OFFSET_SIZE);
      copySubArrays(this._invmatVector3, geom._invmatVector3, cylinderIndices, OFFSET_SIZE);
    }

    copySubArrays(this._color1, geom._color1, cylinderIndices, COLOR_SIZE);
    copySubArrays(this._color2, geom._color2, cylinderIndices, COLOR_SIZE);
    _assignOpacity(info.cylinderInfo, geom._color1, geom._color2);
    geom.boundingSphere = this.boundingSphere;
    geom.boundingBox = this.boundingBox;
    return [geom];
  }

  getGeoParams() {
    return this._cylGeometry.parameters;
  }

  _init(instanceCount, cylinderGeo, useZSprites) {
    this.copy(cylinderGeo);
    this._matVector1 = utils.allocateTyped(Float32Array, instanceCount * OFFSET_SIZE);
    this._matVector2 = utils.allocateTyped(Float32Array, instanceCount * OFFSET_SIZE);
    this._matVector3 = utils.allocateTyped(Float32Array, instanceCount * OFFSET_SIZE);
    this._color1 = utils.allocateTyped(Float32Array, instanceCount * COLOR_SIZE);
    this._color2 = utils.allocateTyped(Float32Array, instanceCount * COLOR_SIZE);
    const alpha = this._alpha = utils.allocateTyped(Float32Array, instanceCount);
    _.fill(alpha, 1.0);

    this.setAttribute('matVector1', new THREE.InstancedBufferAttribute(this._matVector1, OFFSET_SIZE, false, 1));
    this.setAttribute('matVector2', new THREE.InstancedBufferAttribute(this._matVector2, OFFSET_SIZE, false, 1));
    this.setAttribute('matVector3', new THREE.InstancedBufferAttribute(this._matVector3, OFFSET_SIZE, false, 1));
    this.setAttribute('color', new THREE.InstancedBufferAttribute(this._color1, COLOR_SIZE, false, 1));
    this.setAttribute('color2', new THREE.InstancedBufferAttribute(this._color2, COLOR_SIZE, false, 1));

    this.setAttribute('alphaColor', new THREE.InstancedBufferAttribute(this._alpha, 1, false, 1));

    if (useZSprites) {
      this._invmatVector1 = utils.allocateTyped(Float32Array, instanceCount * OFFSET_SIZE);
      this._invmatVector2 = utils.allocateTyped(Float32Array, instanceCount * OFFSET_SIZE);
      this._invmatVector3 = utils.allocateTyped(Float32Array, instanceCount * OFFSET_SIZE);

      this.setAttribute(
        'invmatVector1',
        new THREE.InstancedBufferAttribute(this._invmatVector1, OFFSET_SIZE, false, 1),
      );
      this.setAttribute(
        'invmatVector2',
        new THREE.InstancedBufferAttribute(this._invmatVector2, OFFSET_SIZE, false, 1),
      );
      this.setAttribute(
        'invmatVector3',
        new THREE.InstancedBufferAttribute(this._invmatVector3, OFFSET_SIZE, false, 1),
      );
    }
  }
}

export default Instanced2CCylindersGeometry;
