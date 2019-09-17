import * as THREE from 'three';
import _ from 'lodash';
import Exporter from './Exporter';
import FBXUtils from './FBXExporterUtils';
import FBXCylinderGeometryModel from './FBXCylinderGeometryModel';
import utils from '../../utils';
// import gfxutils from '../../gfx/gfxutils';

/**
 * FBX file format exporter.
 *
 * @param {}     -
 *
 * @exports FBXExporter
 * @constructor
 */
export default class FBXExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    // Data
    this._data = source;
    // Misc
    this._materials = [];
    this._models = [];
  }

  /**
   * Add FBXHeader info to output file.
   * Some fields are really confusing, but it seems that all listed fields are very informative
   */
  createFBXHeader() {
    // For some reasons, without specified comment at the start of the file it wont work. Do not touch please.
    const mandatoryComment = `; FBX 6.1.0 project file
; Created by Miew FBX Exporter
; For support please contact miew@epam.com
; ----------------------------------------------------
`;
    const FBXHeaderVersion = 1003; // 1003 is some number which appears to present in many 6.1 ASCII files
    const FBXVersion = 6100; // Mandatory and only supported version
    const currentDate = new Date();
    const timeStampVersion = 1000;
    const Creator = 'Miew FBX Exporter v.0.1'; // Supposed to be an engine
    const OtherFlags = { // Really dont know what is is. Looks like it is not mandatory, but left as potential future thingy
      FlagPLE: 0,
    };
    const CreatorTool = 'Miew FBX Exporter v.0.1'; // Supposed to be exact exporter tool

    const extension = `
FBXHeaderExtension:  {
  FBXHeaderVersion: ${FBXHeaderVersion}
    FBXVersion: ${FBXVersion}
        CreationTimeStamp:  {
        Version: ${timeStampVersion}
          Year: ${currentDate.getFullYear()}
          Month: ${currentDate.getMonth()}
          Day: ${currentDate.getDay()}
          Hour: ${currentDate.getHours()}
          Minute: ${currentDate.getMinutes()}
          Second: ${currentDate.getSeconds()}
          Millisecond: ${currentDate.getMilliseconds()}
        }
        Creator: "${Creator}"
        OtherFlags:  {
          FlagPLE: ${OtherFlags.FlagPLE}
        }
}
CreationTime: "${currentDate}"
Creator: "${CreatorTool}"
      
`;

    return mandatoryComment + extension; // Hereby and further we're using concatenation oppose to .join. See https://jsperf.com/javascript-concat-vs-join/7
  }

  /**
   * Add Definitions info to output file.
   * Not exactly sure if this section is template section (as it is in 7.4+) or it should every time be like this
   */
  createDefinitions() {
    const mandatoryComment = `; Object definitions
;------------------------------------------------------------------

`;
    const definitions = FBXUtils.defaultDefinitions();
    return mandatoryComment + definitions;
  }

  /**
   * Adding gathered information about Models to resulting string.
   * Reminder - there may be more then 1 model in scene, but we must place materials after ALL models.
   * @returns {string} string containing all models (vertices, indices, colors, normals etc)
   */
  _addModelsToResult() {
    console.log('Models started');
    let allModels = '';
    for (let i = 0; i < this._models.length; ++i) {
      const model = this._models[i];
      const modelName = `Model::${this._data.name}_${i}`;
      const Version = 232; // Mystery number, but it left like that as it all works with it
      // Setting up default properties
      const modelProperties = `  Model: "${modelName}", "Mesh" {
          Version: ${Version}
      ${FBXUtils.defaultProperties}`;
      // Setting up vertices + indices
      const verticesIndices = FBXUtils.addVerticesIndices(model.vertices, model.indices);
      // Setting up layers
      // Some positions are still not quite easy to understand, and as soon as it will not crash without them - they will be set with some default values
      const normalLayer = FBXUtils.normalLayer(model.normals);
      const colorLayer = FBXUtils.colorLayer(model.colors);
      const materialLayer = FBXUtils.defaultMaterialLayer;
      // Do we need automatically check and build this info? In Miew we always have these layers
      const layer = FBXUtils.defaultLayerBlock;
      const resultingLayer = normalLayer + colorLayer + materialLayer + layer;
      allModels += (modelProperties + verticesIndices + resultingLayer);
    }
    console.log('Models done');
    return allModels;
  }

  /**
   * Add Material info to result
   */
  _addMaterialsToResult() {
    const materialVersion = 102;
    let allMaterials = '';
    for (let i = 0; i < this._materials.length; ++i) {
      const material = this._materials[i];
      const stringMaterial = `  Material: "Material::${this._data.name}_${i}_default", "" {
          Version: ${materialVersion}
          ShadingModel: "lambert"
          MultiLayer: 0
      ${FBXUtils.materialProperties(material)}`;
      allMaterials += stringMaterial;
    }
    return allMaterials;
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
    // completely new element
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
    return (this._models[modelNumber].vertices.length / 3 - 1);
  }

  /**
   * Adding model to pool of models or extend existing ones
   * @param {Number} modelNumber - number of model-material pair
   * @param {object} model - given model
   * @param material - material of given model
   */
  _addModelToPool(modelNumber, model, material) {
    // If that's new model
    if (this._models.length === modelNumber) {
      this._models.push(model);
      this._materials.push(material);
    } else {
      // Adding new vertices etc to existing model
      // Reminder - this way is better in sense of performance
      const oldModel = this._models[modelNumber];
      const newVertices = utils.TypedArrayConcat(oldModel.vertices, model.vertices);
      const newNormals = utils.TypedArrayConcat(oldModel.normals, model.normals);
      const newColors = utils.TypedArrayConcat(oldModel.colors, model.colors);
      const newIndices = utils.TypedArrayConcat(oldModel.indices, model.indices);
      this._models[modelNumber] = {
        vertices: newVertices,
        indices: newIndices,
        normals: newNormals,
        colors: newColors,
      };
    }
  }

  /**
   * Save geometry info from mesh to this._models.
   */
  _collectStraightGeometryInfo(mesh) {
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
    // Firstly extract material information, if it's already in the base we will add to already existing model
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    let lColors = [];
    // Collect info about vertices + indices + material
    let lNormals = null;
    let lVertices = null;
    // If we have not instanced, but transformed group (e.g. viruses) then we must multiply every vertex by special matrix
    if (matrix.equals(new THREE.Matrix4().identity())) {
      lVertices = position.array; // Vertices either way are copying directly
      lNormals = normal.array;
    } else {
      [lVertices, lNormals] = FBXUtils.applyMatrixToVerticesNormals(matrix, _.cloneDeep(position.array), _.cloneDeep(normal.array));
    }
    // Different style with indices - if we have modelNumber => we must to add indices to existing ones
    const maxIndex = this._calculateMaxIndex(modelNumber);
    let lIndices = Int32Array.from(_.cloneDeep(index.array));
    if (maxIndex !== 0) {
      for (let i = 0; i < lIndices.length; ++i) {
        lIndices[i] += maxIndex + 1;
      }
    }
    lIndices = FBXUtils.reworkIndices(lIndices); // Need to rework this into FBX notation
    if (color.array.length >= 1) {
      lColors = FBXUtils.reworkColors(color.array); // Need to rework this into FBX notation
    }
    // We have now all information about model, let's add to existing one if it's here
    if (lVertices.length > 0 && lIndices.length > 0 && lNormals.length > 0 && lColors.length > 0) {
      const model = {
        vertices: lVertices,
        indices: lIndices,
        normals: lNormals,
        colors: lColors,
      };
      this._addModelToPool(modelNumber, model, material);
    } // else do nothing. Some meshes does not have any vertices so why would we add them here?
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
        },
        index,
      },
      matrix,
    } = mesh;
    // Firstly extract material information, if it's already in the base we will add to already existing model
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    let idxOffset = 0;
    const meshOffset = offset.array;
    const numInstances = offset.count;
    const numVertices = position.array.length / 3;
    const numIndices = index.array.length;
    // Geometry info
    const resVertices = new Float32Array(numInstances * numVertices * 3); // XYZ for every vertex
    const resIndices = new Float32Array(numInstances * numIndices);
    const resNormals = new Float32Array(numInstances * numVertices * 3);
    const resColors = new Float32Array(numInstances * numVertices * 4); // RGBA for every vertex
    for (let instanceIndex = 0; instanceIndex < numInstances; ++instanceIndex) {
      // Firstly, collect some basic instanced parameters */
      let lVertices = _.cloneDeep(position.array);
      let lNormals = _.cloneDeep(normal.array);
      const lIndices = this._collectInstancedIndices(mesh, instanceIndex);
      const lColors = FBXUtils.collectInstancedColors(mesh, instanceIndex);
      // Extract offset for one exact object (instance)
      const objectOffset = new THREE.Vector4(meshOffset[idxOffset], meshOffset[idxOffset + 1],
        meshOffset[idxOffset + 2], meshOffset[idxOffset + 3]);
      idxOffset += 4;
      // For every vertex calculate it's real position (vertex.xyz * scale) + offset
      for (let j = 0; j < lVertices.length; j += 3) {
        lVertices[j] = ((lVertices[j] * objectOffset.w) + objectOffset.x);
        lVertices[j + 1] = ((lVertices[j + 1] * objectOffset.w) + objectOffset.y);
        lVertices[j + 2] = ((lVertices[j + 2] * objectOffset.w) + objectOffset.z);
      }
      // If not only we have instanced, but also a transformed group (e.g. viruses) then we must multiply every vertex by special matrix
      if (!matrix.equals(new THREE.Matrix4().identity())) {
        [lVertices, lNormals] = FBXUtils.applyMatrixToVerticesNormals(matrix, _.cloneDeep(lVertices), _.cloneDeep(lNormals));
      }
      // Saving info from one instance to resulting model
      resVertices.set(lVertices, instanceIndex * numVertices * 3);
      resNormals.set(lNormals, instanceIndex * numVertices * 3);
      resColors.set(lColors, instanceIndex * numVertices * 4);
      resIndices.set(lIndices, instanceIndex * numIndices);
      // Debug purposes
      /* if (instanceIndex % 1000 === 0) {
        console.log(`${instanceIndex} out of ${numInstances} spheres done`);
      } */
    }
    const model = {
      vertices: resVertices,
      indices: resIndices,
      normals: resNormals,
      colors: resColors,
    };
    this._addModelToPool(modelNumber, model, material);
  }

  /**
   * Collect and rework indices in big model notation.
   * @param {object} mesh - mesh with instanced objects
   * @param {Number} instance - number of instance in mesh
   * @returns {Int32Array} array of gathered indices
   */
  _collectInstancedIndices(mesh, instance) {
    const {
      geometry: {
        attributes: {
          position,
        },
        index,
      },
    } = mesh;
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    const maxIndexInModels = this._calculateMaxIndex(modelNumber);
    const lIndices = Int32Array.from(_.cloneDeep(index.array));
    // As we making one big model we need to carefully add resVertices.length to every index in lIndices
    // Algorithm below is a bit cognitively complicated, maybe refactor here at some point?
    const maxIndex = position.array.length / 3 - 1;
    let changeIndex = 2;
    for (let k = 0; k < lIndices.length; ++k) {
      // If it's first model - no need to add "+ 1", if not - need that + 1
      if (maxIndexInModels !== 0) {
        lIndices[k] += (instance * (maxIndex + 1) + maxIndexInModels + 1);
      } else {
        lIndices[k] += (instance * (maxIndex + 1));
      }
      if (k === changeIndex) { // Need to rework this into FBX notation
        lIndices[k] *= -1;
        lIndices[k]--;
        changeIndex += 3;
      }
    }
    return lIndices;
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
    const material = FBXUtils.collectMaterialInfo(mesh);
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
      let [lVertices, lNormals] = FBXUtils.calculateCylinderTransform(mesh, instanceIndex);
      if (!matrix.equals(new THREE.Matrix4().identity())) {
        [lVertices, lNormals] = FBXUtils.applyMatrixToVerticesNormals(matrix, _.cloneDeep(lVertices), _.cloneDeep(lNormals));
      }
      // Okay now vertices are reworked as we want them. Now it's time for implementing algorithm
      // Collect indices for given cylinder - remember: they may slightly change later on
      let lIndices = Int32Array.from(_.cloneDeep(index.array));
      // As we making one big model we need to carefully add numVertices to every index in lIndices. Remember - need to add additional vertices as we add them!
      if (!firstInstance) {
        for (let k = 0; k < lIndices.length; ++k) {
          lIndices[k] += (maxIndex + 1);
        }
      } else {
        firstInstance = false;
      }
      lIndices = FBXUtils.reworkIndices(lIndices); // Need to rework this into FBX notation
      // Do we need to divide cylinders? It depends on colors of each half of cylinder
      const needToDivideCylinders = FBXUtils.decideSeparation(mesh, instanceIndex);
      let reworkedModel = regularModel;
      // if we dont need to divide cylinders then we dont need extended arrays
      if (needToDivideCylinders) {
        reworkedModel = extendedModel;
      }
      // Getting new vertices etc
      FBXUtils.getReworkedParameters(mesh, instanceIndex, reworkedModel, lVertices, lIndices, lNormals, needToDivideCylinders);
      maxIndex = FBXUtils.getMaxIndexInModel(reworkedModel);
      // Saving info from one instance to resulting model
      resultingModel.storeResults(reworkedModel);
      // IFDEF DEBUG
      if (instanceIndex % 1000 === 0) {
        console.log(`${instanceIndex} out of ${numInstances} cylinders done`);
      }
    }
    // Need to delete all zeros from the end of resArrays
    const [resVertices, resIndices, resColors, resNormals] = FBXUtils.finalizeCylinderParameters(mesh, maxIndexInModels, resultingModel);
    const model = {
      vertices: resVertices,
      indices: resIndices,
      normals: resNormals,
      colors: resColors,
    };
    this._addModelToPool(modelNumber, model, material);
  }

  /**
   * Collect instanced models and materials.
   * @param {object} mesh - given mesh with instanced something (spheres or cylinders)
   */
  _collectInstancedInfo(mesh) {
    if (mesh.geometry.constructor.name.includes('Spheres')) {
      this._collectSpheresInfo(mesh);
    } else if (mesh.geometry.constructor.name.includes('Cylinder')) {
      this._collectCylindersInfo(mesh);
    }
  }

  /**
   * Add Models and materials info to output file.
   */
  _addModelsAndMaterials() {
    // To gather all mesh attributes (vertices, indices, etc) we need to traverse this._data object
    this._data.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const mesh = object;
        // if (mesh.layers.test(gfxutils.LAYERS.DEFAULT) || mesh.layers.test(gfxutils.LAYERS.TRANSPARENT)) { /* It means something */
        if (mesh.layers.mask === 1 || mesh.layers.mask === 4) { /* How can we use .test method from threejs layers if LAYERS isn't treejs layers? 1 is default, 4 is transparent */
          if (mesh.geometry.type === 'InstancedBufferGeometry') {
            this._collectInstancedInfo(mesh);
          } else {
            this._collectStraightGeometryInfo(mesh);
          }
          console.log('mesh is done');
        }
      }
    });
    return this._addModelsToResult() + this._addMaterialsToResult();
  }

  /**
   * Add GlobalSettings info to output file.
   */
  _addGlobalSettings() {
    const gSettings = `{
         Version: 1000
         Properties60:  {
            Property: "UpAxis", "int", "",1
            Property: "UpAxisSign", "int", "",1
            Property: "FrontAxis", "int", "",2
            Property: "FrontAxisSign", "int", "",1
            Property: "CoordAxis", "int", "",0
            Property: "CoordAxisSign", "int", "",1
            Property: "UnitScaleFactor", "double", "",1
         }
      }
}

`;
    return gSettings;
  }


  /**
   * Add Objects info to output file.
   */
  createObjects() {
    const mandatoryComment = `; Object properties
;------------------------------------------------------------------

`;
    const result = `Objects:  {
      ${this._addModelsAndMaterials()}  GlobalSettings: ${this._addGlobalSettings()}`;
    return mandatoryComment + result;
  }

  /**
   * Add Relations info to output file.
   */
  createRelations() {
    const mandatoryComment = `; Object relations
;------------------------------------------------------------------

`;
    let modelsList = '';
    for (let i = 0; i < this._models.length; ++i) {
      modelsList += `  Model: "Model::${this._data.name}_${i}", "Mesh" {
        }
      `;
    }
    let materialList = '';
    for (let i = 0; i < this._materials.length; ++i) {
      materialList += `  Material: "Material::${this._data.name}_${i}_default", "" {
  }
`;
    }
    const relations = `Relations:  {\n${modelsList}  Model: "Model::Producer Perspective", "Camera" {
      }
      Model: "Model::Producer Top", "Camera" {
      }
      Model: "Model::Producer Bottom", "Camera" {
      }
      Model: "Model::Producer Front", "Camera" {
      }
      Model: "Model::Producer Back", "Camera" {
      }
      Model: "Model::Producer Right", "Camera" {
      }
      Model: "Model::Producer Left", "Camera" {
      }
      Model: "Model::Camera Switcher", "CameraSwitcher" {
      }
    ${materialList}}

`;
    return mandatoryComment + relations;
  }

  /**
   * Add Connections info to output file.
   */
  createConnections() {
    const mandatoryComment = `; Object connections
;------------------------------------------------------------------

`;
    let modelsList = '';
    for (let i = 0; i < this._models.length; ++i) {
      modelsList += `  Connect: "OO", "Model::${this._data.name}_${i}", "Model::Scene"\n`;
    }
    let materialList = '';
    for (let i = 0; i < this._materials.length; ++i) {
      materialList += `  Connect: "OO", "Material::${this._data.name}_${i}_default", "Model::${this._data.name}_${i}"\n`;
    }
    const connections = `Connections:  {\n${modelsList}${materialList}}
`;
    return mandatoryComment + connections;
  }

  /**
   * Add Animation info to output file.
   */
  createAnimation() {
    return '';
  }

  /**
   * Entry point to exporter.
   */
  exportSync() {
    // Creating mandatory blocks for .fbx files:
    const header = this.createFBXHeader(); // FBXHeader block
    const definitions = this.createDefinitions(); // Definitions block
    const objects = this.createObjects(); // Objects - Models and Materials block
    const relations = this.createRelations(); // Relations block
    const connections = this.createConnections(); // Connections (e.g. between models and materials)
    const animation = this.createAnimation(); // Animation and takes block (currently empty)
    return header + definitions + objects + relations + connections + animation;
  }
}

FBXExporter.formats = ['fbx'];
