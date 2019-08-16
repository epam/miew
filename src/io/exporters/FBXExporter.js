import * as THREE from 'three';
import _ from 'lodash';
import Exporter from './Exporter';

/**
 * Extension to standard Float32Arrays.
 * @param{Float32Array} first  - destination array
 * @param{Float32Array} second - source array
 * @returns{Float32Array} resulting concatenated array
 */

function Float32Concat(first, second) {
  const firstLength = first.length;
  const result = new Float32Array(firstLength + second.length);

  result.set(first);
  result.set(second, firstLength);

  return result;
}

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
    this._vertices = [];
    this._colors = [];
    this._normals = [];
    this._indices = [];
    this._alphas = [];
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
   * @param{array} array - indices buffer
   * @returns{Int16Array} reworked array.
   */
  _reworkIndices(array) {
    const clonedArray = new Int16Array(array.length);
    clonedArray.set(array);
    for (let i = 2; i < clonedArray.length; i += 3) {
      clonedArray[i] *= -1;
      clonedArray[i]--;
    }
    return clonedArray;
  }

  /**
   * Reworking colors buffer + alpha, see https://raw.githubusercontent.com/wayt/Bomberman/master/Assets/fire.fbx
   * @param{array} colorArray - colors buffer
   * @param{array} alphaArray - alpha buffer
   * @returns{Float32Array} reworked array.
   */
  _reworkColors(colorArray, alphaArray) {
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

  /**
   * Add Models info to output file.
   */
  _addModels() {
    const modelName = `Model::${this._data.name}`;
    const Version = 232; /* Mystery number */
    /* Setting up default properties */
    const modelProperties = `Model: "${modelName}", "Mesh" {\n`
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
    /* To gather vertices we need to traverse this._data object */
    this._data.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        this._meshes.push(object);
      }
    });
    /* Then we need to gather only mask === 1 vertices */
    for (let i = 0; i < this._meshes.length; ++i) {
      if (this._meshes[i].layers.mask === 1) { /* TODO: How to check? */
        /* Collect info about vertices + indices + material */
        this._vertices = Float32Concat(this._vertices, this._meshes[i].geometry.attributes.position.array);
        this._indices = Float32Concat(this._indices, this._reworkIndices(this._meshes[i].geometry.index.array)); /* Need to rework this into strange FBX notation */
        this._normals = Float32Concat(this._normals, this._meshes[i].geometry.attributes.normal.array);
        this._alphas = Float32Concat(this._alphas, this._meshes[i].geometry.attributes.alphaColor.array);
        if (this._meshes[i].geometry.attributes.color.array.length >= 1) {
          this._colors = Float32Concat(this._colors, this._reworkColors(this._meshes[i].geometry.attributes.color.array, this._alphas)); /* Need to rework this into strange FBX notation */
        }
      } else {
        /* Collect info only about material */
      }
    }
    const geometryVersion = 124;
    const verticesIndices = `\t\tMultiLayer: ${multiLayer}\n`
    + `\t\tMultiTake: ${multiTake}\n`
    + `\t\tShading: ${shading}\n`
    + `\t\tCulling: "${culling}"\n`
    + `\t\tVertices: ${this._vertices}\n\n`
    + `\t\tPolygonVertexIndex: ${this._indices}\n\n`
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
     + `\t\t\tNormals: ${this._normals}\n`
     + '\t\t}\n';
    /* next few layerElements are not in use, but we left it for maybe further compatibility */
    const layerElementSmoothing = '';
    const layerElementUV = '';
    const layerElementTexture = '';
    const layerElementMaterial = '';
    /* but colors are actually in-use */
    const layerElementColorNumber = 0; /* IDK what that is */
    const layerElementColorVersion = 101; /* IDK what version means */
    const layerElementColorName = ''; /* IDK what name means */
    const layerElementColor = `\t\tLayerElementColor: ${layerElementColorNumber} {\n`
    + `\t\t\tVersion: ${layerElementColorVersion}\n`
    + `\t\t\tName: "${layerElementColorName}"\n`
    + '\t\t\tMappingInformationType: "ByVertice"\n' /* Mandatory for our Miew! Must not be changed */
    + '\t\t\tReferenceInformationType: "Direct"\n' /* Mandatory for our Miew! Must not be changed */
    + `\t\t\tColors: ${this._colors}\n`
    + `\t\t\tColorIndex: ${[...Array(this._alphas.length).keys()]}\n`
    + '\t\t}\n';
    /* TODO: automatically check and build this info */
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
    + '\t\t}\n'
    + '\t}\n';
    const resultingLayer = [layerElementNormal, layerElementSmoothing, layerElementUV, layerElementTexture, layerElementMaterial, layerElementColor, layer].join('');
    return [modelProperties, verticesIndices, resultingLayer].join('');
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
      + `\tModel: ${this._addModels()}`
      + `\tGlobalSettings: ${this._addGlobalSettings()}`;
    return [mandatoryComment, result].join('');
  }

  /**
   * Add Relations info to output file.
   */
  createRelations() {
    const mandatoryComment = '; Object relations\n'
    + ';------------------------------------------------------------------\n\n';
    const relations = 'Relations:  {\n'
    + `\tModel: "Model::${this._data.name}", "Mesh" {\n`
    + '\t}\n'
    + '\tModel: "Model::Producer Perspective", "Camera" {\n'
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
    + '\t}\n'
    + '}\n\n';
    return [mandatoryComment, relations].join('');
  }

  /**
   * Add Connections info to output file.
   */
  createConnections() {
    const mandatoryComment = '; Object connections\n'
      + ';------------------------------------------------------------------\n\n'
    const connections = 'Connections:  {\n'
    + `\tConnect: "OO", "Model::${this._data.name}", "Model::Scene"\n`
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
    /* TEMPORARY: */
    this._outputFile = 'exportedFile.fbx';
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
