import _ from 'lodash';
import * as THREE from 'three';
import utils from '../../utils';

const NUM_COORDS_PER_VERTEX = 3;
const NUM_COLORS_PER_VERTEX = 4;
/**
 *
 * @param matrix
 * @param vertices
 * @param normals
 * @returns {[*, *]}
 */
function applyMatrixToVerticesNormals(matrix, vertices, normals) {
  const normVec = new THREE.Vector4();
  const vertVec = new THREE.Vector4();
  // Applying offsets / transformation to every vertex//
  for (let j = 0; j < vertices.length; j += 3) {
    vertVec.set(vertices[j], vertices[j + 1], vertices[j + 2], 1);
    vertVec.applyMatrix4(matrix);
    normVec.set(normals[j], normals[j + 1], normals[j + 2], 0.0);
    normVec.applyMatrix4(matrix);

    vertices[j] = vertVec.x;
    vertices[j + 1] = vertVec.y;
    vertices[j + 2] = vertVec.z;
    normals[j] = normVec.x;
    normals[j + 1] = normVec.y;
    normals[j + 2] = normVec.z;
  }
  return [vertices, normals];
}

/**
 * Reworking indices buffer, see https://banexdevblog.wordpress.com/2014/06/23/a-quick-tutorial-about-the-fbx-ascii-format/
 * basically, every triangle in Miew has been represented hat way (e.g.) : 0,1,7, but we must (for FBX) rework that into: 0,1,-8.
 * @param{Int32Array} array - indices buffer
 * @returns{Int32Array} reworked array.
 */
function reworkIndices(array) {
  const clonedArray = new Int32Array(array.length); // In some future we might want to rework this to bigint64, but currently it haven't been supported in many browsers
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
 * @returns{Float32Array} reworked array.
 */
function reworkColors(colorArray) {
  const clonedArray = new Float32Array(colorArray.length + colorArray.length / 3);
  let clonedArrIdx = 0;
  for (let i = 0; i < colorArray.length; i += 3) {
    clonedArray.set([colorArray[i]], clonedArrIdx); // R
    clonedArray.set([colorArray[i + 1]], clonedArrIdx + 1); // G
    clonedArray.set([colorArray[i + 2]], clonedArrIdx + 2); // B
    clonedArray.set([1], clonedArrIdx + 3); // A
    clonedArrIdx += 4;
  }
  return clonedArray;
}


/**
 * Clone colors from one to number of vertices
 * @returns {Float32Array} array with cloned colors
 */
function cloneColors(numVertices, color) {
  const clonedArray = new Float32Array(numVertices * 4); // RGBA for every vertex
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
    reworkedArray[i] = parseFloat(array[i].toFixed(6)); // Default, i guess?
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

// Default model properties
const defaultProperties = `    Properties60: {
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
      }
  `;

/**
 * Calculate parameters for one cylinder in given mesh.
 * @param {object} mesh - mesh with instanced objects
 * @param {Number} instanceIndex - number of instance in mesh
 * @returns {*[]} array of gathered transformations of vertices and normals
 */
function calculateCylinderTransform(mesh, instanceIndex) {
  // Misc variables
  const {
    geometry: {
      attributes,
    },
  } = mesh;
  const matVector1 = attributes.matVector1.array;
  const matVector2 = attributes.matVector2.array;
  const matVector3 = attributes.matVector3.array;
  // Grab original vertices and normals
  const lVertices = _.cloneDeep(attributes.position.array);
  const lNormals = _.cloneDeep(attributes.normal.array);
  // We have vertices for not transformed cylinder. Need to make it transformed
  const transformCylinder = new THREE.Matrix4();
  const idxOffset = instanceIndex * 4;
  transformCylinder.set(matVector1[idxOffset], matVector2[idxOffset], matVector3[idxOffset], 0,
    matVector1[idxOffset + 1], matVector2[idxOffset + 1], matVector3[idxOffset + 1], 0,
    matVector1[idxOffset + 2], matVector2[idxOffset + 2], matVector3[idxOffset + 2], 0,
    matVector1[idxOffset + 3], matVector2[idxOffset + 3], matVector3[idxOffset + 3], 1);
  // For a reason we must perform transpose of that matrix
  transformCylinder.transpose();
  return applyMatrixToVerticesNormals(transformCylinder, lVertices, lNormals);
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
        position,
      },
    },
  } = mesh;
  const idxColors = (instanceIndex * 3); // that's not magic. For 1st instance we must start from 0, for 2nd - from 3, etc
  const meshColor = color.array;
  const objectColor = reworkColors([meshColor[idxColors], meshColor[idxColors + 1], meshColor[idxColors + 2]]);
  // For FBX we need to clone color for every vertex
  const lColors = cloneColors(position.array.length / 3, objectColor);
  return lColors;
}

