import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';

/**
 * Reworking indices buffer, see https://banexdevblog.wordpress.com/2014/06/23/a-quick-tutorial-about-the-fbx-ascii-format/
 * basically, every triangle in Miew has been represented hat way (e.g.) : 0,1,7, but we must (for FBX) rework that into: 0,1,-8.
 * @param{Int32Array} array - indices buffer
 * @returns{Int32Array} reworked array.
 */
function reworkIndices(array) {
  const clonedArray = new Int32Array(array.length); /* In some future we might want to rework this to bigint64, but currently it haven't been supported in many browsers */
  clonedArray.set(array);
  for (let i = 2; i < clonedArray.length; i += 3) {
    clonedArray[i] *= -1;
    clonedArray[i]--;
  }
  return clonedArray;
}

/**
 * Reworking colors buffer + alpha, see https://raw.githubusercontent.com/wayt/Bomberman/master/Assets/fire.fbx
 * Basically we have two arrays - color array and alpha array, and we need to put 1 alpha after 3 colors, so therefore this algorithm presents.
 * @param{array} colorArray - colors buffer
 * @param{[*]} alphaArray - alpha buffer
 * @returns{Float32Array} reworked array.
 */
function reworkColors(colorArray, alphaArray) {
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


/**
 * Clone colors from one to number of vertices
 * @returns {Float32Array} array with cloned colors
 */
function cloneColors(numVertices, color) {
  const clonedArray = new Float32Array(numVertices * 4); /* RGBA for every vertex */
  for (let i = 0; i < clonedArray.length; i += 4) {
    clonedArray.set(color, i);
  }
  return clonedArray;
}

/**
 * Rework numbers notation from scientific (exponential) to normal
 * @param {Float32Array} array - array to be fixed
 * @returns {[]} Array of numbers in correct notation
 */
function correctArrayNotation(array) {
  const reworkedArray = [];
  for (let i = 0; i < array.length; ++i) {
    reworkedArray[i] = parseFloat(array[i].toFixed(6)); /* Default, i guess? */
  }
  return reworkedArray;
}

/**
 * Collect Material info from given mesh.
 * @param {object} mesh - given mesh with material info
 * @returns {object} gathered material
 */
function collectMaterialInfo(mesh) {
  const {
    material: {
      uberOptions,
    },
  } = mesh;
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

/* Default model properties */
const defaultProperties = '\t\tProperties60: {\n'
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

/**
 * Calculate parameters for one cylinder in given mesh.
 * @param {object} mesh - mesh with instanced objects
 * @param {Number} instanceIndex - number of instance in mesh
 * @returns {*[]} array of gathered transformations of vertices and normals
 */
function calculateCylinderTransform(mesh, instanceIndex) {
  /* Misc variables */
  const {
    geometry: {
      attributes,
    },
  } = mesh;
  const matVector1 = attributes.matVector1.array;
  const matVector2 = attributes.matVector2.array;
  const matVector3 = attributes.matVector3.array;
  /* Grab original vertices and normals */
  const lVertices = _.cloneDeep(attributes.position.array);
  const lNormals = _.cloneDeep(attributes.normal.array);
  /* We have vertices for not transformed cylinder. Need to make it transformed */
  const transformCylinder = new THREE.Matrix4();
  const idxOffset = instanceIndex * 4;
  transformCylinder.set(matVector1[idxOffset], matVector2[idxOffset], matVector3[idxOffset], 0,
    matVector1[idxOffset + 1], matVector2[idxOffset + 1], matVector3[idxOffset + 1], 0,
    matVector1[idxOffset + 2], matVector2[idxOffset + 2], matVector3[idxOffset + 2], 0,
    matVector1[idxOffset + 3], matVector2[idxOffset + 3], matVector3[idxOffset + 3], 1);
  /* For a reason we must perform transpose of that matrix */
  transformCylinder.transpose();
  const normVec = new THREE.Vector4();
  const vertVec = new THREE.Vector4();
  /* Applying offsets / transformation to every vertex */
  for (let j = 0; j < lVertices.length; j += 3) {
    vertVec.set(lVertices[j], lVertices[j + 1], lVertices[j + 2], 1);
    vertVec.applyMatrix4(transformCylinder);
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

/**
 * Collect and rework colors in big model notation.
 * @param {object} mesh - mesh with instanced objects
 * @param {Number} instanceIndex - number of instance in mesh
 * @returns {Float32Array} array of gathered instanced colors
 */
function collectInstancedColors(mesh, instanceIndex) {
  const {
    geometry: {
      attributes: {
        color,
        alphaColor,
        position,
      },
    },
  } = mesh;
  const idxColors = (instanceIndex * 3); /* that's not magic. For 1st instance we must start from 0, for 2nd - from 3, etc */
  const meshColor = color.array;
  const meshAlphaColor = alphaColor.array;
  const lAlphas = [meshAlphaColor[instanceIndex]];
  const objectColor = reworkColors([meshColor[idxColors], meshColor[idxColors + 1], meshColor[idxColors + 2]], lAlphas);
  /* For FBX we need to clone color for every vertex */
  const lColors = cloneColors(position.array.length / 3, objectColor);
  return lColors;
}

/**
 * Adding color layer to resulting file
 * @returns {string} color layer info
 */
function colorLayer(colorArray) {
  const layerElementColorNumber = 0; /* IDK what that is */
  const layerElementColorVersion = 101; /* IDK what version means */
  const layerElementColorName = ''; /* IDK what name means */
  return (`\t\tLayerElementColor: ${layerElementColorNumber} {\n`
    + `\t\t\tVersion: ${layerElementColorVersion}\n`
    + `\t\t\tName: "${layerElementColorName}"\n`
    + '\t\t\tMappingInformationType: "ByVertice"\n' /* Mandatory for our Miew! Must not be changed */
    + '\t\t\tReferenceInformationType: "Direct"\n' /* Mandatory for our Miew! Must not be changed */
    + `\t\t\tColors: ${correctArrayNotation(colorArray)}\n`
    + `\t\t\tColorIndex: ${[...Array(colorArray.length / 4).keys()]}\n` /* As said - fastest and easiest way to produce [0, 1, .....] array */
    + '\t\t}\n');
}

/**
 * Adding normal layer to resulting file
 * @returns {string} normal layer info
 */
function normalLayer(normalArray) {
  const layerElementNormalNumber = 0; /* IDK what that is */
  const layerElementNormalVersion = 101; /* IDK what version means */
  const layerElementNormalName = ''; /* IDK what name means */
  return (`\t\tLayerElementNormal: ${layerElementNormalNumber} {\n`
    + `\t\t\tVersion: ${layerElementNormalVersion}\n`
    + `\t\t\tName: "${layerElementNormalName}"\n`
    + '\t\t\tMappingInformationType: "ByVertice"\n' /* Mandatory for our Miew! Must not be changed */
    + '\t\t\tReferenceInformationType: "Direct"\n' /* Mandatory for our Miew! Must not be changed */
    + `\t\t\tNormals: ${correctArrayNotation(normalArray)}\n`
    + '\t\t}\n');
}


/* Default materials layer */
const defaultMaterialLayer = '\t\tLayerElementMaterial: 0 {\n'
  + '\t\t\tVersion: 101\n'
  + '\t\t\tName: ""\n'
  + '\t\t\tMappingInformationType: "AllSame"\n'
  + '\t\t\tReferenceInformationType: "Direct"\n'
  + '\t\t\tMaterials: 0\n'
  + '\t\t}\n';

/* Default layers block */
const defaultLayerBlock = '\t\tLayer: 0 {\n'
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

/**
 * Adding vertices and indices to resulting string
 * @return {string} resulting string in FBX notation
 */
function addVerticesIndices(vertices, indices) {
  const multiLayer = 0;
  const multiTake = 1;
  const shading = 'Y';
  const culling = 'CullingOff';
  const geometryVersion = 124;
  /* About _correctArrayNotation: Float32Arrays will contains only Float32 numbers, which implies that it will be floating points with 17 numbers after point.
  * We cannot (and it's logically incorrect) save all this information, so we convert this Float32Array into Array-like object with numbers with only 6 numbers after point
  * Reminder - this is big memory loss (as we must save at one moment two arrays with similar information) */
  return (`\t\tMultiLayer: ${multiLayer}\n`
    + `\t\tMultiTake: ${multiTake}\n`
    + `\t\tShading: ${shading}\n`
    + `\t\tCulling: "${culling}"\n`
    + `\t\tVertices: ${correctArrayNotation(vertices)}\n\n`
    + `\t\tPolygonVertexIndex: ${indices}\n\n`
    + `\t\tGeometryVersion: ${geometryVersion}\n`);
}

/**
 * Forming default definitions block.
 * @returns {String} default definitions block
 */
function defaultDefinitions() {
  const Version = 100; /* Mystery 100, but appears that it's not checked properly */
  const count = 3; /* Biggest mystery here. Every 6.1. file has this field = 3. Why?  I think that here must be
    some sort of 'let count = calculateCount()' or something, cos i _think_ that it's object, geometry,material etc count */
  /* Then we must know how many and exactly what Object Types there are */
  /* Next variable (objectTypes) is left only because we might in some distant future automatically generate this section. */
  // const objectTypes = []; /* Somewhat like 'let objectTypes = getObjectTypes()' or something. What about count of that objects? */
  /* Seems like this numbers didn't affect anything, so this section left because everything working with it looking that way */
  return 'Definitions:  {\n'
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
}

/**
 * Forming material properties block.
 * @param {Object} material - given material of model
 * @returns {String} material properties string
 */
function materialProperties(material) {
  return '\t\tProperties60:  {\n'
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
}

/**
 * Needed procedure for array copying
 * @param {Array} destArray - array to where will be copied
 * @param {Number} fromPositionInDestArray - position in destination array from where will be copied
 * @param {Array} sourceArray - array from where will be copied
 * @param {Number} fromPositionInSourceArray - position in source array from where will be copied
 * @param {Number} numberOfElements - number of elements to copy
 * @returns {Number} number of copied elements
 */
function copyArrays(destArray, fromPositionInDestArray, sourceArray, fromPositionInSourceArray, numberOfElements, offset = 0) {
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
function decideSeparation(mesh, instanceIndex) {
  const {
    geometry: {
      attributes: {
        color,
        color2,
        alphaColor,
      },
    },
  } = mesh;
  /* No CLONE DEEP for performance reasons. We do not change that colors what so ever so we dont need deep copies */
  const meshColor1 = color.array;
  const meshColor2 = color2.array;
  const meshAlphaColor = alphaColor.array;
  const idxColors = instanceIndex * 3;
  const lAlphas = [meshAlphaColor[instanceIndex]];
  const objectColor1 = reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]], lAlphas);
  const objectColor2 = reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]], lAlphas);
  return !utils.isEqual(objectColor1, objectColor2);
}

