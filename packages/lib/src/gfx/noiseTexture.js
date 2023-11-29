import * as THREE from 'three';

const noiseWidth = 4;
const noiseHeight = 4;
const _noiseData = new Uint8Array([
  24, 52, 0, 255, 254, 145, 0, 255, 122, 0, 0, 255, 7, 170, 0, 255,
  34, 214, 0, 255, 173, 8, 0, 255, 86, 249, 0, 255, 160, 4, 0, 255,
  226, 46, 0, 255, 224, 211, 0, 255, 3, 157, 0, 255, 174, 247, 0, 255,
  12, 182, 0, 255, 220, 216, 0, 255, 1, 109, 0, 255, 253, 154, 0, 255,
]);
const _noiseWrapS = THREE.RepeatWrapping;
const _noiseWrapT = THREE.RepeatWrapping;
const _noiseMinFilter = THREE.NearestFilter;
const _noiseMagFilter = THREE.NearestFilter;
const _noiseMapping = THREE.UVMapping;
const noiseTexture = new THREE.DataTexture(
  _noiseData,
  noiseWidth,
  noiseHeight,
  THREE.RGBAFormat,
  THREE.UnsignedByteType,
  _noiseMapping,
  _noiseWrapS,
  _noiseWrapT,
  _noiseMagFilter,
  _noiseMinFilter,
  1,
);
noiseTexture.needsUpdate = true;

export default {
  noiseWidth,
  noiseHeight,
  noiseTexture,
};
