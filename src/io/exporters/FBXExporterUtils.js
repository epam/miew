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


export default {
  reworkColors,
  reworkIndices,
  cloneColors,
  correctArrayNotation,
  collectMaterialInfo,
  defaultProperties,
};
