import * as THREE from 'three';
import { Vector4 } from 'three';
import _ from 'lodash';
import Exporter from './Exporter';
import gfxutils from '../../gfx/gfxutils';
import ZClippedMesh from '../../gfx/meshes/ZClippedMesh';

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
    this._outputFile = null;
    /* Exact data */
    /* Source is somewhat like ComplexVisual, but we need to catch THREE.Mesh objects */
    this._meshes = [];
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
    const objectTypes = []; /* Somewhat like 'let objectTypes = getObjectTypes()' or something. What about count of that objects? */
    const mandatoryComment = '; Object definitions\n'
     + ';------------------------------------------------------------------\n\n';
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
   * Reworking indices buffer, see https://banexdevblog.wordpress.com/2014/06/23/a-quick-tutorial-about-the-fbx-ascii-format/
   * @param{Int32Array} array - indices buffer
   * @returns{Int32Array} reworked array.
   */
  _reworkIndices(array) {
    const clonedArray = new Int32Array(array.length); /* TODO: rework this to bigint64 */
    clonedArray.set(array);
    for (let i = 2; i < clonedArray.length; i += 3) {
      clonedArray[i] *= -1;
      clonedArray[i]--;
    }
    return clonedArray;
  }

  /**
   * Extension to standard Float32Arrays.
   * @param{Float32Array} first  - destination array
   * @param{Float32Array} second - source array
   * @returns{Float32Array} resulting concatenated array
   */
  _Float32Concat(first, second) {
    const firstLength = first.length;
    const result = new Float32Array(firstLength + second.length);

    result.set(first);
    result.set(second, firstLength);

    return result;
  }

  /**
   * Extension to standard Int32Arrays.
   * @param{Int32Array} first  - destination array
   * @param{Int32Array} second - source array
   * @returns{Int32Array} resulting concatenated array
   */
  _Int32Concat(first, second) {
    const firstLength = first.length;
    const result = new Int32Array(firstLength + second.length);

    result.set(first);
    result.set(second, firstLength);

    return result;
  }

  /**
   * Reworking colors buffer + alpha, see https://raw.githubusercontent.com/wayt/Bomberman/master/Assets/fire.fbx
   * @param{array} colorArray - colors buffer
   * @param{Float32Array} alphaArray - alpha buffer
   * @returns{Float32Array} reworked array.
   */
  _reworkColors(colorArray, alphaArray) {
    if (alphaArray.length === 0) {
      alphaArray = new Float32Array(colorArray.length / 3);
      for (let i = 0; i < alphaArray.length; ++i) {
        alphaArray.set([1], i);
      }
    }
    const clonedArray = new Float32Array(colorArray.length + alphaArray.length);
    let alphaArrIdx = 0;
    let clonedArrIdx = 0;
    for (let i = 0; i < colorArray.length; i += 3) {
      clonedArray.set([colorArray[i]], clonedArrIdx); /* R */
      clonedArray.set([colorArray[i + 1]], clonedArrIdx + 1); /* G */
      clonedArray.set([colorArray[i + 2]], clonedArrIdx + 2); /* B */
      clonedArray.set([alphaArray[alphaArrIdx]], clonedArrIdx + 3); /* A */
      alphaArrIdx++;
      clonedArrIdx += 4;
    }

    return clonedArray;
  }

  _addModelsToResult() {
    let allModels = '';
    for (let i = 0; i < this._models.length; ++i) {
      const model = this._models[i];
      const modelName = `Model::${this._data.name}_${i}`;
      const Version = 232; /* Mystery number */
      /* Setting up default properties */
      const modelProperties = `\tModel: "${modelName}", "Mesh" {\n`
        + `\t\tVersion: ${Version}\n`
        + '\t\tProperties60: {\n'
        + '\t\t\tProperty: "QuaternionInterpolate", "bool", "",0\n'
        + '\t\t\tProperty: "Visibility", "Visibility", "A",1\n'
        + '\t\t\tProperty: "Lcl Translation", "Lcl Translation", "A",0.000000000000000,0.000000000000000,-1789.238037109375000\n'
        + '\t\t\tProperty: "Lcl Rotation", "Lcl Rotation", "A",0.000009334667643,-0.000000000000000,0.000000000000000\n'
        + '\t\t\tProperty: "Lcl Scaling", "Lcl Scaling", "A",1.000000000000000,1.000000000000000,1.000000000000000\n'
        + '\t\t\tProperty: "RotationOffset", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "RotationPivot", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "ScalingOffset", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "ScalingPivot", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "TranslationActive", "bool", "",0\n'
        + '\t\t\tProperty: "TranslationMin", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "TranslationMax", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "TranslationMinX", "bool", "",0\n'
        + '\t\t\tProperty: "TranslationMinY", "bool", "",0\n'
        + '\t\t\tProperty: "TranslationMinZ", "bool", "",0\n'
        + '\t\t\tProperty: "TranslationMaxX", "bool", "",0\n'
        + '\t\t\tProperty: "TranslationMaxY", "bool", "",0\n'
        + '\t\t\tProperty: "TranslationMaxZ", "bool", "",0\n'
        + '\t\t\tProperty: "RotationOrder", "enum", "",0\n'
        + '\t\t\tProperty: "RotationSpaceForLimitOnly", "bool", "",0\n'
        + '\t\t\tProperty: "AxisLen", "double", "",10\n'
        + '\t\t\tProperty: "PreRotation", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "PostRotation", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "RotationActive", "bool", "",0\n'
        + '\t\t\tProperty: "RotationMin", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "RotationMax", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "RotationMinX", "bool", "",0\n'
        + '\t\t\tProperty: "RotationMinY", "bool", "",0\n'
        + '\t\t\tProperty: "RotationMinZ", "bool", "",0\n'
        + '\t\t\tProperty: "RotationMaxX", "bool", "",0\n'
        + '\t\t\tProperty: "RotationMaxY", "bool", "",0\n'
        + '\t\t\tProperty: "RotationMaxZ", "bool", "",0\n'
        + '\t\t\tProperty: "RotationStiffnessX", "double", "",0\n'
        + '\t\t\tProperty: "RotationStiffnessY", "double", "",0\n'
        + '\t\t\tProperty: "RotationStiffnessZ", "double", "",0\n'
        + '\t\t\tProperty: "MinDampRangeX", "double", "",0\n'
        + '\t\t\tProperty: "MinDampRangeY", "double", "",0\n'
        + '\t\t\tProperty: "MinDampRangeZ", "double", "",0\n'
        + '\t\t\tProperty: "MaxDampRangeX", "double", "",0\n'
        + '\t\t\tProperty: "MaxDampRangeY", "double", "",0\n'
        + '\t\t\tProperty: "MaxDampRangeZ", "double", "",0\n'
        + '\t\t\tProperty: "MinDampStrengthX", "double", "",0\n'
        + '\t\t\tProperty: "MinDampStrengthY", "double", "",0\n'
        + '\t\t\tProperty: "MinDampStrengthZ", "double", "",0\n'
        + '\t\t\tProperty: "MaxDampStrengthX", "double", "",0\n'
        + '\t\t\tProperty: "MaxDampStrengthY", "double", "",0\n'
        + '\t\t\tProperty: "MaxDampStrengthZ", "double", "",0\n'
        + '\t\t\tProperty: "PreferedAngleX", "double", "",0\n'
        + '\t\t\tProperty: "PreferedAngleY", "double", "",0\n'
        + '\t\t\tProperty: "PreferedAngleZ", "double", "",0\n'
        + '\t\t\tProperty: "InheritType", "enum", "",0\n'
        + '\t\t\tProperty: "ScalingActive", "bool", "",0\n'
        + '\t\t\tProperty: "ScalingMin", "Vector3D", "",1,1,1\n'
        + '\t\t\tProperty: "ScalingMax", "Vector3D", "",1,1,1\n'
        + '\t\t\tProperty: "ScalingMinX", "bool", "",0\n'
        + '\t\t\tProperty: "ScalingMinY", "bool", "",0\n'
        + '\t\t\tProperty: "ScalingMinZ", "bool", "",0\n'
        + '\t\t\tProperty: "ScalingMaxX", "bool", "",0\n'
        + '\t\t\tProperty: "ScalingMaxY", "bool", "",0\n'
        + '\t\t\tProperty: "ScalingMaxZ", "bool", "",0\n'
        + '\t\t\tProperty: "GeometricTranslation", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "GeometricRotation", "Vector3D", "",0,0,0\n'
        + '\t\t\tProperty: "GeometricScaling", "Vector3D", "",1,1,1\n'
        + '\t\t\tProperty: "LookAtProperty", "object", ""\n'
        + '\t\t\tProperty: "UpVectorProperty", "object", ""\n'
        + '\t\t\tProperty: "Show", "bool", "",1\n'
        + '\t\t\tProperty: "NegativePercentShapeSupport", "bool", "",1\n'
        + '\t\t\tProperty: "DefaultAttributeIndex", "int", "",0\n'
        + '\t\t\tProperty: "Color", "Color", "A+",0,0,0\n'
        + '\t\t\tProperty: "Size", "double", "",100\n'
        + '\t\t\tProperty: "Look", "enum", "",1\n'
        + '\t\t}\n';
      /* Setting up vertices + indices */
      const multiLayer = 0;
      const multiTake = 1;
      const shading = 'Y';
      const culling = 'CullingOff';
      const geometryVersion = 124;
      /* console.log(Buffer.byteLength(`${model.vertices}`, 'utf8'));
      console.log(Buffer.byteLength(`${model.indices}`, 'utf8'));
      console.log(Buffer.byteLength(`${model.normals}`, 'utf8'));
      console.log(Buffer.byteLength(`${model.colors}`, 'utf8')); */
      const verticesIndices = `\t\tMultiLayer: ${multiLayer}\n`
        + `\t\tMultiTake: ${multiTake}\n`
        + `\t\tShading: ${shading}\n`
        + `\t\tCulling: "${culling}"\n`
        + `\t\tVertices: ${this._correctArrayNotation(model.vertices)}\n\n`
        + `\t\tPolygonVertexIndex: ${model.indices}\n\n`
        + `\t\tGeometryVersion: ${geometryVersion}\n`;
      /* Setting up layers */
      const layerElementNormalNumber = 0; /* IDK what that is */
      const layerElementNormalVersion = 101; /* IDK what version means */
      const layerElementNormalName = ''; /* IDK what name means */
      const layerElementNormal = `\t\tLayerElementNormal: ${layerElementNormalNumber} {\n`
        + `\t\t\tVersion: ${layerElementNormalVersion}\n`
        + `\t\t\tName: "${layerElementNormalName}"\n`
        + '\t\t\tMappingInformationType: "ByVertice"\n' /* Mandatory for our Miew! Must not be changed */
        + '\t\t\tReferenceInformationType: "Direct"\n' /* Mandatory for our Miew! Must not be changed */
        + `\t\t\tNormals: ${this._correctArrayNotation(model.normals)}\n`
        + '\t\t}\n';
      /* next few layerElements are not in use, but we left it for maybe further compatibility */
      const layerElementSmoothing = '';
      const layerElementUV = '';
      const layerElementTexture = '';
      /* but colors and materials are actually in-use */
      const layerElementColorNumber = 0; /* IDK what that is */
      const layerElementColorVersion = 101; /* IDK what version means */
      const layerElementColorName = ''; /* IDK what name means */
      const layerElementColor = `\t\tLayerElementColor: ${layerElementColorNumber} {\n`
        + `\t\t\tVersion: ${layerElementColorVersion}\n`
        + `\t\t\tName: "${layerElementColorName}"\n`
        + '\t\t\tMappingInformationType: "ByVertice"\n' /* Mandatory for our Miew! Must not be changed */
        + '\t\t\tReferenceInformationType: "Direct"\n' /* Mandatory for our Miew! Must not be changed */
        + `\t\t\tColors: ${this._correctArrayNotation(model.colors)}\n`
        + `\t\t\tColorIndex: ${[...Array(model.vertices.length / 3).keys()]}\n`
        + '\t\t}\n';
      /* Do we need automatically check and build this info? In Miew we always have these layers */
      const layer = '\t\tLayer: 0 {\n'
        + '\t\t\tVersion: 100\n'
        + '\t\t\tLayerElement:  {\n'
        + '\t\t\t\tType: "LayerElementNormal"\n'
        + '\t\t\t\tTypedIndex: 0\n'
        + '\t\t\t}\n'
        + '\t\t\tLayerElement:  {\n'
        + '\t\t\t\tType: "LayerElementColor"\n'
        + '\t\t\t\tTypedIndex: 0\n'
        + '\t\t\t}\n'
        + '\t\t\tLayerElement:  {\n'
        + '\t\t\t\tType: "LayerElementMaterial"\n'
        + '\t\t\t\tTypedIndex: 0\n'
        + '\t\t\t}\n'
        + '\t\t}\n'
        + '\t}\n';
      const layerElementMaterial = '\t\tLayerElementMaterial: 0 {\n'
        + '\t\t\tVersion: 101\n'
        + '\t\t\tName: ""\n'
        + '\t\t\tMappingInformationType: "AllSame"\n'
        + '\t\t\tReferenceInformationType: "Direct"\n'
        + '\t\t\tMaterials: 0\n'
        + '\t\t}\n';
      // this._models[i] = null; /* That's free i guess? */
      const resultingLayer = layerElementNormal + layerElementSmoothing + layerElementUV + layerElementTexture + layerElementColor + layerElementMaterial + layer;
      allModels += (modelProperties + verticesIndices + resultingLayer);

    }
    console.log('Models done');
    // console.log(Buffer.byteLength(allModels, 'utf8'));
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
   * Rework numbers notation from scientific (exponential) to normal
   * @param {Float32Array} array - array to be fixed
   * @returns {[]} Array of numbers in correct notation
   */
  _correctArrayNotation(array) {
    let reworkedArray = [];
    for (let i = 0; i < array.length; ++i) {
      reworkedArray[i] = parseFloat(array[i].toFixed(6)); /* Default, i guess? */
    }
    return reworkedArray;
  }

  _checkExistingMaterial(material) {
    for (let i = 0; i < this._materials.length; ++i) {
      if (JSON.stringify(material) === JSON.stringify(this._materials[i])) {
        return i;
      }
    }
    /* completely new element */
    return this._models.length;
  }

  _calculateMaxIndex(modelNumber) {
    if (this._models.length === modelNumber) {
      return 0;
    }
    return (this._models[modelNumber].vertices.length / 3 - 1);
  }

  _addModelToPool(modelNumber, model, material) {
    /* If that's new model*/
    if (this._models.length === modelNumber) {
      this._models.push(model);
      this._materials.push(material);
    } else {
      /* Adding new vertices etc to existing model */
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
        /* vertices: [oldModel.vertices, model.vertices].join(''),
        indices: [oldModel.indices, model.indices].join(''),
        normals: [oldModel.normals, model.normals].join(''),
        colors: [oldModel.colors, model.colors].join(''), */
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
    const material = this._collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    let lVertices = [];
    let lIndices = [];
    let lNormals = [];
    let lAlphas = [];
    let lColors = [];
    /* Collect info about vertices + indices + material */
    lVertices = mesh.geometry.attributes.position.array; /* Vertices either way are copying directly */
    /* Different style with indices - if we have modelNumber => we must to add indices to existing ones */
    /* Todo: 1 loop? */
    const maxIndex = this._calculateMaxIndex(modelNumber);
    lIndices = Int32Array.from(_.cloneDeep(mesh.geometry.index.array));
    if (maxIndex !== 0) {
      for (let i = 0; i < lIndices.length; ++i) {
        lIndices[i] += maxIndex + 1;
      }
    }
    lIndices = this._reworkIndices(lIndices); /* Need to rework this into strange FBX notation */
    lNormals = mesh.geometry.attributes.normal.array;
    if (!(mesh instanceof ZClippedMesh)) {
      lAlphas = mesh.geometry.attributes.alphaColor.array;
    }
    if (mesh.geometry.attributes.color.array.length >= 1) {
      lColors = this._reworkColors(mesh.geometry.attributes.color.array, lAlphas); /* Need to rework this into strange FBX notation */
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
      /* this._models.push({
        vertices: this._correctArrayNotation(lVertices),
        indices: lIndices,
        normals: this._correctArrayNotation(lNormals),
        colors: this._correctArrayNotation(lColors),
      });
      this._materials.push(this._collectMaterialInfo(mesh)); */
    } /* else do nothing */
  }

  /**
   * Add Material info to this._materials.
   */
  _collectMaterialInfo(mesh) {
    const lDiffuse = mesh.material.uberOptions.diffuse.toArray();
    const lOpacity = mesh.material.uberOptions.opacity;
    const lShininess = mesh.material.uberOptions.shininess;
    const lSpecular = mesh.material.uberOptions.specular.toArray();
    return ({
      diffuse: lDiffuse,
      opacity: lOpacity,
      shininess: lShininess,
      specular: lSpecular,
    });
  }

  /**
   * Clone colors from one to number of vertices
   */
  _cloneColors(numVertices, color) {
    const clonedArray = new Float32Array(numVertices * 4); /* RGBA for every vertex */
    for (let i = 0; i < clonedArray.length; i += 4) {
      clonedArray.set(color, i);
    }
    return clonedArray;
  }

  /**
   * Collect instanced spheres geometry and materials.
   */
  _collectSpheresInfo(mesh) {
    /* Firstly extract material information, if it's already in the base we will add to already existing model */
    const material = this._collectMaterialInfo(mesh);
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
      const objectOffset = new Vector4(meshOffset[idxOffset], meshOffset[idxOffset + 1],
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
      /* resVertices = this._Float32Concat(resVertices, lVertices);
      resNormals = this._Float32Concat(resNormals, lNormals);
      resColors = this._Float32Concat(resColors, lColors);
      resIndices = this._Int32Concat(resIndices, lIndices); */
      if (instanceIndex % 1000 === 0) {
        console.log(`${instanceIndex} out of ${numInstances} spheres done`);
      }
    }
    const model = {
      vertices: resVertices,
      indices: resIndices,
      normals: resNormals,
      colors: resColors,
    };
    this._addModelToPool(modelNumber, model, material);
    /* For every float array we need to be sure that there are no numbers in exponential notation */
    /* this._models.push({
      vertices: this._correctArrayNotation(resVertices),
      indices: this._correctArrayNotation(resIndices),
      normals: resNormals,
      colors: this._correctArrayNotation(resColors),
    });

    this._materials.push(this._collectMaterialInfo(mesh)); /* Material info. Material for every sphere is the same so we want to collect it only 1 time */
  }

  /**
   * Collect some basic parameters.
   */
  _collectRawInstancedGeometryParameters(mesh, instanceIndex) {
    const lVertices = _.cloneDeep(mesh.geometry.attributes.position.array);
    const lNormals = _.cloneDeep(mesh.geometry.attributes.normal.array);
    const lIndices = this._collectInstancedIndices(mesh, instanceIndex);
    const lColors = this._collectInstancedColors(mesh, instanceIndex);
    return [lVertices, lNormals, lIndices, lColors];
  }

  /**
   * Collect and rework indices in big model notation.
   */
  _collectInstancedIndices(mesh, instance) {
    const material = this._collectMaterialInfo(mesh);
    const modelNumber = this._checkExistingMaterial(material);
    const maxIndexInModels = this._calculateMaxIndex(modelNumber);
    const lIndices = Int32Array.from(_.cloneDeep(mesh.geometry.index.array));
    /* As we making one big model we need to carefully add resVertices.length to every index in lIndices */
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
    // lIndices = this._reworkIndices(lIndices); /* Need to rework this into strange FBX notation */
    return lIndices;
  }

  /**
   * Collect and rework colors in big model notation.
   */
  _collectInstancedColors(mesh, instanceIndex) {
    const idxColors = (instanceIndex * 3); /* that's not magic. For 1st instance we must start from 0, for 2nd - from 3, etc */
    const meshColor = mesh.geometry.attributes.color.array;
    const meshAlphaColor = mesh.geometry.attributes.alphaColor.array;
    const lAlphas = [meshAlphaColor[instanceIndex]];
    const objectColor = this._reworkColors([meshColor[idxColors], meshColor[idxColors + 1], meshColor[idxColors + 2]], lAlphas);
    /* For FBX we need to clone color for every vertex */
    const lColors = this._cloneColors(mesh.geometry.attributes.position.array.length / 3, objectColor);
    return lColors;
  }

  _calculateCylinderTransform(mesh, instanceIndex) {
    /* Misc variables */
    const matVector1 = mesh.geometry.attributes.matVector1.array;
    const matVector2 = mesh.geometry.attributes.matVector2.array;
    const matVector3 = mesh.geometry.attributes.matVector3.array;
    /* Grab original vertices and normals */
    const lVertices = _.cloneDeep(mesh.geometry.attributes.position.array);
    const lNormals = _.cloneDeep(mesh.geometry.attributes.normal.array);
    /* We have vertices for not transformed cylinder. Need to make it transformed */
    const transformCylinder = new THREE.Matrix4();
    const idxOffset = instanceIndex * 4;
    transformCylinder.set(matVector1[idxOffset], matVector2[idxOffset], matVector3[idxOffset], 0,
      matVector1[idxOffset + 1], matVector2[idxOffset + 1], matVector3[idxOffset + 1], 0,
      matVector1[idxOffset + 2], matVector2[idxOffset + 2], matVector3[idxOffset + 2], 0,
      matVector1[idxOffset + 3], matVector2[idxOffset + 3], matVector3[idxOffset + 3], 1);
    transformCylinder.transpose();
    /* Applying offsets / transformation to every vertex */
    for (let j = 0; j < lVertices.length; j += 3) {
      const vertVec = new THREE.Vector4();
      vertVec.set(lVertices[j], lVertices[j + 1], lVertices[j + 2], 1);
      vertVec.applyMatrix4(transformCylinder);
      const normVec = new THREE.Vector4();
      normVec.set(lNormals[j], lNormals[j + 1], lNormals[j + 2], 0.0);
      normVec.applyMatrix4(transformCylinder);

      lVertices[j] = vertVec.x;
      lVertices[j + 1] = vertVec.y;
      lVertices[j + 2] = vertVec.z;
      lNormals[j] = normVec.x;
      lNormals[j + 1] = normVec.y;
      lNormals[j + 2] = normVec.z;
    }
    return [lVertices, lNormals];
  }

  _myMemset(destArray, sourceArray, positionInDestArray) {
    /* for (let i = 0; i < sourceArray.length; ++i) {
      destArray[positionInDestArray + i] = sourceArray[i];
    } */
    destArray.set(sourceArray, positionInDestArray);
  }

  /**
   * Divide cylinder (add additional vertexes) for prettiness
   */
  _divideCylinders(mesh) {
    const material = this._collectMaterialInfo(mesh);
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
    /* let resVertices = new Float32Array(0);
    let resNormals = new Float32Array(0);
    let resColors = new Float32Array(0);
    let resIndices = new Int32Array(0); */
    /* misc */
    let maxIndex = 0;
    const maxIndexInModels = this._calculateMaxIndex(modelNumber);
    /* Main instances loop */
    for (let instanceIndex = 0; instanceIndex < numInstances - 1; ++instanceIndex) { /* Proceed every instance TODO: -1 MAGIC */
      /* Grab vertices and normals for transformed (scale, rotation, translation) cylinder */
      const [lVertices, lNormals] = this._calculateCylinderTransform(mesh, instanceIndex);
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
      lIndices = this._reworkIndices(lIndices); /* Need to rework this into strange FBX notation */
      let reworkedVertices = null;
      let reworkedNormals = null;
      let reworkedColors = null;
      let reworkedIndices = null;
      const lAlphas = [meshAlphaColor[instanceIndex]];
      const idxColors = instanceIndex * 3;
      /* Collect colors for each half of cylinder */
      const objectColor1 = this._reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]], lAlphas);
      const objectColor2 = this._reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]], lAlphas);
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
      const lColors1 = this._cloneColors(2 * numVertices / 3, objectColor1);
      let lColors2 = null;
      if (needToDivideCylinders) {
        lColors2 = this._cloneColors(2 * numVertices / 3, objectColor2);
      } else {
        lColors2 = this._cloneColors(numVertices / 3, objectColor2);
      }
      reworkedColors = this._Float32Concat(lColors2, lColors1);
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
      maxIndex = Math.max(...reworkedIndices); /* TODO: VERY UNSAFE! */
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
    if (maxIndexInModels !== 0) {
      for (let k = 0; k < resIndices.length; ++k) {
        resIndices[k] > 0 ? resIndices[k] += (maxIndexInModels + 1) : resIndices[k] -= (maxIndexInModels + 1); // same as number instanceIndex * (numVertices + numVertices / 3)) but more unified
      }
    }
    /* For every float array we need to be sure that there are no numbers in exponential notation. They already are */
    const model = {
      vertices: resVertices,
      indices: resIndices,
      normals: resNormals,
      colors: resColors,
    };
    this._addModelToPool(modelNumber, model, material);
  }

  /**
   * Collect instanced cylinders geometry and materials.
   */
  _collectCylindersInfo(mesh) {
    const testVersionDivideCylinder = true;
    if (!testVersionDivideCylinder) { /* if we dont divide cylinders */
      /* Geometry info */
      let resVertices = new Float32Array(0);
      let resIndices = new Float32Array(0);
      let resNormals = new Float32Array(0);
      let resColors = new Float32Array(0);
      const numInstances = mesh.geometry.attributes.alphaColor.count;
      for (let instanceIndex = 0; instanceIndex < numInstances; ++instanceIndex) {
        /* Firstly, collect some instanced parameters
        * vertices are copied directly
        * normals are copied directly
        * indices are copied and reworked to the big model notation
        * colors are copied and cloned for each vertex */
        const lIndices = this._collectInstancedIndices(mesh, instanceIndex);
        const lColors = this._collectInstancedColors(mesh, instanceIndex);
        /* Grab vertices and normals for transformed (scale, rotation, translation) cylinder */
        const [lVertices, lNormals] = this._calculateCylinderTransform(mesh, instanceIndex);
        /* Saving info from one instance to resulting model */
        resVertices = this._Float32Concat(resVertices, lVertices);
        resNormals = this._Float32Concat(resNormals, lNormals);
        resColors = this._Float32Concat(resColors, lColors);
        resIndices = this._Int32Concat(resIndices, lIndices);
      }
      /* For every float array we need to be sure that there are no numbers in exponential notation */
      this._models.push({
        vertices: this._correctArrayNotation(resVertices),
        indices: resIndices,
        normals: this._correctArrayNotation(resNormals),
        colors: this._correctArrayNotation(resColors),
      });
      this._materials.push(this._collectMaterialInfo(mesh));
    } else this._divideCylinders(mesh); /* if we want some prettiness */
  }

  /**
   * Collect instanced models and materials.
   */
  _collectInstancedInfo(mesh) {
    if (typeof mesh.geometry.attributes.offset !== 'undefined') { /* TODO: That's spheres? What is the notation? */
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
        // if (this._meshes[i].layers.test(gfxutils.LAYERS.DEFAULT)) { /* It means something */
        if (mesh.layers.mask === 1 || mesh.layers.mask === 4) { /* TODO: Implement what's written on top of that */
          if (mesh.geometry.type === 'InstancedBufferGeometry') { /* If instancing */
            this._collectInstancedInfo(mesh);
          } else { /* Not instancing */
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
    const header = this.createFBXHeader();
    const definitions = this.createDefinitions();
    const objects = this.createObjects();
    const relations = this.createRelations();
    const connections = this.createConnections();
    const animation = this.createAnimation();
    return header + definitions + objects + relations + connections + animation;
  }
}

FBXExporter.formats = ['fbx'];
