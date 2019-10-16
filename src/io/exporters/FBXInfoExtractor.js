import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import gfxutils from '../../gfx/gfxutils';
import FBXGeometry from './FBXGeometry';

const FBX_POS_SIZE = 3;
const FBX_NORM_SIZE = 3;
const FBX_COL_SIZE = 4;

function copyFbxPoint3(src, srcIdx, dst, dstIdx) { // FIXME make param order unified
  dst[dstIdx] = src[srcIdx];
  dst[dstIdx + 1] = src[srcIdx + 1];
  dst[dstIdx + 2] = src[srcIdx + 2];
}

function copyFbxPoint4(src, srcIdx, dst, dstIdx, value) {
  dst[dstIdx] = src[srcIdx];
  dst[dstIdx + 1] = src[srcIdx + 1];
  dst[dstIdx + 2] = src[srcIdx + 2];
  dst[dstIdx + 3] = value;
}

function copyFbxXYZW(dst, dstIdx, x, y, z, w) {
  dst[dstIdx] = x;
  dst[dstIdx + 1] = y;
  dst[dstIdx + 2] = z;
  dst[dstIdx + 3] = w;
}
const vector4 = new THREE.Vector4();
function copyTransformedPoint3(src, srcIdx, dst, dstIdx, opts) {
  vector4.set(src[srcIdx], src[srcIdx + 1], src[srcIdx + 2], opts.w);
  vector4.applyMatrix4(opts.matrix);
  dst[dstIdx] = vector4.x;
  dst[dstIdx + 1] = vector4.y;
  dst[dstIdx + 2] = vector4.z;
}

class FBXGeo {
  constructor() {
    this.positions = null;
    this.normals = null;
    this.colors = null;
    this.indices = null;
    this.lastPos = 0;
    this.lastNorm = 0;
    this.lastCol = 0;
    this.lastIdx = 0;
  }

  init(vertsCount, indsCount) {
    this.positions = new Float32Array(vertsCount * FBX_POS_SIZE);
    this.normals = new Float32Array(vertsCount * FBX_NORM_SIZE);
    this.colors = new Float32Array(vertsCount * FBX_COL_SIZE);
    this.indices = new Int32Array(indsCount);
  }

  setPositions(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.positions, this.lastPos, FBX_POS_SIZE, copyFbxPoint3);
    this.lastPos += count * FBX_POS_SIZE;
  }

  setTransformedPositions(array, start, count, stride, matrix) {
    let idx = this.lastPos;
    let arrIdx = start;
    const opts = { matrix, w: 1 };
    for (let i = 0; i < count; ++i, arrIdx += stride, idx += FBX_POS_SIZE) {
      copyTransformedPoint3(array, arrIdx, this.positions, idx, opts);
    }
    this.lastPos += count * FBX_POS_SIZE;
  }

  setNormals(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.normals, this.lastNorm, FBX_NORM_SIZE, copyFbxPoint3);
    this.lastNorm += count * FBX_NORM_SIZE;
  }

  setTransformedNormals(array, start, count, stride, matrix) {
    let idx = this.lastNorm;
    let arrIdx = start;
    const opts = { matrix, w: 0 };
    for (let i = 0; i < count; ++i, arrIdx += stride, idx += FBX_NORM_SIZE) {
      copyTransformedPoint3(array, arrIdx, this.normals, idx, opts);
    }
    this.lastNorm += count * FBX_NORM_SIZE;
  }

  setColors(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.colors, this.lastCol, FBX_COL_SIZE, copyFbxPoint4, 1);
    this.lastCol += count * FBX_COL_SIZE;
  }

  setColor(count, r, g, b) {
    for (let i = 0, colIdx = this.lastCol; i < count; i++, colIdx += FBX_COL_SIZE) {
      copyFbxXYZW(this.colors, colIdx, r, g, b, 1);
    }
    this.lastCol += count * FBX_COL_SIZE;
  }

  setIndices(array, start, count) {
    this.indices.set(array, this.lastIdx);
    this.lastIdx += count;
  }

  setShiftedIndices(array, count, shift) {
    const shifted = array.map((x) => x + shift);
    this.setIndices(shifted, 0, count);
  }

  _setSubArray(srcArray, srcStart, srcStride, count, dstArray, dstStart, dstStride, copyFunctor, opts) {
    if ((dstArray.length - dstStart) / dstStride < count
    || (srcArray.length - srcStart) / srcStride < count) {
      return; // we've got no space
    }
    if (srcStride === dstStride) { // stride is the same
      dstArray.set(srcArray, dstStart);
    } else {
      let idx = dstStart;
      let arridx = srcStart;
      for (let i = 0; i < count; ++i, idx += dstStride, arridx += srcStride) {
        copyFunctor(srcArray, arridx, dstArray, idx, opts);
      }
    }
  }
}

