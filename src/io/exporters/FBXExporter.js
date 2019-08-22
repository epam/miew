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

    return [mandatoryComment, extension].join('');
  }

  /**
   * Add Definitions info to output file.
   * Not exactly sure if this section is template section (as it is in 7.4+) or it should every time be like this
   */
  createDefinitions() {
    const Version = 100; /* Mystery 100, but appears that it's not checked properly */
    let count = 3; /* Biggest mystery here. Every 6.1. file has this field = 3. Why?  I think that here must be
    some sort of 'let count = calculateCount()' or something, cos i _think_ that it's object, geometry,material etc count */
    /* Then we must know how many and exactly what Object Types there are */
    let objectTypes = []; /* Somewhat like 'let objectTypes = getObjectTypes()' or something. What about count of that objects? */
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
    return [mandatoryComment, definitions].join('');
  }

  /**
   * Reworking indices buffer, see https://banexdevblog.wordpress.com/2014/06/23/a-quick-tutorial-about-the-fbx-ascii-format/
   * @param{ArrayLike<number>} array - indices buffer
   * @returns{Int32Array} reworked array.
   */
  _reworkIndices(array) {
    const clonedArray = new Int32Array(array.length); /* TODO: revork this to bigint64 */
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
    const allModels = [];
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
      const verticesIndices = `\t\tMultiLayer: ${multiLayer}\n`
        + `\t\tMultiTake: ${multiTake}\n`
        + `\t\tShading: ${shading}\n`
        + `\t\tCulling: "${culling}"\n`
        + `\t\tVertices: ${model.vertices}\n\n`
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
        + `\t\t\tNormals: ${model.normals}\n`
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
        + `\t\t\tColors: ${model.colors}\n`
        + `\t\t\tColorIndex: ${[...Array(model.vertices.length).keys()]}\n`
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
      const resultingLayer = [layerElementNormal, layerElementSmoothing, layerElementUV, layerElementTexture, layerElementColor, layerElementMaterial, layer].join('');
      allModels.push([modelProperties, verticesIndices, resultingLayer].join(''));
    }
    return allModels.join('');
  }

  /**
   * Add Material info to result
   */
  _addMaterialsToResult() {
    const materialVersion = 102;
    const allMaterials = [];
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
      allMaterials.push(stringMaterial);
    }
    return allMaterials.join('');
  }

  /**
   * Rework numbes notation from scientific (exponential) to normal
   * @returns {Array} Array of numbers in correct notation
   */
  _correctArrayNotation(array) {
    const reworkedArray = [];
    for (let i = 0; i < array.length; ++i) {
      reworkedArray.push(array[i].toFixed(17)); /* Default, i guess? */
    }
    return reworkedArray;
  }

  /**
   * Save geometry info from mesh to this._models.
   */
  _collectStraightGeometryInfo(mesh) {
    let lVertices = [];
    let lIndices = [];
    let lNormals = [];
    let lAlphas = [];
    let lColors = [];
    /* Collect info about vertices + indices + material */
    lVertices = mesh.geometry.attributes.position.array;
    lIndices = this._reworkIndices(mesh.geometry.index.array); /* Need to rework this into strange FBX notation */
    lNormals = mesh.geometry.attributes.normal.array;
    if (!(mesh instanceof ZClippedMesh)) {
      lAlphas = mesh.geometry.attributes.alphaColor.array;
    }
    if (mesh.geometry.attributes.color.array.length >= 1) {
      lColors = this._reworkColors(mesh.geometry.attributes.color.array, lAlphas); /* Need to rework this into strange FBX notation */
    }
    if (lVertices.length > 0 && lIndices.length > 0 && lNormals.length > 0 && lColors.length > 0) {
      this._models.push({
        vertices: this._correctArrayNotation(lVertices),
        indices: lIndices,
        normals: this._correctArrayNotation(lNormals),
        colors: this._correctArrayNotation(lColors),
      });
      this._collectMaterialInfo(mesh);
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
    this._materials.push({
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
      clonedArray.set([color[0]], i); /* R */
      clonedArray.set([color[1]], i + 1); /* G */
      clonedArray.set([color[2]], i + 2); /* B */
      clonedArray.set([color[3]], i + 3); /* A */
    }
    return clonedArray;
  }

  /**
   * Collect instanced spheres geometry and materials.
   */
  _collectSpheresInfo(mesh) {
    /* Geometry info */
    let resVertices = new Float32Array(0);
    let resIndices = new Float32Array(0);
    let resNormals = new Float32Array(0);
    let resColors = new Float32Array(0);
    let idxOffset = 0;
    const meshOffset = mesh.geometry.attributes.offset.array;
    const numInstances = mesh.geometry.attributes.offset.count;
    /* For every instanced object */
    for (let i = 0; i < numInstances; ++i) {
      /* Firstly, collect some basic instanced parameters */
      const [lVertices, lNormals, lIndices, lColors] = this._collectRawInstancedGeometryParameters(mesh, i);
      /* Extract offset for one exact object (instance) */
      const objectOffset = new Vector4(meshOffset[idxOffset], meshOffset[idxOffset + 1],
        meshOffset[idxOffset + 2], meshOffset[idxOffset + 3]);
      idxOffset += 4;
      /* For every vertex calculate it's real position (vertex.xyz * scale) + offset */
      for (let j = 0; j < lVertices.length; j += 3) {
        lVertices[j] *= objectOffset.w;
        lVertices[j + 1] *= objectOffset.w;
        lVertices[j + 2] *= objectOffset.w;
        lVertices[j] += objectOffset.x;
        lVertices[j + 1] += objectOffset.y;
        lVertices[j + 2] += objectOffset.z;
      }
      /* Saving info from one instance to resulting model */
      resVertices = this._Float32Concat(resVertices, lVertices);
      resNormals = this._Float32Concat(resNormals, lNormals);
      resColors = this._Float32Concat(resColors, lColors);
      resIndices = this._Float32Concat(resIndices, lIndices);
    }
    /* For every float array we need to be sure that there are no numbers in exponential notation */
    this._models.push({
      vertices: this._correctArrayNotation(resVertices),
      indices: resIndices,
      normals: this._correctArrayNotation(resNormals),
      colors: this._correctArrayNotation(resColors),
    });
    /* Material info. Material for every sphere is the same so we want to collect it only 1 time */
    this._collectMaterialInfo(mesh);
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
  _collectInstancedIndices(mesh, index) {
    let lIndices = _.cloneDeep(mesh.geometry.index.array);
    /* As we making one big model we need to carefully add resVertices.length to every index in lIndices */
    for (let k = 0; k < lIndices.length; ++k) {
      lIndices[k] += (index * mesh.geometry.attributes.position.array.length / 3);
    }
    lIndices = this._reworkIndices(lIndices); /* Need to rework this into strange FBX notation */
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

  /**
   * Divide cylinder (add additional vertexes) for prettiness TODO::VERY COMPLICATED NEED SIMPLIFYING! NEED TRANSPOSING ALSO!
   */
  _divideCylinders(mesh) {
    let resVertices = new Float32Array(0);
    let resIndices = new Float32Array(0);
    let resNormals = new Float32Array(0);
    let resColors = new Float32Array(0);
    /* Algorithm:
    * 1. Let first third of vertices as they are - normals, indices, vertex colors are as they are.
    * 2. Add additional vertices slightly under second third of vertices, copy normals and add color from color2 array
    * 3. Triangulate added segment (dont let him be void) - add indices
    * 4. Triangulate segment from added vertices to third third of original vertices - add indices
    * 5. Add color to last third of vertices and we're done */
    const meshColor1 = mesh.geometry.attributes.color.array;
    const meshColor2 = mesh.geometry.attributes.color2.array;
    const meshAlphaColor = mesh.geometry.attributes.alphaColor.array;
    const numInstances = mesh.geometry.attributes.alphaColor.count;
    for (let instanceIndex = 0; instanceIndex < numInstances; ++instanceIndex) { /* Proceed every instance */
      const lVertices = _.cloneDeep(mesh.geometry.attributes.position.array); /* Grab original vertices */
      const lNormals = _.cloneDeep(mesh.geometry.attributes.normal.array);
      let reworkedVertices = [];
      let reworkedNormals = [];
      const reworkedColors = [];
      const reworkedIndices = [];
      const lAlphas = [meshAlphaColor[instanceIndex]];
      const idxColors = instanceIndex * 3;
      const objectColor1 = this._reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]], lAlphas);
      const objectColor2 = this._reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]], lAlphas);
      /* For FBX we need to clone color for every vertex */
      const lColors1 = this._cloneColors(2 * mesh.geometry.attributes.position.array.length / 9, objectColor1);
      const lColors2 = this._cloneColors(2 * mesh.geometry.attributes.position.array.length / 9, objectColor2);
      const lIndices = this._collectInstancedIndices(mesh, instanceIndex);
      /* Step 1 */
      for (let j = 0; j < lVertices.length / 3; ++j) {
        reworkedVertices.push(lVertices[j]);
        reworkedNormals.push(lNormals[j]);
        reworkedColors.push(lColors1[j]);
      }
      for (let j = 0; j < lIndices.length; ++j) { /* Copying all indices cos they are good */
        reworkedIndices.push(lIndices[j]);
      }
      /* Step 2 */
      const additionalVertices = [];
      const additionalNormals = [];
      for (let j = lVertices.length / 3; j < 2 * lVertices.length / 3; ++j) {
        reworkedVertices.push(lVertices[j]);
        additionalVertices.push(lVertices[j]);
        reworkedNormals.push(lNormals[j]);
        additionalNormals.push(lNormals[j]);
        reworkedColors.push(lColors1[j]);
      }
      reworkedVertices = reworkedVertices.concat(additionalVertices);
      reworkedNormals = reworkedNormals.concat(additionalNormals);
      let k = 1;
      for (let j = 0; j < additionalVertices.length; ++j) {
        reworkedColors.push(lColors2[j]);
        reworkedVertices[k] -= 0.1; /* TODO:: 0.1 is temporary, need smth like 5% of cylinder! */
        k += 3;
      }
      for (let j = 2 * lVertices.length / 3; j < lVertices.length; ++j) { /* Last third of vertices */
        reworkedVertices.push(lVertices[j]);
        reworkedNormals.push(lNormals[j]);
        reworkedColors.push(lColors2[j]);
      }
      for (let j = 0; j < lIndices.length / 2; j += 3) {
        reworkedIndices.push(lIndices[j]);
        reworkedIndices.push(lIndices[j + 1]);
        reworkedIndices.push(-1 * (lIndices[j + 2] + 1));
      }
      /* Ending */
      /* Saving info from one instance to resulting model */
      resVertices = this._Float32Concat(resVertices, reworkedVertices);
      resNormals = this._Float32Concat(resNormals, reworkedNormals);
      resColors = this._Float32Concat(resColors, reworkedColors);
      resIndices = this._Float32Concat(resIndices, reworkedIndices);
    }
    /* For every float array we need to be sure that there are no numbers in exponential notation */
    this._models.push({
      vertices: this._correctArrayNotation(resVertices),
      indices: resIndices,
      normals: this._correctArrayNotation(resNormals),
      colors: this._correctArrayNotation(resColors),
    });
    /* Material info. Material for every sphere is the same so we want to collect it only 1 time */
    this._collectMaterialInfo(mesh);
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
      const matVector1 = mesh.geometry.attributes.matVector1.array;
      const matVector2 = mesh.geometry.attributes.matVector2.array;
      const matVector3 = mesh.geometry.attributes.matVector3.array;
      let idxOffset = 0;
      const numInstances = mesh.geometry.attributes.alphaColor.count;
      for (let i = 0; i < numInstances; ++i) {
        /* Firstly, collect some instanced parameters */
        const [lVertices, lNormals, lIndices, lColors] = this._collectRawInstancedGeometryParameters(mesh, i);
        /* Transformation info */
        const transformCylinder = new THREE.Matrix4();
        transformCylinder.set(matVector1[idxOffset], matVector2[idxOffset], matVector3[idxOffset], 0,
          matVector1[idxOffset + 1], matVector2[idxOffset + 1], matVector3[idxOffset + 1], 0,
          matVector1[idxOffset + 2], matVector2[idxOffset + 2], matVector3[idxOffset + 2], 0,
          matVector1[idxOffset + 3], matVector2[idxOffset + 3], matVector3[idxOffset + 3], 1);
        transformCylinder.transpose();
        idxOffset += 4;
        /* Complex Algorithm for Cylinder slicing */
        /* Applying offsets / transformation to every vertex */
        /* First side - top plane */
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
        /* Saving info from one instance to resulting model */
        resVertices = this._Float32Concat(resVertices, lVertices);
        resNormals = this._Float32Concat(resNormals, lNormals);
        resColors = this._Float32Concat(resColors, lColors);
        resIndices = this._Float32Concat(resIndices, lIndices);
      }
      /* For every float array we need to be sure that there are no numbers in exponential notation */
      this._models.push({
        vertices: this._correctArrayNotation(resVertices),
        indices: resIndices,
        normals: this._correctArrayNotation(resNormals),
        colors: this._correctArrayNotation(resColors),
      });
      this._collectMaterialInfo(mesh);
    } else this._divideCylinders(mesh);
  }

  /**
   * Collect instanced models and materials.
   */
  _collectInstancedInfo(mesh) {
    if (typeof mesh.geometry.attributes.offset !== 'undefined') { /* That's spheres */
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
        this._meshes.push(object);
      }
    });
    /* Then we need to gather only mask === 1 vertices */
    for (let i = 0; i < this._meshes.length; ++i) {
      // if (this._meshes[i].layers.test(gfxutils.LAYERS.DEFAULT)) { /* It means something */
      const mesh = this._meshes[i];
      if (mesh.layers.mask === 1 || mesh.layers.mask === 4) { /* TODO: Implement what's written on top of that */
        if (mesh.geometry.type === 'InstancedBufferGeometry') { /* If instancing */
          this._collectInstancedInfo(mesh);
        } else { /* Not instancing */
          this._collectStraightGeometryInfo(mesh);
        }
      }
    }
    return [this._addModelsToResult(), this._addMaterialsToResult()].join('');
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
    return [mandatoryComment, result].join('');
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
    return [mandatoryComment, relations].join('');
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
    return [mandatoryComment, connections].join('');
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
    return [header, definitions, objects, relations, connections, animation].join('');
  }
}

FBXExporter.formats = ['fbx'];
