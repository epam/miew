import _ from 'lodash';
import * as THREE from 'three';

import utils from '../../../utils';
import gfxutils from '../../../gfx/gfxutils';
import logger from '../../../utils/logger';

import FBXModel from './FBXModel';
import ThickLineMesh from '../../../gfx/meshes/ThickLineMesh';
import ZSpriteMesh from '../../../gfx/meshes/ZSpriteMesh';
import InstancedSpheresGeometry from '../../../gfx/geometries/InstancedSpheresGeometry';
import Instanced2CCylindersGeometry from '../../../gfx/geometries/Instanced2CCylindersGeometry';
import FBX1CGeometry from './FBX1CGeometry';
import FBX2CCylinder from './FBX2CCylinder';

export default class FBXInfoExtractor {
  constructor() {
    this._materials = [];
    this._models = [];
  }

  process(data) {
    this._extractModelsAndMaterials(data);
    const models = this._flattenModels();

    return {
      name: data.name,
      models,
      materials: this._materials,
    };
  }

  /**
   * Extract fbx object information from ComplexVisual
   * @param {object} data - complexVisual to get geometry info from
   */
  _extractModelsAndMaterials(data) {
    const layersOfInterest = new THREE.Layers();
    layersOfInterest.set(gfxutils.LAYERS.DEFAULT);
    layersOfInterest.enable(gfxutils.LAYERS.TRANSPARENT);
    data.traverse((object) => {
      if (object instanceof THREE.Mesh && object.layers.test(layersOfInterest) && this.checkExportAbility(object)) {
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
   * basically, every triangle in Miew has been represented hat way (e.g.) : 0,1,7, but we must (for FBX) rework that
   * into: 0,1,-8.
   * @param {array} indices - belongs to [0, maxVertIndex]
   */
  _reworkIndices(indices) {
    const faceSize = 3;
    for (let i = faceSize - 1; i < indices.length; i += faceSize) {
      indices[i] *= -1;
      indices[i]--;
    }
  }

  /**
   * Combine geometry from several models having the same material into one Model and finally prepare indices
    * @returns {array} models, combined by material id
   */
  _flattenModels() {
    let overallVertsCount = 0;
    function shift(x) {
      return x + overallVertsCount;
    }
    const combined = [];
    // flatten models geometry
    for (let i = 0, n = this._models.length; i < n; i++) {
      const models = this._models[i];
      let indices = [];
      let positions = [];
      let normals = [];
      let colors = [];
      // reorganize every attributes as array of arrays
      overallVertsCount = 0;
      for (let j = 0; j < models.length; j++) {
        const m = models[j];
        indices.push(m.indices.map(shift));
        overallVertsCount += m.getVerticesNumber();
        positions.push(m.positions);
        normals.push(m.normals);
        colors.push(m.colors);
      }
      // join all subarrays into one
      indices = utils.mergeTypedArraysUnsafe(indices);
      this._reworkIndices(indices);
      positions = utils.mergeTypedArraysUnsafe(positions);
      normals = utils.mergeTypedArraysUnsafe(normals);
      colors = utils.mergeTypedArraysUnsafe(colors);
      combined.push({
        indices,
        positions,
        normals,
        colors,
        verticesCount: overallVertsCount,
      });
    }
    return combined;
  }

  /**
   * Check ability to export the kind of mesh.
   * @param {object} mesh - given mesh to check
   * @returns {boolean} result of check
   */
  checkExportAbility(mesh) {
    // check mesh on not being empty
    if (mesh.geometry.attributes.position.count === 0) {
      return false;
    }
    // check type of mesh
    // if (mesh.geometry.isInstancedBufferGeometry && settings.now.zSprites) {
    if (mesh instanceof ZSpriteMesh) {
      logger.warn('Currently we cannot export \'sprites\' modes, like BS, WV, LC. Please turn of settings \'zSprites\' and try again');
      return false;
    }
    if (mesh instanceof ThickLineMesh) {
      logger.warn('Currently we cannot export Lines mode');
      return false;
    }
    return true;
  }

  /**
   * Save geometry info from common mesh, like Surface or Cartoon
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

    const model = new FBXModel();
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
    const material = this._collectMaterialInfo(mesh);
    this._addToPool(model, material);
  }

  /**
   * Collect instanced spheres geometry and materials.
   * @param {object} mesh - mesh with instanced spheres info
   */
  _collectSpheresInfo(mesh) {
    const {
      geometry: {
        attributes: {
          position,
          color,
        },
        index,
      },
      matrix,
    } = mesh;

    const model = new FBXModel();
    const instCount = mesh.geometry.instanceCount;
    const vertCount = position.count;
    const indsCount = index.count;
    model.init(instCount * vertCount, instCount * indsCount);
    const geo = new FBX1CGeometry();
    geo.init(mesh.geometry);
    const instMatrix = new THREE.Matrix4();
    const objMatrix = new THREE.Matrix4();
    const sphereColor = new THREE.Color();
    for (let instanceIndex = 0; instanceIndex < instCount; ++instanceIndex) {
      // update colors in geometry
      const colorIdx = instanceIndex * color.itemSize;
      sphereColor.fromArray(color.array, colorIdx);
      geo.setColors(sphereColor);
      // add instance to the model
      this._getSphereInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      model.addInstance(objMatrix, geo);
    }
    const material = this._collectMaterialInfo(mesh);
    this._addToPool(model, material);
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
          position,
          color,
          color2,
        },
        index,
      },
      matrix,
    } = mesh;

    const model = new FBXModel();
    const instCount = mesh.geometry.instanceCount;
    const oneCCylinder = new FBX1CGeometry();
    oneCCylinder.init(mesh.geometry);
    const splittingInfo = this._gatherCylindersColoringInfo(mesh.geometry);
    let twoCCylinder = null;
    if (splittingInfo.needToSplit > 0) {
      twoCCylinder = new FBX2CCylinder();
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
        colorStart.fromArray(color2.array, colorIdx);
        colorEnd.fromArray(color.array, colorIdx);
        if (twoCCylinder) {
          twoCCylinder.setColors(colorStart, colorEnd);
          geo = twoCCylinder;
        }
      } else {
        // has one color per cylinder
        colorStart.fromArray(color.array, colorIdx);
        oneCCylinder.setColors(colorStart);
        geo = oneCCylinder;
      }
      // add instance to the model
      this._getCylinderInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      model.addInstance(objMatrix, geo);
    }
    const material = this._collectMaterialInfo(mesh);
    this._addToPool(model, material);
  }