export default class FBXInfoExtractor {
  constructor() {
    this._materials = [];
    this._models = [];
  }

  process(data) {
    this._extractModelsAndMaterials(data);

    return {
      name: data.name,
      models: this._models,
      materials: this._materials,
      posSize: FBX_POS_SIZE,
      colSize: FBX_COL_SIZE,
    };
  }

  /**
   * Checking if given material already was registered in materials pool (no need to create new one)
   * @param {object} material - given material
   * @returns {number} number of model-material pair
   */
  _checkExistingMaterial(material) {
    for (let i = 0; i < this._materials.length; ++i) {
      if (_.isEqual(material, this._materials[i])) {
        return i;
      }
    }
    return this._models.length;
  }

  /**
   * Counts number of vertices already written to the model
   * @param {Number} modelIdx - given model
   * @returns {number} number of vertices
   */
  _countVertices(modelIdx) {
    if (this._models.length <= modelIdx) {
      return 0;
    }
    return (this._models[modelIdx].vertices.length / FBX_POS_SIZE);
  }

  /**
   * Adding model to pool of models or extend existing ones
   * @param {Number} modelNumber - number of model-material pair
   * @param {object} model - given model
   * @param material - material of given model
   */
  _addToPool(model, material) {
    const materialIdx = this._checkExistingMaterial(material);
    if (materialIdx === this._models.length) { // new model-material pair
      this.reworkIndices(model.indices);
      this._models.push(model);
      this._materials.push(material);
    } else { // add model to existing model-material pair
      // store number of vertices before addition
      const currentCount = this._countVertices(materialIdx);
      // add new verts
      const oldModel = this._models[materialIdx];
      oldModel.vertices = utils.ConcatTypedArraysUnsafe(oldModel.vertices, model.vertices);
      oldModel.normals = utils.ConcatTypedArraysUnsafe(oldModel.normals, model.normals);
      oldModel.colors = utils.ConcatTypedArraysUnsafe(oldModel.colors, model.colors);
      // shift indices due to already existed verts in model and add them
      model.indices = model.indices.map((x) => x + currentCount);
      this.reworkIndices(model.indices);
      oldModel.indices = utils.ConcatTypedArraysUnsafe(oldModel.indices, model.indices);
    }
  }

  /**
   * Save geometry info from mesh
   */
  _collectGeoInfo(mesh) {
    const {
      geometry: {
        attributes: {
          position,
          color,
          normal,
        },
        index,
      },
      matrix,
    } = mesh;

    const model = new FBXGeo();
    const vertCount = position.count;
    model.init(vertCount, index.count);
    if (matrix.isIdentity()) {
      model.setPositions(position.array, 0, vertCount, position.itemSize);
      model.setNormals(normal.array, 0, vertCount, normal.itemSize);
    } else {
      model.setTransformedPositions(position.array, 0, vertCount, position.itemSize, matrix);
      model.setTransformedNormals(normal.array, 0, vertCount, normal.itemSize, matrix);
    }
    model.setColors(color.array, 0, vertCount, color.itemSize);
    model.setIndices(index.array, 0, index.count);
    const material = this.collectMaterialInfo(mesh);
    const modelNew = {
      vertices: model.positions, // FIXME rename vertices to positions
      indices: model.indices,
      normals: model.normals,
      colors: model.colors,
    };
    this._addToPool(modelNew, material);
  }