/**
 * Adding color layer to resulting file
 * @returns {string} color layer info
 */
function colorLayer(colorArray) {
  const layerElementColorNumber = 0; // Currently unknown what that is
  const layerElementColorVersion = 101; // Currently unknown what version means
  const layerElementColorName = ''; // Currently unknown what name means
  // Mapping Information type and Reference Information type are mandatory for our Miew! Must not be changed
  // As said [..Array(...)] - fastest and easiest way to produce [0, 1, .....] array
  return (`    LayerElementColor: ${layerElementColorNumber} {
          Version: ${layerElementColorVersion}
          Name: "${layerElementColorName}"
          MappingInformationType: "ByVertice"
          ReferenceInformationType: "Direct"
          Colors: ${correctArrayNotation(colorArray)}
          ColorIndex: ${[...Array(colorArray.length / 4).keys()]}
        }
    `);
}

/**
 * Adding normal layer to resulting file
 * @returns {string} normal layer info
 */
function normalLayer(normalArray) {
  const layerElementNormalNumber = 0; // Currently unknown what that is
  const layerElementNormalVersion = 101; // Currently unknown what version means
  const layerElementNormalName = ''; // Currently unknown what name means
  // Mapping Information type and Reference Information type are mandatory for our Miew! Must not be changed
  return (`    LayerElementNormal: ${layerElementNormalNumber} {
          Version: ${layerElementNormalVersion}
          Name: "${layerElementNormalName}"
          MappingInformationType: "ByVertice"
          ReferenceInformationType: "Direct" 
          Normals: ${correctArrayNotation(normalArray)}
        }
    `);
}

// Default materials layer
const defaultMaterialLayer = `    LayerElementMaterial: 0 {
          Version: 101
          Name: ""
          MappingInformationType: "AllSame"
          ReferenceInformationType: "Direct"
          Materials: 0
        }
  `;

// Default layers block
const defaultLayerBlock = `    Layer: 0 {
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
      }
    }
  `;

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
  return (`    MultiLayer: ${multiLayer}
        MultiTake: ${multiTake}
        Shading: ${shading}
        Culling: "${culling}"
        Vertices: ${correctArrayNotation(vertices)}
        PolygonVertexIndex: ${indices}
        GeometryVersion: ${geometryVersion}
    `);
}

/**
 * Forming default definitions block.
 * @returns {String} default definitions block
 */
function defaultDefinitions() {
  const Version = 100; // Mystery 100, but appears that it's not checked properly */
  const count = 3; /* Biggest mystery here. Every 6.1. file has this field = 3. Why?  I think that here must be
    some sort of 'let count = calculateCount()' or something, cos i _think_ that it's object, geometry,material etc count */
  /* Then we must know how many and exactly what Object Types there are */
  /* Next variable (objectTypes) is left only because we might in some distant future automatically generate this section. */
  // const objectTypes = []; /* Somewhat like 'let objectTypes = getObjectTypes()' or something. What about count of that objects? */
  /* Seems like this numbers didn't affect anything, so this section left because everything working with it looking that way */
  return `Definitions:  {
      Version: ${Version}
      Count: ${count}
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
}
    
`;
}

/**
 * Forming material properties block.
 * @param {Object} material - given material of model
 * @returns {String} material properties string
 */
