// Forming default definitions block
const defaultDefinitions = `
Definitions:  {
  Version: 100
  Count: 3
  ObjectType: "Model" {
    Count: 1
  }
  ObjectType: "Geometry" {
    Count: 1
  }
  ObjectType: "Material" {
    Count: 1
  }
  ObjectType: "Pose" {
    Count: 1
  }
  ObjectType: "GlobalSettings" {
    Count: 1
  }
} `;

// Default model properties
const defaultProperties = `Properties60: {
      Property: "QuaternionInterpolate", "bool", "",0
      Property: "Visibility", "Visibility", "A",1
      Property: "Lcl Translation", "Lcl Translation", "A",0.000000000000000,0.000000000000000,-1789.238037109375000
      Property: "Lcl Rotation", "Lcl Rotation", "A",0.000009334667643,-0.000000000000000,0.000000000000000
      Property: "Lcl Scaling", "Lcl Scaling", "A",1.000000000000000,1.000000000000000,1.000000000000000
      Property: "RotationOffset", "Vector3D", "",0,0,0
      Property: "RotationPivot", "Vector3D", "",0,0,0
      Property: "ScalingOffset", "Vector3D", "",0,0,0
      Property: "ScalingPivot", "Vector3D", "",0,0,0
      Property: "TranslationActive", "bool", "",0
      Property: "TranslationMin", "Vector3D", "",0,0,0
      Property: "TranslationMax", "Vector3D", "",0,0,0
      Property: "TranslationMinX", "bool", "",0
      Property: "TranslationMinY", "bool", "",0
      Property: "TranslationMinZ", "bool", "",0
      Property: "TranslationMaxX", "bool", "",0
      Property: "TranslationMaxY", "bool", "",0
      Property: "TranslationMaxZ", "bool", "",0
      Property: "RotationOrder", "enum", "",0
      Property: "RotationSpaceForLimitOnly", "bool", "",0
      Property: "AxisLen", "double", "",10
      Property: "PreRotation", "Vector3D", "",0,0,0
      Property: "PostRotation", "Vector3D", "",0,0,0
      Property: "RotationActive", "bool", "",0
      Property: "RotationMin", "Vector3D", "",0,0,0
      Property: "RotationMax", "Vector3D", "",0,0,0
      Property: "RotationMinX", "bool", "",0
      Property: "RotationMinY", "bool", "",0
      Property: "RotationMinZ", "bool", "",0
      Property: "RotationMaxX", "bool", "",0
      Property: "RotationMaxY", "bool", "",0
      Property: "RotationMaxZ", "bool", "",0
      Property: "RotationStiffnessX", "double", "",0
      Property: "RotationStiffnessY", "double", "",0
      Property: "RotationStiffnessZ", "double", "",0
      Property: "MinDampRangeX", "double", "",0
      Property: "MinDampRangeY", "double", "",0
      Property: "MinDampRangeZ", "double", "",0
      Property: "MaxDampRangeX", "double", "",0
      Property: "MaxDampRangeY", "double", "",0
      Property: "MaxDampRangeZ", "double", "",0
      Property: "MinDampStrengthX", "double", "",0
      Property: "MinDampStrengthY", "double", "",0
      Property: "MinDampStrengthZ", "double", "",0
      Property: "MaxDampStrengthX", "double", "",0
      Property: "MaxDampStrengthY", "double", "",0
      Property: "MaxDampStrengthZ", "double", "",0
      Property: "PreferedAngleX", "double", "",0
      Property: "PreferedAngleY", "double", "",0
      Property: "PreferedAngleZ", "double", "",0
      Property: "InheritType", "enum", "",0
      Property: "ScalingActive", "bool", "",0
      Property: "ScalingMin", "Vector3D", "",1,1,1
      Property: "ScalingMax", "Vector3D", "",1,1,1
      Property: "ScalingMinX", "bool", "",0
      Property: "ScalingMinY", "bool", "",0
      Property: "ScalingMinZ", "bool", "",0
      Property: "ScalingMaxX", "bool", "",0
      Property: "ScalingMaxY", "bool", "",0
      Property: "ScalingMaxZ", "bool", "",0
      Property: "GeometricTranslation", "Vector3D", "",0,0,0
      Property: "GeometricRotation", "Vector3D", "",0,0,0
      Property: "GeometricScaling", "Vector3D", "",1,1,1
      Property: "LookAtProperty", "object", ""
      Property: "UpVectorProperty", "object", ""
      Property: "Show", "bool", "",1
      Property: "NegativePercentShapeSupport", "bool", "",1
      Property: "DefaultAttributeIndex", "int", "",0
      Property: "Color", "Color", "A+",0,0,0
      Property: "Size", "double", "",100
      Property: "Look", "enum", "",1
    }`;

// Default materials layer
const defaultMaterialLayer = `
    LayerElementMaterial: 0 {
      Version: 101
      Name: ""
      MappingInformationType: "AllSame"
      ReferenceInformationType: "Direct"
      Materials: 0
    }`;