/**
 * Get color array in FBX notation for given cylinder.
 * @param {Object} mesh - given mesh
 * @param {Number} instanceIndex - exact cylinder in given mesh
 * @param {FBXCylinderGeometryModel} model - given model (either closed or opened cylinder)
 * @returns {Float32Array} cylinder colors array (for every vertex)
 */
function getColors(mesh, instanceIndex, model) {
  const {
    geometry: {
      attributes: {
        color,
        color2,
        alphaColor,
        position,
      },
    },
  } = mesh;
  /* No CLONE DEEP for performance reasons. We do not change that colors what so ever so we dont need deep copies */
  const meshColor1 = color.array;
  const meshColor2 = color2.array;
  const meshAlphaColor = alphaColor.array;
  const lAlphas = [meshAlphaColor[instanceIndex]];
  const idxColors = instanceIndex * 3;
  const numVertices = position.count; /* That's the original number of vertices */
  let numVerticesBeforeDividingLine = 0;
  let numVerticesAfterDividingLine = 0;
  if (model.closedCylinder) {
    numVerticesBeforeDividingLine = 2 * (numVertices - 2) / 5;
    numVerticesAfterDividingLine = (numVertices - 2) / 5;
  } else {
    numVerticesBeforeDividingLine = 2 * (numVertices) / 3;
    numVerticesAfterDividingLine = (numVertices) / 3;
  }
  /* Collect colors for each half of cylinder */
  const objectColor1 = reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]], lAlphas);
  const objectColor2 = reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]], lAlphas);
  const lColors1 = cloneColors(numVerticesBeforeDividingLine, objectColor1);
  let lColors2 = null;
  /* Clone colors for one cylinder ( 2 * numVertices / 3) and for another (same number) */
  if (!utils.isEqual(objectColor1, objectColor2)) {
    lColors2 = cloneColors(numVerticesBeforeDividingLine, objectColor2);
  } else {
    lColors2 = cloneColors(numVerticesAfterDividingLine, objectColor2);
  }
  /* Need to carefully process hats */
  if (model.closedCylinder) {
    const additionalColors1 = cloneColors((numVertices - 2) / 5 + 1, objectColor1);
    const additionalColors2 = cloneColors((numVertices - 2) / 5 + 1, objectColor2);
    const additionalLColors = utils.TypedArrayConcat(additionalColors1, additionalColors2);
    const tubeColors = utils.TypedArrayConcat(lColors2, lColors1);
    return utils.TypedArrayConcat(tubeColors, additionalLColors);
  }
  return utils.TypedArrayConcat(lColors2, lColors1);
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
function getReworkedParameters(mesh, instanceIndex, reworkedModel, lVertices, lIndices, lNormals, needToDivideCylinders) {
  const [reworkedIndices, reworkedNormals, reworkedVertices] = reworkedModel.getArrays();
  const reworkedColors = getColors(mesh, instanceIndex, reworkedModel);
  reworkedModel.storeColors(reworkedColors);
  let indexVerticesNormalsArray = 0; /* not using push */
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
  /* Step 1 : first third of vertices and  normals are copied directly */
  /* we can use numVertices here, but logically speaking lVertices.length / 3 is much clearer */
  copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 0, thirdOfTubeCylinderVertices);
  indexVerticesNormalsArray += copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 0, thirdOfTubeCylinderVertices);
  /* Also copying half of indices because other half may have offset if cylinders will be expanded */
  indexIndicesArray += copyArrays(reworkedIndices, indexIndicesArray, lIndices, 0, indicesBeforeDividingLine);
  /* Step 2 : adding new vertices and normals and also copying old
  * We can either full-copy middle vertices or copy them with some shift.
  * Here is first way - full copying without any shifts */
  const additionalVertices = [];
  const additionalNormals = [];
  copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  indexVerticesNormalsArray += copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  copyArrays(additionalVertices, indexAdditionalVertices, lVertices, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  indexAdditionalVertices += copyArrays(additionalNormals, indexAdditionalVertices, lNormals, thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  /* If we need to divide cylinders => we're adding additional vertices */
  if (needToDivideCylinders) {
    reworkedVertices.set(additionalVertices, indexVerticesNormalsArray);
    reworkedNormals.set(additionalNormals, indexVerticesNormalsArray);
    indexVerticesNormalsArray += indexAdditionalVertices;
  }
  /* Last third of vertices */
  copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 2 * thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  indexVerticesNormalsArray += copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 2 * thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  /* If we have closed cylinder => we must add last vertices */
  if (reworkedModel.closedCylinder) {
    copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 3 * thirdOfTubeCylinderVertices, hatVertices);
    copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 3 * thirdOfTubeCylinderVertices, hatVertices);
  }
  /* Adding last portion of indices simply as first half of indices but with 2 * number of vertices / 3 addition if needed */
  let offsetIndices = thirdOfTubeCylinderVertices / 3;
  if (needToDivideCylinders) {
    offsetIndices = 2 * thirdOfTubeCylinderVertices / 3;
  }
  indexIndicesArray += copyArrays(reworkedIndices, indexIndicesArray, lIndices, 0, indicesBeforeDividingLine, offsetIndices);
  /* if we have closed cylinder => must add last indices with offset */
  if (reworkedModel.closedCylinder) {
    let closedCylinderOffset = 0;
    if (needToDivideCylinders) {
      closedCylinderOffset = thirdOfTubeCylinderVertices / 3;
    }
    copyArrays(reworkedIndices, indexIndicesArray, lIndices, 2 * indicesBeforeDividingLine, lIndices.length - 2 * indicesBeforeDividingLine, closedCylinderOffset);
  }
}

