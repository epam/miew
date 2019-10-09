import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';
import gfxutils from '../../gfx/gfxutils';
import FBXCylinderGeometryModel from './FBXCylinderGeometryModel';

const POS_SIZE = 3; // FIXME make it only one
const COL_SIZE = 3;
const FBX_POS_SIZE = 3;
const FBX_NORM_SIZE = 3;
const FBX_COL_SIZE = 4;

function copyFbxPoint3(src, srcIdx, dst, dstIdx) {
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

  setNormals(array, start, count, stride) {
    this._setSubArray(array, start, stride, count, this.normals, this.lastNorm, FBX_NORM_SIZE, copyFbxPoint3);
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
    this._setSubArray(array, start, 1, count, this.indices, this.lastIdx, 1);
    this.lastIdx += count;
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
   * Calculating max index in indices array of given model
   * @param {Number} modelNumber - given model
   * @returns {number} maximum index
   */
  _calculateMaxIndex(modelNumber) {
    if (this._models.length === modelNumber) {
      return 0;
    }
    return (this._models[modelNumber].vertices.length / POS_SIZE - 1); // FIXME remove decreasing
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
      // shift indices due to already existed verts model
      const maxIndex = this._calculateMaxIndex(materialIdx);
      const oldModel = this._models[materialIdx];
      oldModel.vertices = utils.ConcatTypedArraysUnsafe(oldModel.vertices, model.vertices);
      oldModel.normals = utils.ConcatTypedArraysUnsafe(oldModel.normals, model.normals);
      oldModel.colors = utils.ConcatTypedArraysUnsafe(oldModel.colors, model.colors);
      model.indices = model.indices.map((x) => x + (maxIndex + 1)); // FIXME think about reworking
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
    model.init(vertCount, index.count); // FIXME use attribute.count instead of array.length

    model.setPositions(position.array, 0, vertCount, POS_SIZE);
    model.setNormals(normal.array, 0, vertCount, POS_SIZE);
    if (!matrix.isIdentity()) {
      matrix.applyToPointsArray(model.positions, FBX_POS_SIZE, 1);
      matrix.applyToPointsArray(model.normals, FBX_NORM_SIZE, 0);
    }
    model.setColors(color.array, 0, vertCount, COL_SIZE);
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
          offset,
          position,
          normal,
          color,
        },
        index,
      },
      matrix,
    } = mesh;

    const model = new FBXGeo();
    const instCount = offset.count;
    const vertCount = position.count;
    const indsCount = index.count;
    model.init(instCount * vertCount, instCount * indsCount);
    const instMatrix = new THREE.Matrix4();
    const objMatrix = new THREE.Matrix4();
    for (let instanceIndex = 0; instanceIndex < instCount; ++instanceIndex) {
      // Firstly, collect some basic instanced parameters */
      let lNormals = _.cloneDeep(normal.array);
      let lIndices = _.cloneDeep(index.array); // FIXME don't clone them
      let lVertices = _.cloneDeep(position.array);
      const indexShift = vertCount * instanceIndex;
      lIndices = lIndices.map((x) => x + indexShift); // FIXME think about reworking
      this.getSphereInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      if (!objMatrix.isIdentity()) {
        lVertices = objMatrix.applyToPointsArray(lVertices, FBX_POS_SIZE, 1);
        lNormals = objMatrix.applyToPointsArray(lNormals, FBX_NORM_SIZE, 0);
      }
      model.setPositions(lVertices, 0, vertCount, POS_SIZE);
      model.setNormals(lNormals, 0, vertCount, POS_SIZE);
      const colorIdx = instanceIndex * color.itemSize;
      model.setColor(vertCount,
        color.array[colorIdx],
        color.array[colorIdx + 1],
        color.array[colorIdx + 2]);
      model.setIndices(lIndices, 0, indsCount);
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

  /**
   * Getting all instanced cylinders from given mesh.
   * Divide cylinder (add additional vertexes) for prettiness therefore algorithm is a bit complicated
   * @param {object} mesh - given mesh with instanced cylinders
   */
  _collectCylindersInfo(mesh) {
    const {
      geometry: {
        attributes: {
          alphaColor,
        },
        index,
      },
      matrix,
    } = mesh;
    const material = this.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    const maxIndexInModels = this._calculateMaxIndex(modelNumber);
    const regularModel = new FBXCylinderGeometryModel('regular', mesh);
    const extendedModel = new FBXCylinderGeometryModel('extended', mesh);
    const resultingModel = new FBXCylinderGeometryModel('resulting', mesh);
    const numInstances = alphaColor.count;
    let firstInstance = true;
    let maxIndex = 0;
    for (let instanceIndex = 0; instanceIndex < numInstances; ++instanceIndex) {
      // Grab vertices and normals for transformed (scale, rotation, translation) cylinder
      let [lVertices, lNormals] = this.calculateCylinderTransform(mesh, instanceIndex);
      if (!matrix.isIdentity()) {
        lVertices = matrix.applyToPointsArray(lVertices, POS_SIZE, 1);
        lNormals = matrix.applyToPointsArray(lNormals, POS_SIZE, 0);
      }
      // Okay now vertices are reworked as we want them. Now it's time for implementing algorithm
      // Collect indices for given cylinder - remember: they may slightly change later on
      let lIndices = Int32Array.from(_.cloneDeep(index.array)); // FIXME be careful with clone deep, strides in fbx and Miew can differ
      // As we making one big model we need to carefully add numVertices to every index in lIndices. Remember - need to add additional vertices as we add them!
      if (!firstInstance) {
        for (let k = 0; k < lIndices.length; ++k) {
          lIndices[k] += (maxIndex + 1);
        }
      } else {
        firstInstance = false;
      }
      lIndices = this.reworkIndices(lIndices); // Need to rework this into FBX notation
      // Do we need to divide cylinders? It depends on colors of each half of cylinder
      const needToDivideCylinders = this.decideSeparation(mesh, instanceIndex);
      let reworkedModel = regularModel;
      // if we dont need to divide cylinders then we dont need extended arrays
      if (needToDivideCylinders) {
        reworkedModel = extendedModel;
      }
      // Getting new vertices etc
      this.getReworkedAttributes(mesh, instanceIndex, reworkedModel, lVertices, lIndices, lNormals, needToDivideCylinders);
      maxIndex = this.getMaxIndexInModel(reworkedModel);
      // Saving info from one instance to resulting model
      resultingModel.storeResults(reworkedModel);
    }
    // Need to delete all zeros from the end of resArrays
    const [resVertices, resIndices, resColors, resNormals] = this.finalizeCylinderAttributes(mesh, maxIndexInModels, resultingModel);
    const model = {
      vertices: resVertices,
      indices: resIndices,
      normals: resNormals,
      colors: resColors,
    };
    this._addToPool(modelNumber, model, material);
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
    // const clonedArray = new Int32Array(array.length); // In some future we might want to rework this to bigint64, but currently it haven't been supported in many browsers
    // clonedArray.set(array);
    // for (let i = POS_SIZE - 1; i < clonedArray.length; i += POS_SIZE) {
    //   clonedArray[i] *= -1;
    //   clonedArray[i]--;
    // }
    // return clonedArray;
    const faceSize = 3;
    for (let i = faceSize - 1; i < array.length; i += faceSize) {
      array[i] *= -1;
      array[i]--;
    }
  }

  /**
   * Reworking colors buffer + alpha, see https://raw.githubusercontent.com/wayt/Bomberman/master/Assets/fire.fbx
   * Basically we have two arrays - color array and alpha array, and we need to put 1 alpha after 3 colors, so therefore this algorithm presents.
   * @param{array} colorArray - colors buffer
   * @returns{Float32Array} reworked array.
   */
  reworkColors(colorArray) {
    if (!colorArray || colorArray.length === 0) {
      return [];
    }
    const clonedArray = new Float32Array(colorArray.length + colorArray.length / COL_SIZE);
    let clonedArrIdx = 0;
    for (let i = 0; i < colorArray.length; i += COL_SIZE) {
      clonedArray.set([colorArray[i]], clonedArrIdx); // R
      clonedArray.set([colorArray[i + 1]], clonedArrIdx + 1); // G
      clonedArray.set([colorArray[i + 2]], clonedArrIdx + 2); // B
      clonedArray.set([1], clonedArrIdx + 3); // A
      clonedArrIdx += FBX_COL_SIZE;
    }
    return clonedArray;
  }

  /**
   * Clone colors from one to number of vertices
   * @returns {Float32Array} array with cloned colors
   */
  cloneColors(numVertices, color) {
    const clonedArray = new Float32Array(numVertices * FBX_COL_SIZE); // RGBA for every vertex
    for (let i = 0; i < clonedArray.length; i += FBX_COL_SIZE) {
      clonedArray.set(color, i);
    }
    return clonedArray;
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

  /**
   * Calculate parameters for one cylinder in given mesh.
   * @param {object} mesh - mesh with instanced objects
   * @param {Number} instanceIndex - number of instance in mesh
   * @returns {*[]} array of gathered transformations of vertices and normals
   */
  calculateCylinderTransform(mesh, instanceIndex) {
    // Misc variables
    const {
      geometry: {
        attributes,
      },
    } = mesh;
    const matVector1 = attributes.matVector1.array;
    const matVector2 = attributes.matVector2.array;
    const matVector3 = attributes.matVector3.array;
    // Grab original vertices and normals
    let lVertices = _.cloneDeep(attributes.position.array);
    let lNormals = _.cloneDeep(attributes.normal.array);
    // We have vertices for not transformed cylinder. Need to make it transformed
    const transformCylinder = new THREE.Matrix4(); // FIXME don't create new matrix for every cylinder
    const idxOffset = instanceIndex * 4; // used 4 because offset arrays are stored in quads
    transformCylinder.set(matVector1[idxOffset], matVector1[idxOffset + 1], matVector1[idxOffset + 2], matVector1[idxOffset + 3],
      matVector2[idxOffset], matVector2[idxOffset + 1], matVector2[idxOffset + 2], matVector2[idxOffset + 3],
      matVector3[idxOffset], matVector3[idxOffset + 1], matVector3[idxOffset + 2], matVector3[idxOffset + 3],
      0, 0, 0, 1);
    lVertices = transformCylinder.applyToPointsArray(lVertices, POS_SIZE, 1);
    lNormals = transformCylinder.applyToPointsArray(lNormals, POS_SIZE, 0);
    return [lVertices, lNormals];
  }

  /**
   * Needed procedure for array copying by triplets
   * @param {Array} destArray - array to where will be copied
   * @param {Number} fromPositionInDestArray - position in destination array from where will be copied
   * @param {Array} sourceArray - array from where will be copied
   * @param {Number} fromPositionInSourceArray - position in source array from where will be copied
   * @param {Number} numberOfElements - number of elements to copy
   * @returns {Number} number of copied elements
   */
  copyArrays(destArray, fromPositionInDestArray, sourceArray, fromPositionInSourceArray, numberOfElements, offset = 0) {
    for (let j = 0; j < numberOfElements; j += 3) {
      destArray[fromPositionInDestArray] = sourceArray[j + fromPositionInSourceArray] + offset;
      destArray[fromPositionInDestArray + 1] = sourceArray[j + 1 + fromPositionInSourceArray] + offset;
      destArray[fromPositionInDestArray + 2] = sourceArray[j + 2 + fromPositionInSourceArray] - offset;
      fromPositionInDestArray += 3;
    }
    return numberOfElements;
  }

  /**
   * Function to decide - do we need separate one cylinder into two or not.
   * We do need to separate them if they have not equal colors on two sides
   * @param {Object} mesh - given mesh
   * @param {Number} instanceIndex - exact instance of cylinder in mesh
   * @returns {boolean} true if need separation, false otherwise
   */
  decideSeparation(mesh, instanceIndex) {
    const {
      geometry: {
        attributes: {
          color,
          color2,
        },
      },
    } = mesh;
    // No CLONE DEEP for performance reasons. We do not change that colors what so ever so we dont need deep copies
    const meshColor1 = color.array;
    const meshColor2 = color2.array;
    const idxColors = instanceIndex * COL_SIZE;
    const objectColor1 = this.reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]]);
    const objectColor2 = this.reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]]);
    return !_.isEqual(objectColor1, objectColor2);
  }

  /**
   * Get color array in FBX notation for given cylinder.
   * @param {Object} mesh - given mesh
   * @param {Number} instanceIndex - exact cylinder in given mesh
   * @param {FBXCylinderGeometryModel} model - given model (either closed or opened cylinder)
   * @returns {Float32Array} cylinder colors array (for every vertex)
   */
  getColors(mesh, instanceIndex, model) {
    const {
      geometry: {
        attributes: {
          color,
          color2,
          position,
        },
      },
    } = mesh;
    // No CLONE DEEP for performance reasons. We do not change that colors what so ever so we dont need deep copies
    const meshColor1 = color.array;
    const meshColor2 = color2.array;
    const idxColors = instanceIndex * COL_SIZE;
    const numVertices = position.count; // That's the original number of vertices
    let numVerticesBeforeDividingLine = 0;
    let numVerticesAfterDividingLine = 0;
    // Special formulas that correctly calculates number of vertices for closed and opened cylinders
    if (model.closedCylinder) {
      numVerticesBeforeDividingLine = 2 * (numVertices - 2) / 5;
      numVerticesAfterDividingLine = (numVertices - 2) / 5;
    } else {
      numVerticesBeforeDividingLine = 2 * (numVertices) / 3;
      numVerticesAfterDividingLine = (numVertices) / 3;
    }
    // Collect colors for each half of cylinder
    const objectColor1 = this.reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]]);
    const objectColor2 = this.reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]]);
    const lColors1 = this.cloneColors(numVerticesBeforeDividingLine, objectColor1);
    let lColors2 = null;
    // Clone colors for one cylinder and for another
    if (!_.isEqual(objectColor1, objectColor2)) {
      lColors2 = this.cloneColors(numVerticesBeforeDividingLine, objectColor2);
    } else {
      lColors2 = this.cloneColors(numVerticesAfterDividingLine, objectColor2);
    }
    // Need to carefully process hats
    if (model.closedCylinder) {
      const additionalColors1 = this.cloneColors((numVertices - 2) / 5 + 1, objectColor1);
      const additionalColors2 = this.cloneColors((numVertices - 2) / 5 + 1, objectColor2);
      const additionalLColors = utils.ConcatTypedArraysUnsafe(additionalColors1, additionalColors2);
      const tubeColors = utils.ConcatTypedArraysUnsafe(lColors2, lColors1);
      return utils.ConcatTypedArraysUnsafe(tubeColors, additionalLColors);
    }
    return utils.ConcatTypedArraysUnsafe(lColors2, lColors1);
  }

  /**
   * From raw parameters in mesh create exact cylinder parameters
   * @param {Object} mesh - given mesh
   * @param {Number} instanceIndex - exact cylinder number in given mesh
   * @param {FBXCylinderGeometryModel} reworkedModel - Cylinder model where to write reworked parameters
   * @param {Array} lVertices - raw vertices from mesh
   * @param {Array} lIndices - raw indices from mesh
   * @param {Array} lNormals - raw normals from mesh
   * @param {boolean} needToDivideCylinders - flag "do we need to divide cylinders"
   */
  getReworkedAttributes(mesh, instanceIndex, reworkedModel, lVertices, lIndices, lNormals, needToDivideCylinders) {
    const [reworkedIndices, reworkedNormals, reworkedVertices] = reworkedModel.getArrays();
    const reworkedColors = this.getColors(mesh, instanceIndex, reworkedModel);
    reworkedModel.storeColors(reworkedColors);
    let indexVerticesNormalsArray = 0; // not using push
    let indexIndicesArray = 0;
    let indexAdditionalVertices = 0;
    let thirdOfTubeCylinderVertices = 0;
    let hatVertices = 0;
    let indicesBeforeDividingLine = 0;
    if (reworkedModel.closedCylinder) {
      thirdOfTubeCylinderVertices = 3 * (lVertices.length / 3 - 2) / 5;
      hatVertices = 2 * (thirdOfTubeCylinderVertices + 3);
      indicesBeforeDividingLine = 6 * thirdOfTubeCylinderVertices / 3;
    } else {
      thirdOfTubeCylinderVertices = lVertices.length / 3;
      indicesBeforeDividingLine = lIndices.length / 2;
    }
    // Step 1 : first chunk of vertices and  normals are copied directly
    this.copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 0, thirdOfTubeCylinderVertices);
    indexVerticesNormalsArray += this.copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 0, thirdOfTubeCylinderVertices);
    // Also copying half of tube indices because other half may have offset if cylinders will be expanded
    indexIndicesArray += this.copyArrays(reworkedIndices, indexIndicesArray, lIndices, 0, indicesBeforeDividingLine);
    /* Step 2 : adding new vertices and normals and also copying old
    * We can either full-copy middle vertices or copy them with some shift.
    * Here is first way - full copying without any shifts */
    const additionalVertices = [];
    const additionalNormals = [];
    this.copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
    indexVerticesNormalsArray += this.copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
    this.copyArrays(additionalVertices, indexAdditionalVertices, lVertices, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
    indexAdditionalVertices += this.copyArrays(additionalNormals, indexAdditionalVertices, lNormals, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
    // If we need to divide cylinders => we're adding additional vertices
    if (needToDivideCylinders) {
      reworkedVertices.set(additionalVertices, indexVerticesNormalsArray);
      reworkedNormals.set(additionalNormals, indexVerticesNormalsArray);
      indexVerticesNormalsArray += indexAdditionalVertices;
    }
    // Last chunk of vertices
    this.copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 2 * thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
    indexVerticesNormalsArray += this.copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 2 * thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
    // If we have closed cylinder => we must add last vertices
    if (reworkedModel.closedCylinder) {
      this.copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 3 * thirdOfTubeCylinderVertices, hatVertices);
      this.copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 3 * thirdOfTubeCylinderVertices, hatVertices);
    }
    // Adding last portion of indices simply as first chunk of indices but with some special addition if needed
    let offsetIndices = thirdOfTubeCylinderVertices / 3;
    if (needToDivideCylinders) {
      offsetIndices = 2 * thirdOfTubeCylinderVertices / 3;
    }
    indexIndicesArray += this.copyArrays(reworkedIndices, indexIndicesArray, lIndices, 0, indicesBeforeDividingLine, offsetIndices);
    // If we have closed cylinder => must add last indices with offset
    if (reworkedModel.closedCylinder) {
      let closedCylinderOffset = 0;
      if (needToDivideCylinders) {
        closedCylinderOffset = thirdOfTubeCylinderVertices / 3;
      }
      this.copyArrays(reworkedIndices, indexIndicesArray, lIndices, 2 * indicesBeforeDividingLine, lIndices.length - 2 * indicesBeforeDividingLine, closedCylinderOffset);
    }
  }

  /**
   * Calculating max index in index array of given model. Behaviour is different for closed and open cylinders
   * @param {FBXCylinderGeometryModel} model - given model
   * @returns {number} max index in index array
   */
  getMaxIndexInModel(model) { // FIXME remove
    const indexArray = model.getArrays()[0];
    let maxIndex = indexArray[0];
    const indexArrayLength = indexArray.length;
    for (let i = 1; i < indexArrayLength; ++i) {
      if (indexArray[i] > maxIndex) {
        maxIndex = indexArray[i];
      }
    }
    if (model.closedCylinder) {
      return maxIndex + 1;
    }
    return maxIndex;
  }

  /**
   * Some finalization procedures
   * @param {Object} mesh - given mesh
   * @param {Number} maxIndexInModels - maximum index in models (to concatenate models)
   * @param {FBXCylinderGeometryModel} resultingModel - resulting cylinder model
   * @returns {Array} array of finalized indices, normals, vertices, colors
   */
  finalizeCylinderAttributes(mesh, maxIndexInModels, resultingModel) {
    const resVertices = resultingModel.getArrays()[2];
    const resNormals = resultingModel.getArrays()[1];
    const resColors = resultingModel.getArrays()[3];
    let resIndices = resultingModel.getArrays()[0];
    resIndices = resIndices.subarray(0, resultingModel.curResIndicesIndex);
    // Traverse all cells in array and add max index. For cells with negative numbers we must subtract maxIndex
    if (maxIndexInModels !== 0) {
      for (let k = 0; k < resIndices.length; ++k) {
        if (resIndices[k] >= 0) {
          resIndices[k] += (maxIndexInModels + 1);
        } else {
          resIndices[k] -= (maxIndexInModels + 1);
        }
      }
    }
    return [resVertices.subarray(0, resultingModel.curResVerticesIndex),
      resIndices,
      resColors.subarray(0, resultingModel.curResColorsIndex),
      resNormals.subarray(0, resultingModel.curResNormalsIndex)];
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