// Default layers block
const defaultLayerBlock = `
    Layer: 0 {
      Version: 100
      LayerElement:  {
        Type: "LayerElementNormal"
        TypedIndex: 0
      }
      LayerElement:  {
        Type: "LayerElementColor"
        TypedIndex: 0
      }
      LayerElement:  {
        Type: "LayerElementMaterial"
        TypedIndex: 0
      }
    }`;

/**
 * globalSettings info in output file.
 */
const globalSettings = `GlobalSettings: {
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
  }`;

export default class FBXResult {
  constructor() {
    this._resultArray = [];
    this._info = null;
  }

  getResult(info) {
    this._info = info;
    this._resultArray.push(this._writeHeader());
    this._resultArray.push(this._writeDefinitions());
    this._resultArray.push(this._writeObjects(info.models, info.materials));
    this._resultArray.push(this._writeRelations());
    this._resultArray.push(this._writeConnections()); // connections between models and materials)
    this._info = null;
    return this._resultArray.join('');
  }

  /**
   * Add FBXHeader info to output file.
   * Some fields are really confusing, but it seems that all listed fields are very informative
   */
  _writeHeader() {
    const FBXHeaderVersion = 1003; // 1003 is some number which appears to present in many 6.1 ASCII files
    const FBXVersion = 6100; // Mandatory and only supported version
    const date = new Date();
    const timeStampVersion = 1000;
    const creator = `Miew FBX Exporter v${this._info.version}`; // Supposed to be an engine

    return `; FBX 6.1.0 project file
; Created by ${creator} Copyright (c) 2015-2025 EPAM Systems, Inc.
; For support please contact miew@epam.com
; ----------------------------------------------------

FBXHeaderExtension:  {
  FBXHeaderVersion: ${FBXHeaderVersion}
  FBXVersion: ${FBXVersion}
  CreationTimeStamp:  {
    Version: ${timeStampVersion}
    Year: ${date.getFullYear()}
    Month: ${date.getMonth() + 1}
    Day: ${date.getDate()}
    Hour: ${date.getHours()}
    Minute: ${date.getMinutes()}
    Second: ${date.getSeconds()}
    Millisecond: ${date.getMilliseconds()}
  }
  Creator: "${creator}"
  OtherFlags:  {
    FlagPLE: 0
  }
}
CreationTime: "${date}"
Creator: "${creator}"
`;
  }

  /**
   * Add Definitions info to output file.
   * Not exactly sure if this section is template section (as it is in 7.4+) or it should every time be like this
   */
  _writeDefinitions() {
    return `
; Object definitions
;------------------------------------------------------------------

${defaultDefinitions}
`;
  }

  /**
   * Adding gathered information about Models to resulting string.
   * Reminder - there may be more then 1 model in scene, but we must place materials after ALL models.
   * @returns {string} string containing all models (vertices, indices, colors, normals etc)
   */
  _models() {
    const modelVersion = 232;
    let allModels = '';
    const { models } = this._info;
    for (let i = 0; i < models.length; ++i) {
      const model = models[i];
      const vertCount = model.verticesCount;
      allModels += `
  Model: "Model::${this._info.name}_${i}", "Mesh" {
    Version: ${modelVersion}
    ${defaultProperties}
    ${this._verticesIndices(model.positions, model.indices)}
    ${this._normalLayer(model.normals)}
    ${this._colorLayer(model.colors, vertCount)}
    ${defaultMaterialLayer}
    ${defaultLayerBlock}
  }`;
    }
    return allModels;
  }

  /**
   * Add Material info to result
   */
  _materials() {
    const materialVersion = 102;
    let allMaterials = '';
    const { materials } = this._info;
    for (let i = 0; i < materials.length; ++i) {
      const material = materials[i];
      allMaterials += `
  Material: "Material::${this._info.name}_${i}_default", "" {
    Version: ${materialVersion}
    ShadingModel: "lambert"
    MultiLayer: 0
    ${this._materialProperties(material)}
  }`;
    }
    return allMaterials;
  }

  /**
   * Add Objects info to output file.
   */
  _writeObjects() {
    return `
; Object properties
;------------------------------------------------------------------

Objects:  {
  ${this._models()}
  ${this._materials()}
  ${globalSettings}
}
`;
  }

  /**
   * Add Relations info to output file.
   */
  _writeRelations() {
    let modelsList = '';
    for (let i = 0; i < this._info.models.length; ++i) {
      modelsList += `
  Model: "Model::${this._info.name}_${i}", "Mesh" {
  }`;
    }
    let materialList = '';
    for (let i = 0; i < this._info.materials.length; ++i) {
      materialList += `
  Material: "Material::${this._info.name}_${i}_default", "" {
  }`;
    }

    return `
; Object relations
;------------------------------------------------------------------

Relations:  {
  ${modelsList}
  Model: "Model::Producer Perspective", "Camera" {
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
  ${materialList}
}`;
  }

