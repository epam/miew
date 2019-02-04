

/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import volumeFrag from './Volume_frag.glsl';

var volumeUniforms = THREE.UniformsUtils.merge([
  {
    volumeDim:   {type: 'v3', value: new THREE.Vector3(512, 512, 512)},
    tileTex:     {type: 't', value: null},
    tileTexSize: {type: 'v2', value: new THREE.Vector2(512, 512)},
    tileStride:  {type: 'v2', value: new THREE.Vector2(512, 512)},

    _isoLevel0:  {type: 'f', value: 0.28},
    _flipV:      {type: 'f', value: 0.0},
    _BFLeft:     {type: 't', value: null},
    _BFRight:    {type: 't', value: null},
    _FFLeft:     {type: 't', value: null},
    _FFRight:    {type: 't', value: null},
    _WFFLeft:    {type: 't', value: null},
    _WFFRight:   {type: 't', value: null},
  }
]);

function overrideUniforms(params, defUniforms) {
  var uniforms = THREE.UniformsUtils.clone(defUniforms);
  for (var p in params) {
    if (uniforms.hasOwnProperty(p)) {
      uniforms[p].value = params[p];
    }
  }
  return uniforms;
}

function BackFacePosMaterial(params) {
  var settings = {
    uniforms : overrideUniforms(params, {}),
    vertexShader: 'varying vec3 pos; ' +
      'void main() {' +
      // we're assuming local position is in [-0.5, 0.5]
      // we need to offset it to be represented in RGB
      'pos = position.xyz + 0.5;' +
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);' +
      '}',
    fragmentShader: 'varying vec3 pos; ' +
      'void main() { gl_FragColor = vec4(pos, 0.5); }',
    transparent: false,
    depthTest: false,
    depthWrite: false,
    side: THREE.BackSide
  };
  return new THREE.ShaderMaterial(settings);
}

function BackFacePosMaterialFarPlane(params) {
  const matUniforms = THREE.UniformsUtils.merge([
    {
      aspectRatio:     {type: 'f', value: 0.0},
      farZ:            {type: 'f', value: 0.0},
      tanHalfFOV:      {type: 'f', value: 0.0},
      matWorld2Volume: {type: '4fv', value: new THREE.Matrix4()}
    }
  ]);

  const settings = {
    uniforms : overrideUniforms(params, matUniforms),
    vertexShader: 'varying vec4 volPos;\n' +
      'uniform float aspectRatio;\n' +
      'uniform float farZ;\n' +
      'uniform float tanHalfFOV;\n' +
      'uniform mat4  matWorld2Volume\n;' +
      'void main() {\n' +
      // rescale plane to fill in the whole far plane area seen from camera
      'vec3 pos = position.xyz;\n' +
      'pos.x = pos.x * tanHalfFOV * farZ * aspectRatio;\n' +
      'pos.y = pos.y * tanHalfFOV * farZ;\n' +
      // common transformation
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n' +
      // calc pos in volume CS
      'volPos = matWorld2Volume * modelMatrix * vec4(pos, 1.0);\n' +
      // we're assuming local position is in [-0.5, 0.5]
      // we need to offset it to be represented in RGB
      'volPos = volPos + 0.5;\n' +
      'volPos.w = 0.5;' +
    '}',
    fragmentShader: 'varying vec4 volPos; \n' +
    'void main() { gl_FragColor = volPos; }',
    transparent: false,
    depthTest: false,
    depthWrite: false,
    side: THREE.FrontSide,
  };
  return new THREE.ShaderMaterial(settings);
}

function FrontFacePosMaterial(params) {
  var settings = {
    uniforms : overrideUniforms(params, {}),
    vertexShader: 'varying vec3 pos; ' +
      'void main() {' +
    // we're assuming local position is in [-0.5, 0.5]
    // we need to offset it to be represented in RGB
      'pos = position.xyz + 0.5;' +
      'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);' +
      '}',
    fragmentShader: 'varying vec3 pos; ' +
      'void main() { gl_FragColor = vec4(pos, 0.5); }',
    transparent: false,
    depthTest: false,
    depthWrite: false,
    side: THREE.FrontSide
  };
  return new THREE.ShaderMaterial(settings);
}

function VolumeMaterial(params) {
  var settings = {
    uniforms : overrideUniforms(params, volumeUniforms),
    vertexShader: 'varying vec4 screenSpacePos; ' +
      'void main() {' +
      'screenSpacePos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);' +
      'gl_Position = screenSpacePos;' +
      '}',
    fragmentShader: volumeFrag,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide
  };
  return new THREE.ShaderMaterial(settings);
}

export default {
  BackFacePosMaterial: BackFacePosMaterial,
  BackFacePosMaterialFarPlane: BackFacePosMaterialFarPlane,
  FrontFacePosMaterial: FrontFacePosMaterial,
  VolumeMaterial : VolumeMaterial,
};