  /**
   * Collect instanced spheres geometry and materials.
   * @param {object} mesh - mesh with instanced spheres info
   */
  _collectSpheresInfo(mesh) {
    const {
      geometry: {
        attributes: {
          offset, // FIXME remove
          position,
          normal,
          color,
        },
        index,
      },
      matrix,
    } = mesh;

    const model = new FBXGeo();
    const instCount = offset.count; // FIXME get from geometry info, exists for InstancedGeometry
    const vertCount = position.count;
    const indsCount = index.count;
    model.init(instCount * vertCount, instCount * indsCount);
    const instMatrix = new THREE.Matrix4();
    const objMatrix = new THREE.Matrix4();
    for (let instanceIndex = 0; instanceIndex < instCount; ++instanceIndex) {
      // pos + normals
      this.getSphereInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      model.setTransformedPositions(position.array, 0, vertCount, position.itemSize, objMatrix);
      model.setTransformedNormals(normal.array, 0, vertCount, normal.itemSize, objMatrix);
      // colors
      const colorIdx = instanceIndex * color.itemSize;
      model.setColor(vertCount,
        color.array[colorIdx],
        color.array[colorIdx + 1],
        color.array[colorIdx + 2]);
      // indices
      const indexShift = vertCount * instanceIndex;
      model.setShiftedIndices(index.array, indsCount, indexShift);
    }
    const newModel = {
      vertices: model.positions, // FIXME rename vertices to positions
      indices: model.indices,
      normals: model.normals,
      colors: model.colors,
    };
    const material = this.collectMaterialInfo(mesh);
    this._addToPool(newModel, material);
  }
  // FIXME test diff materials

  /**
   * Getting all instanced cylinders from given mesh.
   * Divide cylinder (add additional vertexes) for prettiness therefore algorithm is a bit complicated
   * @param {object} mesh - given mesh with instanced cylinders
   */
  _collectCylindersInfo(mesh) {
    const {
      geometry: {
        attributes: {
          position,
          normal,
          color,
          color2,
        },
        index,
      },
      matrix,
    } = mesh;

    const model = new FBXGeo();
    const instCount = mesh.geometry.maxInstancedCount; // FIXME use for spheres
    const oneCCylinder = new FBXGeometry.OneColorGeo();
    oneCCylinder.init(mesh.geometry);
    const splittingInfo = this._gatherCylindersColoringInfo(mesh.geometry);
    const twoCCylinder = new FBXGeometry.TwoColoredCylinder();
    if (splittingInfo.needToSplit > 0) {
      twoCCylinder.init(mesh.geometry, splittingInfo);
    }
    const additionalVertsCount = splittingInfo.addPerCylinder * splittingInfo.needToSplit;
    const vertCount = position.count;
    const indsCount = index.count;
    model.init(instCount * vertCount + additionalVertsCount, instCount * indsCount);
    const instMatrix = new THREE.Matrix4();
    const objMatrix = new THREE.Matrix4();
    const colorStart = new THREE.Color();
    const colorEnd = new THREE.Color();
    let geo = {};
    for (let instanceIndex = 0; instanceIndex < instCount; ++instanceIndex) {
      // update colors in geometry
      const colorIdx = instanceIndex * color.itemSize;
      if (splittingInfo.is2Colored[instanceIndex]) {
        // .color2 contains starting color, and .color contains starting color (see uber.frag ATTR_COLOR2)
        geo = twoCCylinder.getGeo(colorStart.fromArray(color2.array, colorIdx),
          colorEnd.fromArray(color.array, colorIdx));
      } else {
        geo = oneCCylinder.getGeo(colorStart.fromArray(color.array, colorIdx));
      }
      // add instance to model // FIXME move to separate function?
      // pos + normals
      this.getCylinderInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      const prevModelVerts = model.lastPos / 3; // FIXME
      model.setTransformedPositions(geo.positions, 0, geo.vertsCount, position.itemSize, objMatrix);
      model.setTransformedNormals(geo.normals, 0, geo.vertsCount, normal.itemSize, objMatrix);
      model.setColors(geo.colors, 0, geo.vertsCount, color.itemSize);
      // indices
      // const indexShift = geo.vertsCount * instanceIndex;
      model.setShiftedIndices(geo.indices, indsCount, prevModelVerts);
    }
    const newModel = {
      vertices: model.positions, // FIXME rename vertices to positions
      indices: model.indices,
      normals: model.normals,
      colors: model.colors,
    };
    const material = this.collectMaterialInfo(mesh);
    this._addToPool(newModel, material);
  }

