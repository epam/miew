import * as THREE from 'three';
import _ from 'lodash';
import Exporter from './Exporter';
import ZClippedMesh from '../../gfx/meshes/ZClippedMesh';
import utils from '../../utils';
import FBXUtils from './FBXExporterUtils';

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
    /* Data */
    this._data = source;
    /* Misc */
    this._materials = [];
    this._models = [];
  }

  /**
   * Add FBXHeader info to output file.
   * Some fields are really confusing, but it seems that all listed fields are very informative
   */
  createFBXHeader() {
    /* For some strange reasons, without specified comment at the start of the file it wont work. Do not touch please. */
    const mandatoryComment = '; FBX 6.1.0 project file\n'
    + '; Created by Miew FBX Exporter\n'
    + '; For support please contact miew@epam.com\n'
    + '; ----------------------------------------------------\n\n';
    const FBXHeaderVersion = 1003; /* 1003 is some number which appears to present in many 6.1 ASCII files */
    const FBXVersion = 6100; /* Mandatory and only supported version */
    const currentDate = new Date();
    const CreationTimeStamp = { /* Seems like mandatory object to be */
      Version: 1000,
      Year: currentDate.getFullYear(),
      Month: currentDate.getMonth(),
      Day: currentDate.getDay(),
      Hour: currentDate.getHours(),
      Minute: currentDate.getMinutes(),
      Second: currentDate.getSeconds(),
      Millisecond: currentDate.getMilliseconds(),
    };
    const Creator = 'Miew FBX Exporter v.0.1'; /* Supposed to be an engine */
    const OtherFlags = { /* Really dont know what is is. Looks like it is not mandatory, but left as potential future thingy */
      FlagPLE: 0,
    };
    const CreatorTool = 'Miew FBX Exporter v.0.1'; /* Supposed to be exact exporter tool */
    const CreationTime = currentDate; /* Seems like unnecessary repeating of creationTimeStamp */

    const extension = 'FBXHeaderExtension:  {\n'
      + `\tFBXHeaderVersion: ${FBXHeaderVersion}\n`
      + `\tFBXVersion: ${FBXVersion}\n`
      + '\tCreationTimeStamp:  {\n'
      + `\t\tVersion: ${CreationTimeStamp.Version}\n`
      + `\t\tYear: ${CreationTimeStamp.Year}\n`
      + `\t\tMonth: ${CreationTimeStamp.Month}\n`
      + `\t\tDay: ${CreationTimeStamp.Day}\n`
      + `\t\tHour: ${CreationTimeStamp.Hour}\n`
      + `\t\tMinute: ${CreationTimeStamp.Minute}\n`
      + `\t\tSecond: ${CreationTimeStamp.Second}\n`
      + `\t\tMillisecond: ${CreationTimeStamp.Millisecond}\n`
      + '\t}\n'
      + `\tCreator: "${Creator}"\n`
      + '\tOtherFlags:  {\n'
      + `\t\tFlagPLE: ${OtherFlags.FlagPLE}\n`
      + '\t}\n'
      + '}\n'
      + `CreationTime: "${CreationTime}"\n`
      + `Creator: "${CreatorTool}"\n\n`;

    return mandatoryComment + extension; /* Hereby and further we're using concatenation oppose to .join. See https://jsperf.com/javascript-concat-vs-join/7 */
  }

  /**
   * Add Definitions info to output file.
   * Not exactly sure if this section is template section (as it is in 7.4+) or it should every time be like this
   */
  createDefinitions() {
    const Version = 100; /* Mystery 100, but appears that it's not checked properly */
    const count = 3; /* Biggest mystery here. Every 6.1. file has this field = 3. Why?  I think that here must be
    some sort of 'let count = calculateCount()' or something, cos i _think_ that it's object, geometry,material etc count */
    /* Then we must know how many and exactly what Object Types there are */
    /* Next variable (objectTypes) is left only because we might in some distant future automatically generate this section. */
    // const objectTypes = []; /* Somewhat like 'let objectTypes = getObjectTypes()' or something. What about count of that objects? */
    const mandatoryComment = '; Object definitions\n'
     + ';------------------------------------------------------------------\n\n';
    /* Seems like this numbers didn't affect anything, so this section left because everything working with it looking that way */
    const definitions = 'Definitions:  {\n'
      + `\tVersion: ${Version}\n`
      + `\tCount: ${count}\n`
      + '\tObjectType: "Model" {\n'
      + '\t\tCount: 1\n'
      + '\t}\n'
      + '\tObjectType: "Geometry" {\n'
      + '\t\tCount: 1\n'
      + '\t}\n'
      + '\tObjectType: "Material" {\n'
      + '\t\tCount: 1\n'
      + '\t}\n'
      + '\tObjectType: "Pose" {\n'
      + '\t\tCount: 1\n'
      + '\t}\n'
      + '\tObjectType: "GlobalSettings" {\n'
      + '\t\tCount: 1\n'
      + '\t}\n'
      + '}\n\n';
    return mandatoryComment + definitions;
  }

  /**
   * Adding gathered information about Models to resulting string.
   * Reminder - there may be more then 1 model in scene, but we must place materials after ALL models.
   * @returns {string} string containing all models (vertices, indices, colors, normals etc)
   */
  _addModelsToResult() {
    let allModels = '';
    for (let i = 0; i < this._models.length; ++i) {
      const model = this._models[i];
      const modelName = `Model::${this._data.name}_${i}`;
      const Version = 232; /* Mystery number */
      /* Setting up default properties */
      const modelProperties = `\tModel: "${modelName}", "Mesh" {\n`
        + `\t\tVersion: ${Version}\n`
        + `${FBXUtils.defaultProperties}`;
      /* Setting up vertices + indices */
      const verticesIndices = FBXUtils.addVerticesIndices(model.vertices, model.indices);
      /* Setting up layers
      * Some positions are still not quite easy to understand, and as soon as it will not crash without them - they will be set with some default values */
      const layerElementNormal = FBXUtils.normalLayer(model.normals);
      /* next few layerElements are not in use, but we left it for maybe further compatibility */
      const layerElementSmoothing = '';
      const layerElementUV = '';
      const layerElementTexture = '';
      /* but colors and materials are actually in-use */
      const layerElementColor = FBXUtils.colorLayer(model.colors);
      const layerElementMaterial = FBXUtils.defaultMaterialLayer;
      /* Do we need automatically check and build this info? In Miew we always have these layers */
      const layer = FBXUtils.defaultLayerBlock;
      // this._models[i] = null; /* That's free i guess? */
      const resultingLayer = layerElementNormal + layerElementSmoothing + layerElementUV + layerElementTexture + layerElementColor + layerElementMaterial + layer;
      allModels += (modelProperties + verticesIndices + resultingLayer);
    }
    // console.log('Models done');
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
      const stringMaterial = `\tMaterial: "Material::${this._data.name}_${i}_default", "" {\n`
        + `\t\tVersion: ${materialVersion}\n`
        + '\t\tShadingModel: "lambert"\n'
        + '\t\tMultiLayer: 0\n'
        + '\t\tProperties60:  {\n'
        + '\t\t\tProperty: "ShadingModel", "KString", "", "Lambert"\n'
        + '\t\t\tProperty: "MultiLayer", "bool", "",0\n'
        + '\t\t\tProperty: "EmissiveColor", "ColorRGB", "",0,0,0\n'
        + '\t\t\tProperty: "EmissiveFactor", "double", "",0.0000\n'
        + '\t\t\tProperty: "AmbientColor", "ColorRGB", "",1,1,1\n'
        + '\t\t\tProperty: "AmbientFactor", "double", "",0.0000\n'
        + `\t\t\tProperty: "DiffuseColor", "ColorRGB", "",${material.diffuse}\n`
        + '\t\t\tProperty: "DiffuseFactor", "double", "",1.0000\n'
        + '\t\t\tProperty: "Bump", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "TransparentColor", "ColorRGB", "",1,1,1\n'
        + '\t\t\tProperty: "TransparencyFactor", "double", "",0.0000\n'
        + `\t\t\tProperty: "SpecularColor", "ColorRGB", "",${material.specular}\n`
        + '\t\t\tProperty: "SpecularFactor", "double", "",1.0000\n'
        + `\t\t\tProperty: "ShininessExponent", "double", "",${material.shininess}\n`
        + '\t\t\tProperty: "ReflectionColor", "ColorRGB", "",0,0,0\n'
        + '\t\t\tProperty: "ReflectionFactor", "double", "",1\n'
        + '\t\t\tProperty: "Emissive", "ColorRGB", "",0,0,0\n'
        + '\t\t\tProperty: "Ambient", "ColorRGB", "",1,1,1\n'
        + `\t\t\tProperty: "Diffuse", "ColorRGB", "",${material.diffuse}\n`
        + `\t\t\tProperty: "Specular", "ColorRGB", "",${material.specular}\n`
        + `\t\t\tProperty: "Shininess", "double", "",${material.shininess}\n`
        + `\t\t\tProperty: "Opacity", "double", "",${material.opacity}\n`
        + '\t\t\tProperty: "Reflectivity", "double", "",0\n'
        + '\t\t}\n'
        + '\t}\n';
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
      if (JSON.stringify(material) === JSON.stringify(this._materials[i])) {
        return i;
      }
    }
    /* completely new element */
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
    /* If that's new model */
    if (this._models.length === modelNumber) {
      this._models.push(model);
      this._materials.push(material);
    } else {
      /* Adding new vertices etc to existing model
      * Reminder - this way is better in sense of performance */
      const oldModel = this._models[modelNumber];
      const newVertices = new Float32Array(oldModel.vertices.length + model.vertices.length);
      const newNormals = new Float32Array(oldModel.normals.length + model.normals.length);
      const newColors = new Float32Array(oldModel.colors.length + model.colors.length);
      const newIndices = new Int32Array(oldModel.indices.length + model.indices.length);
      newVertices.set(oldModel.vertices, 0);
      newVertices.set(model.vertices, oldModel.vertices.length);
      newNormals.set(oldModel.normals, 0);
      newNormals.set(model.normals, oldModel.normals.length);
      newColors.set(oldModel.colors, 0);
      newColors.set(model.colors, oldModel.colors.length);
      newIndices.set(oldModel.indices, 0);
      newIndices.set(model.indices, oldModel.indices.length);
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
    /* Firstly extract material information, if it's already in the base we will add to already existing model */
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    let lAlphas = [];
    let lColors = [];
    /* Collect info about vertices + indices + material */
    const lVertices = mesh.geometry.attributes.position.array; /* Vertices either way are copying directly */
    /* Different style with indices - if we have modelNumber => we must to add indices to existing ones */
    /* 1 loop? */
    const maxIndex = this._calculateMaxIndex(modelNumber);
    let lIndices = Int32Array.from(_.cloneDeep(mesh.geometry.index.array));
    if (maxIndex !== 0) {
      for (let i = 0; i < lIndices.length; ++i) {
        lIndices[i] += maxIndex + 1;
      }
    }
    lIndices = FBXUtils.reworkIndices(lIndices); /* Need to rework this into strange FBX notation */
    const lNormals = mesh.geometry.attributes.normal.array;
    /* For some surfaces which does not have alpha color arrays */
    if (!(mesh instanceof ZClippedMesh)) {
      lAlphas = mesh.geometry.attributes.alphaColor.array;
    }
    if (mesh.geometry.attributes.color.array.length >= 1) {
      lColors = FBXUtils.reworkColors(mesh.geometry.attributes.color.array, lAlphas); /* Need to rework this into strange FBX notation */
    }
    /* We have now all information about model, let's add to existing one if it's here */
    if (lVertices.length > 0 && lIndices.length > 0 && lNormals.length > 0 && lColors.length > 0) {
      const model = {
        vertices: lVertices,
        indices: lIndices,
        normals: lNormals,
        colors: lColors,
      };
      this._addModelToPool(modelNumber, model, material);
    } /* else do nothing. Some meshes does not have any vertices so why would we add them here? */
  }

  /**
   * Collect instanced spheres geometry and materials.
   * @param {object} mesh - mesh with instanced spheres info
   */
  _collectSpheresInfo(mesh) {
    /* Firstly extract material information, if it's already in the base we will add to already existing model */
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    let idxOffset = 0;
    const meshOffset = mesh.geometry.attributes.offset.array;
    const numInstances = mesh.geometry.attributes.offset.count;
    const numVertices = mesh.geometry.attributes.position.array.length / 3;
    const numIndices = mesh.geometry.index.array.length;
    /* Geometry info */
    const resVertices = new Float32Array(numInstances * numVertices * 3); /* XYZ for every vertex */
    const resIndices = new Float32Array(numInstances * numIndices);
    const resNormals = new Float32Array(numInstances * numVertices * 3);
    const resColors = new Float32Array(numInstances * numVertices * 4); /* RGBA for every vertex */
    /* For every instanced object */
    for (let instanceIndex = 0; instanceIndex < numInstances; ++instanceIndex) {
      /* Firstly, collect some basic instanced parameters */
      const [lVertices, lNormals, lIndices, lColors] = this._collectRawInstancedGeometryParameters(mesh, instanceIndex);
      /* Extract offset for one exact object (instance) */
      const objectOffset = new THREE.Vector4(meshOffset[idxOffset], meshOffset[idxOffset + 1],
        meshOffset[idxOffset + 2], meshOffset[idxOffset + 3]);
      idxOffset += 4;
      /* For every vertex calculate it's real position (vertex.xyz * scale) + offset */
      for (let j = 0; j < lVertices.length; j += 3) {
        lVertices[j] = ((lVertices[j] * objectOffset.w) + objectOffset.x);
        lVertices[j + 1] = ((lVertices[j + 1] * objectOffset.w) + objectOffset.y);
        lVertices[j + 2] = ((lVertices[j + 2] * objectOffset.w) + objectOffset.z);
      }
      /* Saving info from one instance to resulting model */
      resVertices.set(lVertices, instanceIndex * numVertices * 3);
      resNormals.set(lNormals, instanceIndex * numVertices * 3);
      resColors.set(lColors, instanceIndex * numVertices * 4);
      resIndices.set(lIndices, instanceIndex * numIndices);
      /* Debug purposes */
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
   * Collect some basic parameters.
   * @param {object} mesh - mesh with instanced objects
   * @param {Number} instanceIndex - number of instance in mesh
   * @returns {Array} array of gathered parameters
   */
  _collectRawInstancedGeometryParameters(mesh, instanceIndex) {
    const lVertices = _.cloneDeep(mesh.geometry.attributes.position.array);
    const lNormals = _.cloneDeep(mesh.geometry.attributes.normal.array);
    const lIndices = this._collectInstancedIndices(mesh, instanceIndex);
    const lColors = FBXUtils.collectInstancedColors(mesh, instanceIndex);
    return [lVertices, lNormals, lIndices, lColors];
  }

  /**
   * Collect and rework indices in big model notation.
   * @param {object} mesh - mesh with instanced objects
   * @param {Number} instance - number of instance in mesh
   * @returns {Int32Array} array of gathered indices
   */
  _collectInstancedIndices(mesh, instance) {
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    const maxIndexInModels = this._calculateMaxIndex(modelNumber);
    const lIndices = Int32Array.from(_.cloneDeep(mesh.geometry.index.array));
    /* As we making one big model we need to carefully add resVertices.length to every index in lIndices */
    /* Algorithm below is a bit cognitively complicated, maybe refactor here at some point? */
    const maxIndex = mesh.geometry.attributes.position.array.length / 3 - 1;
    let changeIndex = 2;
    for (let k = 0; k < lIndices.length; ++k) {
      /* If it's first model - no need to add "+ 1", if not - need that + 1 */
      if (maxIndexInModels !== 0) {
        lIndices[k] += (instance * (maxIndex + 1) + maxIndexInModels + 1);
      } else {
        lIndices[k] += (instance * (maxIndex + 1));
      }
      if (k === changeIndex) { /* Need to rework this into strange FBX notation */
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
    const material = FBXUtils.collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    /* Algorithm:
    * 1. Let first third of vertices as they are - normals, indices, vertex colors are as they are.
    * 2. Add additional vertices slightly under second third of vertices, copy normals and add color from color2 array
    * 3. Triangulate added segment (dont let him be void) - add indices
    * 4. Triangulate segment from added vertices to third third of original vertices - add indices
    * 5. Add color to last third of vertices and we're done */
    const meshColor1 = _.cloneDeep(mesh.geometry.attributes.color.array);
    const meshColor2 = _.cloneDeep(mesh.geometry.attributes.color2.array);
    const meshAlphaColor = mesh.geometry.attributes.alphaColor.array;
    const numInstances = mesh.geometry.attributes.alphaColor.count;
    /* Miscellaneous variables and arrays created only for performance reasons */
    const indicesArrayLength = mesh.geometry.index.array.length;
    const verticesArrayLength = mesh.geometry.attributes.position.array.length;
    const normalsArrayLength = mesh.geometry.attributes.normal.array.length;
    const colorArray = new Float32Array(4 * verticesArrayLength / 3);
    const indexArray = new Int32Array(indicesArrayLength);
    const normalsArray = new Float32Array(normalsArrayLength);
    const vertexArray = new Float32Array(verticesArrayLength);
    const extendedColorArray = new Float32Array(4 * (verticesArrayLength / 3 + verticesArrayLength / 9));
    const extendedIndexArray = new Int32Array(indicesArrayLength);
    const extendedNormalsArray = new Float32Array(normalsArrayLength + normalsArrayLength / 3);
    const extendedVertexArray = new Float32Array(verticesArrayLength + verticesArrayLength / 3);
    /* Resulting variables. Calculating potential maximum length of that arrays for performance reasons */
    let resVertices = new Float32Array(extendedVertexArray.length * numInstances);
    let resIndices = new Float32Array(extendedIndexArray.length * numInstances);
    let resNormals = new Float32Array(extendedNormalsArray.length * numInstances);
    let resColors = new Float32Array(extendedColorArray.length * numInstances);
    let curResVerticesIndex = 0;
    let curResNormalsIndex = 0;
    let curResColorsIndex = 0;
    let curResIndicesIndex = 0;
    /* misc */
    let maxIndex = 0;
    const maxIndexInModels = this._calculateMaxIndex(modelNumber);
    /* Main instances loop */
    for (let instanceIndex = 0; instanceIndex < numInstances - 1; ++instanceIndex) { /* Proceed every instance. Additional instance is strange. */
      /* Grab vertices and normals for transformed (scale, rotation, translation) cylinder */
      const [lVertices, lNormals] = FBXUtils.calculateCylinderTransform(mesh, instanceIndex);
      const numVertices = lVertices.length / 3; /* That's the original number of vertices */
      /* Okay now vertices are reworked as we want them. Now it's time for implementing algorithm */
      /* Collect indices for given cylinder - remember: we will expand him later on */
      let lIndices = Int32Array.from(_.cloneDeep(mesh.geometry.index.array));
      /* As we making one big model we need to carefully add numVertices to every index in lIndices. Remember - need to add additional vertices (numVertices / 3) as we add them!  */
      if (curResIndicesIndex !== 0) {
        for (let k = 0; k < lIndices.length; ++k) {
          lIndices[k] += (maxIndex + 1); // same as number instanceIndex * (numVertices + numVertices / 3)) but more unified
        }
      }
      lIndices = FBXUtils.reworkIndices(lIndices); /* Need to rework this into strange FBX notation */
      let reworkedVertices = null;
      let reworkedNormals = null;
      let reworkedColors = null;
      let reworkedIndices = null;
      const lAlphas = [meshAlphaColor[instanceIndex]];
      const idxColors = instanceIndex * 3;
      /* Collect colors for each half of cylinder */
      const objectColor1 = FBXUtils.reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]], lAlphas);
      const objectColor2 = FBXUtils.reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]], lAlphas);
      /* Do we need to divide cylinders? */
      let needToDivideCylinders = true;
      if (objectColor1 === objectColor2) {
        needToDivideCylinders = false;
        reworkedColors = colorArray;
        reworkedIndices = indexArray;
        reworkedNormals = normalsArray;
        reworkedVertices = vertexArray;
      } else {
        reworkedColors = extendedColorArray;
        reworkedIndices = extendedIndexArray;
        reworkedNormals = extendedNormalsArray;
        reworkedVertices = extendedVertexArray;
      }
      let indexVerticesNormalsArray = 0; /* not using push */
      let indexIndicesArray = 0;
      let indexAdditionalVertices = 0;
      /* Clone colors for one cylinder ( 2 * numVertices / 3) and for another (same number) */
      const lColors1 = FBXUtils.cloneColors(2 * numVertices / 3, objectColor1);
      let lColors2 = null;
      if (needToDivideCylinders) {
        lColors2 = FBXUtils.cloneColors(2 * numVertices / 3, objectColor2);
      } else {
        lColors2 = FBXUtils.cloneColors(numVertices / 3, objectColor2);
      }
      reworkedColors = utils.Float32Concat(lColors2, lColors1);
      /* Step 1 : first third of vertices and  normals are copied directly */
      /* we can use numVertices here, but logically speaking lVertices.length / 3 is much clearer */
      for (let j = 0; j < lVertices.length / 3; ++j) {
        reworkedVertices[indexVerticesNormalsArray] = (lVertices[j]);
        reworkedNormals[indexVerticesNormalsArray] = (lNormals[j]);
        indexVerticesNormalsArray++;
      }
      /* Also copying half of indices cos they will only expand later on */
      for (let j = 0; j < lIndices.length / 2; ++j) {
        reworkedIndices[indexIndicesArray] = (lIndices[j]);
        indexIndicesArray++;
      }
      /* Step 2 : adding new vertices and normals and also copying old
      * We can either full-copy middle vertices or copy them with some shift.
      * Here is first way - full copying without any shifts */
      const additionalVertices = [];
      const additionalNormals = [];
      for (let j = lVertices.length / 3; j < 2 * lVertices.length / 3; ++j) {
        reworkedVertices[indexVerticesNormalsArray] = (lVertices[j]);
        reworkedNormals[indexVerticesNormalsArray] = (lNormals[j]);
        indexVerticesNormalsArray++;
        additionalVertices[indexAdditionalVertices] = (lVertices[j]);
        additionalNormals[indexAdditionalVertices] = (lNormals[j]);
        indexAdditionalVertices++;
      }
      /* If we need to divide cylinders => we're adding additional vertices */
      if (needToDivideCylinders) {
        for (let j = 0; j < indexAdditionalVertices; ++j) {
          reworkedVertices[indexVerticesNormalsArray] = additionalVertices[j];
          reworkedNormals[indexVerticesNormalsArray] = additionalNormals[j];
          indexVerticesNormalsArray++;
        }
      }
      /* Last third of vertices */
      for (let j = 2 * lVertices.length / 3; j < lVertices.length; ++j) {
        reworkedVertices[indexVerticesNormalsArray] = (lVertices[j]);
        reworkedNormals[indexVerticesNormalsArray] = (lNormals[j]);
        indexVerticesNormalsArray++;
      }
      /* Adding last portion of indices simply as first half of indices but with 2 * number of vertices / 3 addition */
      let offsetIndices = 0;
      if (needToDivideCylinders) {
        offsetIndices = 2 * numVertices / 3;
      }
      for (let j = 0; j < lIndices.length / 2; j += 3) {
        reworkedIndices[indexIndicesArray] = (lIndices[j] + offsetIndices);
        reworkedIndices[indexIndicesArray + 1] = (lIndices[j + 1] + offsetIndices);
        reworkedIndices[indexIndicesArray + 2] = (lIndices[j + 2] - offsetIndices);
        indexIndicesArray += 3;
      }
      maxIndex = Math.max(...reworkedIndices); /* VERY UNSAFE! */
      /* Ending */
      /* Saving info from one instance to resulting model */
      resVertices.set(reworkedVertices, curResVerticesIndex);
      resNormals.set(reworkedNormals, curResNormalsIndex);
      resColors.set(reworkedColors, curResColorsIndex);
      resIndices.set(reworkedIndices, curResIndicesIndex);
      /* Updating current position in resulting arrays */
      curResVerticesIndex += reworkedVertices.length;
      curResIndicesIndex += reworkedIndices.length;
      curResColorsIndex += reworkedColors.length;
      curResNormalsIndex += reworkedNormals.length;
      if (instanceIndex % 1000 === 0) {
        console.log(`${instanceIndex} out of ${numInstances} cylinders done`);
      }
    }
    /* Need to delete all zeros from the end of resArrays */
    resVertices = resVertices.subarray(0, curResVerticesIndex);
    resIndices = resIndices.subarray(0, curResIndicesIndex);
    resColors = resColors.subarray(0, curResColorsIndex);
    resNormals = resNormals.subarray(0, curResNormalsIndex);
    /* Traverse all cells in array and add max index. For cells with negative numbers we must subtract maxIndex */
    if (maxIndexInModels !== 0) {
      for (let k = 0; k < resIndices.length; ++k) {
        if (resIndices[k] > 0) {
          resIndices[k] += (maxIndexInModels + 1);
        } else {
          resIndices[k] -= (maxIndexInModels + 1);
        }
      }
    }
    /* For every float array we need to be sure that there are no numbers in exponential notation. */
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
    } else { /* Cylinders */
      this._collectCylindersInfo(mesh);
    }
  }

  /**
   * Add Models and materials info to output file.
   */
  _addModelsAndMaterials() {
    /* To gather vertices we need to traverse this._data object */
    this._data.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const mesh = object;
        // if (mesh.layers.test(gfxutils.LAYERS.DEFAULT)) { /* It means something */
        if (mesh.layers.mask === 1 || mesh.layers.mask === 4) { /* How can we use .test method from threejs layers if LAYERS isn't treejs layers? 1 is default, 4 is transparent */
          if (mesh.geometry.type === 'InstancedBufferGeometry') { /* If instancing */
            this._collectInstancedInfo(mesh);
          } else { /* Not instancing */
            this._collectStraightGeometryInfo(mesh);
          }
          // console.log('mesh is done');
        }
      }
    });
    return this._addModelsToResult() + this._addMaterialsToResult();
  }

  /**
   * Add GlobalSettings info to output file.
   */
  _addGlobalSettings() {
    const gSettings = '{\n'
    + '\t\tVersion: 1000\n'
    + '\t\tProperties60:  {\n'
    + '\t\t\tProperty: "UpAxis", "int", "",1\n'
    + '\t\t\tProperty: "UpAxisSign", "int", "",1\n'
    + '\t\t\tProperty: "FrontAxis", "int", "",2\n'
    + '\t\t\tProperty: "FrontAxisSign", "int", "",1\n'
    + '\t\t\tProperty: "CoordAxis", "int", "",0\n'
    + '\t\t\tProperty: "CoordAxisSign", "int", "",1\n'
    + '\t\t\tProperty: "UnitScaleFactor", "double", "",1\n'
    + '\t\t}\n'
    + '\t}\n'
    + '}\n\n';
    return gSettings;
  }


  /**
   * Add Objects info to output file.
   */
  createObjects() {
    const mandatoryComment = '; Object properties\n'
      + ';------------------------------------------------------------------\n\n';
    const result = 'Objects:  {\n'
      + `${this._addModelsAndMaterials()}`
      + `\tGlobalSettings: ${this._addGlobalSettings()}`;
    return mandatoryComment + result;
  }

  /**
   * Add Relations info to output file.
   */
  createRelations() {
    const mandatoryComment = '; Object relations\n'
    + ';------------------------------------------------------------------\n\n';
    let modelsList = '';
    for (let i = 0; i < this._models.length; ++i) {
      modelsList += `\tModel: "Model::${this._data.name}_${i}", "Mesh" {\n`
        + '\t}\n';
    }
    let materialList = '';
    for (let i = 0; i < this._materials.length; ++i) {
      materialList += `\tMaterial: "Material::${this._data.name}_${i}_default", "" {\n`
        + '\t}\n';
    }
    const relations = `Relations:  {\n${modelsList}\t`
    + 'Model: "Model::Producer Perspective", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Producer Top", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Producer Bottom", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Producer Front", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Producer Back", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Producer Right", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Producer Left", "Camera" {\n'
    + '\t}\n'
    + '\tModel: "Model::Camera Switcher", "CameraSwitcher" {\n'
    + `\t}\n${materialList}`
    + '}\n\n';
    return mandatoryComment + relations;
  }

  /**
   * Add Connections info to output file.
   */
  createConnections() {
    const mandatoryComment = '; Object connections\n'
      + ';------------------------------------------------------------------\n\n';
    let modelsList = '';
    for (let i = 0; i < this._models.length; ++i) {
      modelsList += `\tConnect: "OO", "Model::${this._data.name}_${i}", "Model::Scene"\n`;
    }
    let materialList = '';
    for (let i = 0; i < this._materials.length; ++i) {
      materialList += `\tConnect: "OO", "Material::${this._data.name}_${i}_default", "Model::${this._data.name}_${i}"\n`;
    }
    const connections = `Connections:  {\n${modelsList}${materialList}`
    + '}\n';
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
    /* Creating mandatory blocks for .fbx files: */
    const header = this.createFBXHeader(); /* FBXHeader block */
    const definitions = this.createDefinitions(); /* Definitions block */
    const objects = this.createObjects(); /* Objects - Models and Materials block */
    const relations = this.createRelations(); /* Relations block */
    const connections = this.createConnections(); /* Connections (e.g. between models and materials) */
    const animation = this.createAnimation(); /* Animation and takes block (currently empty) */
    return header + definitions + objects + relations + connections + animation;
  }
}

FBXExporter.formats = ['fbx'];