/**
 * Calculating max index in index array of given model. Behaviour is different for closed and open cylinders
 * @param {FBXCylinderGeometryModel} model - given model
 * @returns {number} max index in index array
 */
function getMaxIndexInModel(model) {
  const maxIndex = Math.max(...model.getArrays()[0]); /* VERY UNSAFE! */
  if (model.closedCylinder) {
    return maxIndex + 1; /* VERY UNSAFE! */
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
function finalizeCylinderParameters(mesh, maxIndexInModels, resultingModel) {
  const resVertices = resultingModel.getArrays()[2];
  const resNormals = resultingModel.getArrays()[1];
  const resColors = resultingModel.getArrays()[3];
  let resIndices = resultingModel.getArrays()[0];
  resIndices = resIndices.subarray(0, resultingModel.curResIndicesIndex);
  /* Traverse all cells in array and add max index. For cells with negative numbers we must subtract maxIndex */
  if (maxIndexInModels !== 0) {
    for (let k = 0; k < resIndices.length; ++k) {
      if (resIndices[k] >= 0) {
        resIndices[k] += (maxIndexInModels + 1);
      } else {
        resIndices[k] -= (maxIndexInModels + 1);
      }
    }
  }
  return [resVertices.subarray(0, resultingModel.curResVerticesIndex), resIndices, resColors.subarray(0, resultingModel.curResColorsIndex), resNormals.subarray(0, resultingModel.curResNormalsIndex)];
}

export default {
  reworkColors,
  reworkIndices,
  collectMaterialInfo,
  defaultProperties,
  calculateCylinderTransform,
  collectInstancedColors,
  colorLayer,
  normalLayer,
  defaultMaterialLayer,
  defaultLayerBlock,
  addVerticesIndices,
  decideSeparation,
  defaultDefinitions,
  materialProperties,
  getReworkedParameters,
  finalizeCylinderParameters,
  getMaxIndexInModel,
  /* Exports for testing */
  cloneColors,
  correctArrayNotation,
};