  // FIXME write description
  _gatherCylindersColoringInfo(geo) {
    const instCount = geo.maxInstancedCount;
    const color1 = geo.attributes.color.array;
    const color2 = geo.attributes.color2.array;
    const stride = geo.attributes.color.itemSize;
    const is2Colored = new Array(instCount);
    // analyze color instance attributes
    let needToSplit = 0;
    let colIdx = 0;
    for (let i = 0; i < instCount; i++, colIdx += stride) {
      const differs = (Math.abs(color1[colIdx] - color2[colIdx]) > 0.0000001) // compare ending colors
        || (Math.abs(color1[colIdx + 1] - color2[colIdx + 1]) > 0.0000001)
        || (Math.abs(color1[colIdx + 2] - color2[colIdx + 2]) > 0.0000001);
      is2Colored[i] = differs;
      needToSplit += differs; // count number of 2-colored cylinders
    }
    // calc number of vertices to add into 2-colored
    const geoParams = geo.getGeoParams();
    const addPerCylinder = geoParams.radialSegments;
    return { is2Colored, needToSplit, addPerCylinder };
  }

  /**
   * Collect instanced models and materials.
   * @param {object} mesh - given mesh with instanced something (spheres or cylinders)
   */
  _collectInstancedGeoInfo(mesh) {
    if (mesh.geometry.constructor.name.includes('Spheres')) {
      this._collectSpheresInfo(mesh);
    } else if (mesh.geometry.constructor.name.includes('Cylinder')) {
      this._collectCylindersInfo(mesh);
    }
  }
  // FIXME reorganize methods order inside the module

  /**
   * Extract fbx object information from ComplexVisual
   * @param {object} data - complexVisual to get geometry info from
   */
  _extractModelsAndMaterials(data) {
    const layersOfInterest = new THREE.Layers();
    layersOfInterest.set(gfxutils.LAYERS.DEFAULT);
    layersOfInterest.enable(gfxutils.LAYERS.TRANSPARENT);
    data.traverse((object) => {
      if (object instanceof THREE.Mesh && object.layers.test(layersOfInterest)) {
        if (object.geometry.type === 'InstancedBufferGeometry') {
          this._collectInstancedGeoInfo(object);
        } else {
          this._collectGeoInfo(object);
        }
      }
    });
  }

  /**
   * Reworking indices buffer, see https://banexdevblog.wordpress.com/2014/06/23/a-quick-tutorial-about-the-fbx-ascii-format/
   * basically, every triangle in Miew has been represented hat way (e.g.) : 0,1,7, but we must (for FBX) rework that into: 0,1,-8.
   * @param{Int32Array} array - indices buffer
   * @returns{Int32Array} reworked array.
   */
  reworkIndices(array) {
    const faceSize = 3;
    for (let i = faceSize - 1; i < array.length; i += faceSize) {
      array[i] *= -1;
      array[i]--;
    }
  }

  /**
   * Collect Material info from given mesh.
   * @param {object} mesh - given mesh with material info
   * @returns {object} gathered material
   */
  collectMaterialInfo(mesh) {
    const { uberOptions } = mesh.material;
    const lDiffuse = uberOptions.diffuse.toArray();
    const lOpacity = uberOptions.opacity;
    const lShininess = uberOptions.shininess;
    const lSpecular = uberOptions.specular.toArray();
    return ({
      diffuse: lDiffuse,
      opacity: lOpacity,
      shininess: lShininess,
      specular: lSpecular,
    });
  }

  getCylinderInstanceMatrix(geo, instIdx, matrix) {
    const matVector1 = geo.attributes.matVector1.array;
    const matVector2 = geo.attributes.matVector2.array;
    const matVector3 = geo.attributes.matVector3.array;
    const idxOffset = instIdx * 4; // used 4 because offset arrays are stored in quads
    matrix.set(matVector1[idxOffset], matVector1[idxOffset + 1], matVector1[idxOffset + 2], matVector1[idxOffset + 3],
      matVector2[idxOffset], matVector2[idxOffset + 1], matVector2[idxOffset + 2], matVector2[idxOffset + 3],
      matVector3[idxOffset], matVector3[idxOffset + 1], matVector3[idxOffset + 2], matVector3[idxOffset + 3],
      0, 0, 0, 1);
  }

  getSphereInstanceMatrix(geo, instIdx, matrix) {
    const { offset } = geo.attributes;
    const idx = instIdx * offset.itemSize;
    const x = offset.array[idx];
    const y = offset.array[idx + 1];
    const z = offset.array[idx + 2];
    const scale = offset.array[idx + 3];
    matrix.set(
      scale, 0, 0, x,
      0, scale, 0, y,
      0, 0, scale, z,
      0, 0, 0, 1,
    );
  }
}
