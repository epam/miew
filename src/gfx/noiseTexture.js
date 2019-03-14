import * as THREE from 'three';

const noiseWidth = 4;
const noiseHeight = 4;
const _noiseData = new Uint8Array([
  24, 52, 0, 254, 145, 0, 122, 0, 0, 7, 170, 0,
  34, 214, 0, 173, 8, 0, 86, 249, 0, 160, 4, 0,
  226, 46, 0, 224, 211, 0, 3, 157, 0, 174, 247, 0,
  12, 182, 0, 220, 216, 0, 1, 109, 0, 253, 154, 0,
]);
const _noiseWrapS = THREE.RepeatWrapping;
const _noiseWrapT = THREE.RepeatWrapping;
const _noiseMinFilter = THREE.NearestFilter;
const _noiseMagFilter = THREE.NearestFilter;
const _noiseMapping = THREE.UVMapping;
const noiseTexture = new THREE.DataTexture(
  _noiseData, noiseWidth, noiseHeight, THREE.RGBFormat,
  THREE.UnsignedByteType, _noiseMapping, _noiseWrapS, _noiseWrapT, _noiseMagFilter, _noiseMinFilter, 1,
);
noiseTexture.needsUpdate = true;

export default {
  noiseWidth,
  noiseHeight,
  noiseTexture,
};