  /**
   * Add Connections info to output file.
   */
  _writeConnections() {
    let modelsList = '';
    const { name } = this._info;
    for (let i = 0; i < this._info.models.length; ++i) {
      modelsList += `
  Connect: "OO", "Model::${name}_${i}", "Model::Scene"`;
    }

    let materialList = '';
    for (let i = 0; i < this._info.materials.length; ++i) {
      materialList += `
  Connect: "OO", "Material::${name}_${i}_default", "Model::${name}_${i}"`;
    }

    return `
; Object connections
;------------------------------------------------------------------

Connections:  {
  ${modelsList}
  ${materialList}
}`;
  }

  /**
   * Write float array to string with limited precision
   * @param {Float32Array} array - array to be fixed
   * @returns {String} String with fixed floats
   */
  _floatArrayToString(array) {
    const str = [];
    for (let i = 0; i < array.length; ++i) {
      str[i] = array[i].toFixed(6);
    }
    return str.join(',');
  }

  /**
   * Adding color layer to resulting file
   * @param {Float32Array} colorArray attribute
   * @param {number} vertCount - number of vertices in the model
   * @returns {string} color layer info
   */
  _colorLayer(colorArray, vertCount) {
    const layerElementColorNumber = 0;
    const layerElementColorVersion = 101;
    const layerElementColorName = '';
    const colorsStr = this._floatArrayToString(colorArray);
    // Mapping Information type and Reference Information type are mandatory for our Miew! Must not be changed
    // As said [..Array(...)] - fastest and easiest way to produce [0, 1, .....] array
    const colorIndices = [...Array(vertCount).keys()];
    return `
    LayerElementColor: ${layerElementColorNumber} {
      Version: ${layerElementColorVersion}
      Name: "${layerElementColorName}"
      MappingInformationType: "ByVertice"
      ReferenceInformationType: "Direct"
      Colors: ${colorsStr}
      ColorIndex: ${colorIndices}
    }`;
  }

  /**
   * Adding normal layer to resulting file
   * @param {Float32Array} normalArray attribute
   * @returns {string} normal layer info
   */
  _normalLayer(normalArray) {
    const layerElementNormalNumber = 0;
    const layerElementNormalVersion = 101;
    const layerElementNormalName = '';
    const normalsStr = this._floatArrayToString(normalArray);
    // Mapping Information type and Reference Information type are mandatory for our Miew! Must not be changed
    return `
    LayerElementNormal: ${layerElementNormalNumber} {
      Version: ${layerElementNormalVersion}
      Name: "${layerElementNormalName}"
      MappingInformationType: "ByVertice"
      ReferenceInformationType: "Direct"
      Normals: ${normalsStr}
    }`;
  }

  /**
   * Adding vertices and indices to resulting string
   * @return {string} resulting string in FBX notation
   */
  _verticesIndices(positions, indices) {
    const multiLayer = 0;
    const multiTake = 1;
    const shading = 'Y';
    const culling = 'CullingOff';
    const geometryVersion = 124;
    const vertStr = this._floatArrayToString(positions);
    /* About _correctArrayNotation: Float32Arrays will contains only Float32 numbers, which implies that it will be floating points with 17 numbers after point.
    * We cannot (and it's logically incorrect) save all this information, so we convert this Float32Array into Array-like object with numbers with only 6 numbers after point
    * Reminder - this is big memory loss (as we must save at one moment two arrays with similar information) */
    return `MultiLayer: ${multiLayer}
    MultiTake: ${multiTake}
    Shading: ${shading}
    Culling: "${culling}"
    Vertices: ${vertStr}
    PolygonVertexIndex: ${indices}
    GeometryVersion: ${geometryVersion}`;
  }

  /**
   * Forming material properties block.
   * @param {Object} material - given material of model
   * @returns {String} material properties string
   */
  _materialProperties(material) {
    return `Properties60:  {
      Property: "ShadingModel", "KString", "", "Lambert"
      Property: "MultiLayer", "bool", "",0
      Property: "EmissiveColor", "ColorRGB", "",0,0,0
      Property: "EmissiveFactor", "double", "",0.0000
      Property: "AmbientColor", "ColorRGB", "",1,1,1
      Property: "AmbientFactor", "double", "",0.0000
      Property: "DiffuseColor", "ColorRGB", "",${material.diffuse}
      Property: "DiffuseFactor", "double", "",1.0000
      Property: "Bump", "Vector3D", "",0,0,0
      Property: "TransparentColor", "ColorRGB", "",1,1,1
      Property: "TransparencyFactor", "double", "",0.0000
      Property: "SpecularColor", "ColorRGB", "",${material.specular}
      Property: "SpecularFactor", "double", "",1.0000
      Property: "ShininessExponent", "double", "",${material.shininess}
      Property: "ReflectionColor", "ColorRGB", "",0,0,0
      Property: "ReflectionFactor", "double", "",1
      Property: "Ambient", "ColorRGB", "",1,1,1
      Property: "Diffuse", "ColorRGB", "",${material.diffuse}
      Property: "Specular", "ColorRGB", "",${material.specular}
      Property: "Shininess", "double", "",${material.shininess}
      Property: "Opacity", "double", "",${material.opacity}
      Property: "Reflectivity", "double", "",0
    }`;
  }
}