function materialProperties(material) {
  return `    Properties60:  {
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
         }
       }
     `;
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
      },
    },
  } = mesh;
  // No CLONE DEEP for performance reasons. We do not change that colors what so ever so we dont need deep copies
  const meshColor1 = color.array;
  const meshColor2 = color2.array;
  const idxColors = instanceIndex * 3;
  const objectColor1 = reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]]);
  const objectColor2 = reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]]);
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
        position,
      },
    },
  } = mesh;
  // No CLONE DEEP for performance reasons. We do not change that colors what so ever so we dont need deep copies
  const meshColor1 = color.array;
  const meshColor2 = color2.array;
  const idxColors = instanceIndex * 3;
  const numVertices = position.count; // That's the original number of vertices
  let numVerticesBeforeDividingLine = 0;
  let numVerticesAfterDividingLine = 0;
  if (model.closedCylinder) {
    numVerticesBeforeDividingLine = 2 * (numVertices - 2) / 5;
    numVerticesAfterDividingLine = (numVertices - 2) / 5;
  } else {
    numVerticesBeforeDividingLine = 2 * (numVertices) / 3;
    numVerticesAfterDividingLine = (numVertices) / 3;
  }
  // Collect colors for each half of cylinder
  const objectColor1 = reworkColors([meshColor1[idxColors], meshColor1[idxColors + 1], meshColor1[idxColors + 2]]);
  const objectColor2 = reworkColors([meshColor2[idxColors], meshColor2[idxColors + 1], meshColor2[idxColors + 2]]);
  const lColors1 = cloneColors(numVerticesBeforeDividingLine, objectColor1);
  let lColors2 = null;
  // Clone colors for one cylinder and for another
  if (!utils.isEqual(objectColor1, objectColor2)) {
    lColors2 = cloneColors(numVerticesBeforeDividingLine, objectColor2);
  } else {
    lColors2 = cloneColors(numVerticesAfterDividingLine, objectColor2);
  }
  // Need to carefully process hats
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
  let indexVerticesNormalsArray = 0; // not using push//
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
  // Step 1 : first chunk of vertices and  normals are copied directly
  copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 0, thirdOfTubeCylinderVertices);
  indexVerticesNormalsArray += copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 0, thirdOfTubeCylinderVertices);
  // Also copying half of tube indices because other half may have offset if cylinders will be expanded
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
  // If we need to divide cylinders => we're adding additional vertices
  if (needToDivideCylinders) {
    reworkedVertices.set(additionalVertices, indexVerticesNormalsArray);
    reworkedNormals.set(additionalNormals, indexVerticesNormalsArray);
    indexVerticesNormalsArray += indexAdditionalVertices;
  }
  // Last chunk of vertices
  copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 2 * thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  indexVerticesNormalsArray += copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 2 * thirdOfTubeCylinderVertices, thirdOfTubeCylinderVertices);
  // If we have closed cylinder => we must add last vertices
  if (reworkedModel.closedCylinder) {
    copyArrays(reworkedVertices, indexVerticesNormalsArray, lVertices, 3 * thirdOfTubeCylinderVertices, hatVertices);
    copyArrays(reworkedNormals, indexVerticesNormalsArray, lNormals, 3 * thirdOfTubeCylinderVertices, hatVertices);
  }
  // Adding last portion of indices simply as first chunk of indices but with some special addition if needed
  let offsetIndices = thirdOfTubeCylinderVertices / 3;
  if (needToDivideCylinders) {
    offsetIndices = 2 * thirdOfTubeCylinderVertices / 3;
  }
  indexIndicesArray += copyArrays(reworkedIndices, indexIndicesArray, lIndices, 0, indicesBeforeDividingLine, offsetIndices);
  // if we have closed cylinder => must add last indices with offset
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
  const maxIndex = Math.max(...model.getArrays()[0]); // VERY UNSAFE!
  if (model.closedCylinder) {
    return maxIndex + 1;
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
  // Traverse all cells in array and add max index. For cells with negative numbers we must subtract maxIndex
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

/**
 *
 * @param oldModelArray
 * @param additionModelArray
 */
function createArraysForAddingModelToPool(oldModelArray, additionModelArray) {
  const array = new Float32Array(oldModelArray.length + additionModelArray.length);
  array.set(oldModelArray, 0);
  array.set(additionModelArray, oldModelArray.length);
  return array;
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
  applyMatrixToVerticesNormals,
  createArraysForAddingModelToPool,
  // Exports for testing
  cloneColors,
  correctArrayNotation,
};
