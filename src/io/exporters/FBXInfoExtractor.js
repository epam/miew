import _ from 'lodash';
import * as THREE from 'three';

import gfxutils from '../../gfx/gfxutils';
import settings from '../../settings';
import logger from '../../utils/logger';

import FBXGeometry from './FBXGeometry';
import FBXModel from './FBXModel';
import ThickLineMesh from '../../gfx/meshes/ThickLineMesh';

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
   * Adding model to pool of models or extend existing ones
   * @param {Number} modelNumber - number of model-material pair
   * @param {object} model - given model
   * @param material - material of given model
   */
  _addToPool(model, material) {
    const materialIdx = this._checkExistingMaterial(material);
    if (materialIdx === this._models.length) { // new model-material pair
      model.reworkIndices();
      this._models.push(model);
      this._materials.push(material);
    } else { // add model to existing model-material pair
      const oldModel = this._models[materialIdx];
      oldModel.concatenate(model);
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
    const material = this.collectMaterialInfo(mesh);
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
    const instCount = mesh.geometry.maxInstancedCount;
    const vertCount = position.count;
    const indsCount = index.count;
    model.init(instCount * vertCount, instCount * indsCount);
    const geo = new FBXGeometry.OneColorGeo();
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
      this.getSphereInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      model.addInstance(objMatrix, geo);
    }
    const material = this.collectMaterialInfo(mesh);
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
    const instCount = mesh.geometry.maxInstancedCount;
    const oneCCylinder = new FBXGeometry.OneColorGeo();
    oneCCylinder.init(mesh.geometry);
    const splittingInfo = this._gatherCylindersColoringInfo(mesh.geometry);
    let twoCCylinder = null;
    if (splittingInfo.needToSplit > 0) {
      twoCCylinder = new FBXGeometry.TwoColoredCylinder();
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
        twoCCylinder.setColors(colorStart, colorEnd);
        geo = twoCCylinder;
      } else {
        // has one color per cylinder
        colorStart.fromArray(color.array, colorIdx);
        oneCCylinder.setColors(colorStart);
        geo = oneCCylinder;
      }
      // add instance to the model
      this.getCylinderInstanceMatrix(mesh.geometry, instanceIndex, instMatrix);
      objMatrix.multiplyMatrices(matrix, instMatrix);
      model.addInstance(objMatrix, geo);
    }
    const material = this.collectMaterialInfo(mesh);
    this._addToPool(model, material);
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
    if (mesh.geometry.isInstancedBufferGeometry && settings.now.zSprites) {
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
