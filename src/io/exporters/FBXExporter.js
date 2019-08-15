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
  }

  /**
   * Add FBXHeader info to output file.
   * Some fields are really confusing, but it seems that all listed fields are very informative
   */
  createFBXHeader() {
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

    const outputData = 'FBXHeaderExtension:  {\n'
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
      + `Creator: "${CreatorTool}"\n`;

    return outputData;
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
      + '}';
    return definitions;
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
   * Add Models info to output file.
   */
  _addModels() {
    const modelName = `Model::${this._data.name}`;
    const Version = 232; /* Mystery number */
    /* Setting up default properties */
    const modelProperties = `Model: "${modelName}", "Mesh" {\n`
    + `\tVersion: ${Version}\n`
    + '\tProperties60: {\n'
    + '\t\tProperty: "QuaternionInterpolate", "bool", "",0\n'
    + '\t\tProperty: "Visibility", "Visibility", "A",1\n'
    + '\t\tProperty: "Lcl Translation", "Lcl Translation", "A",0.000000000000000,0.000000000000000,-1789.238037109375000\n'
    + '\t\tProperty: "Lcl Rotation", "Lcl Rotation", "A",0.000009334667643,-0.000000000000000,0.000000000000000\n'
    + '\t\tProperty: "Lcl Scaling", "Lcl Scaling", "A",1.000000000000000,1.000000000000000,1.000000000000000\n'
    + '\t\tProperty: "RotationOffset", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "RotationPivot", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "ScalingOffset", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "ScalingPivot", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "TranslationActive", "bool", "",0\n'
    + '\t\tProperty: "TranslationMin", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "TranslationMax", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "TranslationMinX", "bool", "",0\n'
    + '\t\tProperty: "TranslationMinY", "bool", "",0\n'
    + '\t\tProperty: "TranslationMinZ", "bool", "",0\n'
    + '\t\tProperty: "TranslationMaxX", "bool", "",0\n'
    + '\t\tProperty: "TranslationMaxY", "bool", "",0\n'
    + '\t\tProperty: "TranslationMaxZ", "bool", "",0\n'
    + '\t\tProperty: "RotationOrder", "enum", "",0\n'
    + '\t\tProperty: "RotationSpaceForLimitOnly", "bool", "",0\n'
    + '\t\tProperty: "AxisLen", "double", "",10\n'
    + '\t\tProperty: "PreRotation", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "PostRotation", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "RotationActive", "bool", "",0\n'
    + '\t\tProperty: "RotationMin", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "RotationMax", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "RotationMinX", "bool", "",0\n'
    + '\t\tProperty: "RotationMinY", "bool", "",0\n'
    + '\t\tProperty: "RotationMinZ", "bool", "",0\n'
    + '\t\tProperty: "RotationMaxX", "bool", "",0\n'
    + '\t\tProperty: "RotationMaxY", "bool", "",0\n'
    + '\t\tProperty: "RotationMaxZ", "bool", "",0\n'
    + '\t\tProperty: "RotationStiffnessX", "double", "",0\n'
    + '\t\tProperty: "RotationStiffnessY", "double", "",0\n'
    + '\t\tProperty: "RotationStiffnessZ", "double", "",0\n'
    + '\t\tProperty: "MinDampRangeX", "double", "",0\n'
    + '\t\tProperty: "MinDampRangeY", "double", "",0\n'
    + '\t\tProperty: "MinDampRangeZ", "double", "",0\n'
    + '\t\tProperty: "MaxDampRangeX", "double", "",0\n'
    + '\t\tProperty: "MaxDampRangeY", "double", "",0\n'
    + '\t\tProperty: "MaxDampRangeZ", "double", "",0\n'
    + '\t\tProperty: "MinDampStrengthX", "double", "",0\n'
    + '\t\tProperty: "MinDampStrengthY", "double", "",0\n'
    + '\t\tProperty: "MinDampStrengthZ", "double", "",0\n'
    + '\t\tProperty: "MaxDampStrengthX", "double", "",0\n'
    + '\t\tProperty: "MaxDampStrengthY", "double", "",0\n'
    + '\t\tProperty: "MaxDampStrengthZ", "double", "",0\n'
    + '\t\tProperty: "PreferedAngleX", "double", "",0\n'
    + '\t\tProperty: "PreferedAngleY", "double", "",0\n'
    + '\t\tProperty: "PreferedAngleZ", "double", "",0\n'
    + '\t\tProperty: "InheritType", "enum", "",0\n'
    + '\t\tProperty: "ScalingActive", "bool", "",0\n'
    + '\t\tProperty: "ScalingMin", "Vector3D", "",1,1,1\n'
    + '\t\tProperty: "ScalingMax", "Vector3D", "",1,1,1\n'
    + '\t\tProperty: "ScalingMinX", "bool", "",0\n'
    + '\t\tProperty: "ScalingMinY", "bool", "",0\n'
    + '\t\tProperty: "ScalingMinZ", "bool", "",0\n'
    + '\t\tProperty: "ScalingMaxX", "bool", "",0\n'
    + '\t\tProperty: "ScalingMaxY", "bool", "",0\n'
    + '\t\tProperty: "ScalingMaxZ", "bool", "",0\n'
    + '\t\tProperty: "GeometricTranslation", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "GeometricRotation", "Vector3D", "",0,0,0\n'
    + '\t\tProperty: "GeometricScaling", "Vector3D", "",1,1,1\n'
    + '\t\tProperty: "LookAtProperty", "object", ""\n'
    + '\t\tProperty: "UpVectorProperty", "object", ""\n'
    + '\t\tProperty: "Show", "bool", "",1\n'
    + '\t\tProperty: "NegativePercentShapeSupport", "bool", "",1\n'
    + '\t\tProperty: "DefaultAttributeIndex", "int", "",0\n'
    + '\t\tProperty: "Color", "Color", "A",0.8,0.8,0.8\n'
    + '\t\tProperty: "Size", "double", "",100\n'
    + '\t\tProperty: "Look", "enum", "",1\n'
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
        this._indices = Float32Concat(this._indices, this._reworkIndices(this._meshes[i].geometry.index.array)); /* TODO: need to rework this into strange FBX notation */
        this._normals = Float32Concat(this._normals, this._meshes[i].geometry.attributes.normal.array);
        this._colors = Float32Concat(this._colors, this._meshes[i].geometry.attributes.color.array);
      } else {
        /* Collect info only about material */
      }
    }
    const geometryVersion = 124;
    const verticesIndices = `\tMultiLayer: ${multiLayer}\n`
    + `\tMultiTake: ${multiTake}\n`
    + `\tShading: ${shading}\n`
    + `\tCulling: "${culling}"\n`
    + `\tVertices: ${this._vertices}\n`
    + `\tPolygonVertexIndex: ${this._indices}\n`
    + `\tGeometryVersion: ${geometryVersion}\n`;
    /* Setting up layers */
    const layerElementNormalNumber = 0; /* IDK what that is */
    const layerElementNormalVersion = 101; /* IDK what version means */
    const layerElementNormalName = ''; /* IDK what name means */
    const layerElementNormal = `LayerElementNormal: ${layerElementNormalNumber} {\n`
     + `\t\tVersion: ${layerElementNormalVersion}\n`
     + `\t\tName: "${layerElementNormalName}"\n`
     + '\t\tMappingInformationType: "ByVertex"\n' /* Mandatory for our Miew! Must not be changed */
     + '\t\tReferenceInformationType: "Direct"\n' /* Mandatory for our Miew! Must not be changed */
     + `\t\tNormals: ${this._normals}\n`
     + '\t}\n';
    const layerElementSmoothing = '';
    const layerElementUV = '';
    const layerElementTexture = '';
    const layerElementMaterial = '';
    const layer = '\t\tLayer: 0 {\n'
    + '\t\t\tVersion: 100\n'
    + '\t\t\tLayerElement:  {\n'
    + '\t\t\t\tType: "LayerElementNormal"\n'
    + '\t\t\t\tTypedIndex: 0\n'
    + '\t\t\t}\n'
    + '\t\t}\n'
    + '\t}\n';
    const resultingLayer = [layerElementNormal, layerElementSmoothing, layerElementUV, layerElementTexture, layerElementMaterial, layer].join('');
    return [modelProperties, verticesIndices, resultingLayer].join('');
  }

  /**
   * Add Materials info to output file.
   */
  _addMaterials() {
  }

  /**
   * Add Pose info to output file.
   */
  _addPose() {
  }

  /**
   * Add GlobalSettings info to output file.
   */
  _addGlobalSettings() {
  }

  /**
   * Add Objects info to output file.
   */
  createObjects() {
    const result = 'Objects:  {\n'
      + `\tModel: ${this._addModels()} \n`
      + `\tMaterial: ${this._addMaterials()}\n`
      + `\tPose: ${this._addPose()}\n`
      + `\tGlobalSettings: ${this._addGlobalSettings()}\n`;
    return result;
  }

  /**
   * Add Relations info to output file.
   */
  createRelations() {
    return '';
  }

  /**
   * Add Connections info to output file.
   */
  createConnections() {
    return '';
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