  /**
   * Adding model to pool of models or extend existing ones
   * @param {object} model - model to add
   * @param {object} material - material to add
   */
  _addToPool(model, material) {
    const materialIdx = this._checkExistingMaterial(material);
    if (materialIdx < 0) { // new model-material pair
      this._models.push([model]);
      this._materials.push(material);
    } else { // add model to existing model-material pair
      const models = this._models[materialIdx];
      models.push(model);
    }
  }

  /**
   * Checking if given material already was registered in materials pool (no need to create new one)
   * @param {object} material - given material
   * @returns {number} number of model-material pair
   */
  _checkExistingMaterial(material) {
    return _.findIndex(this._materials, (m) => _.isEqual(m, material));
  }

  _gatherCylindersColoringInfo(geo) {
    const instCount = geo.instanceCount;
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
    if (mesh.geometry instanceof InstancedSpheresGeometry) {
      this._collectSpheresInfo(mesh);
    } else if (mesh.geometry instanceof Instanced2CCylindersGeometry) {
      this._collectCylindersInfo(mesh);
    }
  }

  /**
   * Collect Material info from given mesh.
   * @param {object} mesh - given mesh with material info
   * @returns {object} material
   */
  _collectMaterialInfo(mesh) {
    const { uberOptions } = mesh.material;
    return ({
      diffuse: uberOptions.diffuse.toArray(),
      opacity: uberOptions.opacity,
      shininess: uberOptions.shininess,
      specular: uberOptions.specular.toArray(),
    });
  }

  _getCylinderInstanceMatrix(geo, instIdx, matrix) {
    const matVector1 = geo.attributes.matVector1.array;
    const matVector2 = geo.attributes.matVector2.array;
    const matVector3 = geo.attributes.matVector3.array;
    const idxOffset = instIdx * 4; // used 4 because offset arrays are stored in quads
    matrix.set(
      matVector1[idxOffset],
      matVector1[idxOffset + 1],
      matVector1[idxOffset + 2],
      matVector1[idxOffset + 3],
      matVector2[idxOffset],
      matVector2[idxOffset + 1],
      matVector2[idxOffset + 2],
      matVector2[idxOffset + 3],
      matVector3[idxOffset],
      matVector3[idxOffset + 1],
      matVector3[idxOffset + 2],
      matVector3[idxOffset + 3],
      0,
      0,
      0,
      1,
    );
  }

  _getSphereInstanceMatrix(geo, instIdx, matrix) {
    const { offset } = geo.attributes;
    const idx = instIdx * offset.itemSize;
    const x = offset.array[idx];
    const y = offset.array[idx + 1];
    const z = offset.array[idx + 2];
    const scale = offset.array[idx + 3];
    matrix.set(
      scale,
      0,
      0,
      x,
      0,
      scale,
      0,
      y,
      0,
      0,
      scale,
      z,
      0,
      0,
      0,
      1,
    );
  }
}
