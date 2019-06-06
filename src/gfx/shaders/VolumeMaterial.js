/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import volumeFrag from './Volume_frag.glsl';
import farPlaneVert from './VolumeFarPlane_vert.glsl';
import settings from '../../settings';

const volumeUniforms = THREE.UniformsUtils.merge([
  {
    volumeDim: { type: 'v3', value: new THREE.Vector3(512, 512, 512) },
    tileTex: { type: 't', value: null },
    tileTexSize: { type: 'v2', value: new THREE.Vector2(512, 512) },
    tileStride: { type: 'v2', value: new THREE.Vector2(512, 512) },

    boxAngles: { type: 'v3', value: new THREE.Vector3(1, 1, 1) },
    delta: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },

    _isoLevel0: { type: 'v2', value: new THREE.Vector3(0.5, 0.75, 1.0) },
    _flipV: { type: 'f', value: 0.0 },
    _BFLeft: { type: 't', value: null },
    _BFRight: { type: 't', value: null },
    _FFLeft: { type: 't', value: null },
    _FFRight: { type: 't', value: null },
    _WFFLeft: { type: 't', value: null },
    _WFFRight: { type: 't', value: null },
  },
]);

function overrideUniforms(params, defUniforms) {
  const uniforms = THREE.UniformsUtils.clone(defUniforms);
  for (const p in params) {
    if (uniforms.hasOwnProperty(p)) {
      uniforms[p].value = params[p];
    }
  }
  return uniforms;
}

function facesPosMaterialParams(params, sideType) {
  return {
    uniforms: overrideUniforms(params, {}),
    vertexShader: `\
varying vec3 pos;
void main() {
  // we're assuming local position is in [-0.5, 0.5]
  // we need to offset it to be represented in RGB
  pos = position.xyz + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `\
varying vec3 pos;
void main() {
  gl_FragColor = vec4(pos, 0.5);
}`,
    transparent: false,
    depthTest: false,
    depthWrite: false,
    side: sideType,
  };
}

class BackFacePosMaterial extends THREE.ShaderMaterial {
  constructor(params) {
    const backFaceParams = facesPosMaterialParams(params, THREE.BackSide);
    super(backFaceParams);
  }
}

class BackFacePosMaterialFarPlane extends THREE.ShaderMaterial {
  constructor(params) {
    const matUniforms = THREE.UniformsUtils.merge([
      {
        aspectRatio: { type: 'f', value: 0.0 },
        farZ: { type: 'f', value: 0.0 },
        tanHalfFOV: { type: 'f', value: 0.0 },
        matWorld2Volume: { type: '4fv', value: new THREE.Matrix4() },
      },
    ]);

    const shaderParams = {
      uniforms: overrideUniforms(params, matUniforms),
      vertexShader: farPlaneVert,
      fragmentShader: `\
varying vec4 volPos;
void main() {
  gl_FragColor = volPos;
}`,
      transparent: false,
      depthTest: false,
      depthWrite: false,
      side: THREE.FrontSide,
    };
    super(shaderParams);
  }
}

class FrontFacePosMaterial extends THREE.ShaderMaterial {
  constructor(params) {
    const frontFaceParams = facesPosMaterialParams(params, THREE.FrontSide);
    super(frontFaceParams);
  }
}

class VolumeMaterial extends THREE.ShaderMaterial {
  constructor(params) {
    const shaderParams = {
      uniforms: overrideUniforms(params, volumeUniforms),
      vertexShader: `\
varying vec4 screenSpacePos;
void main() {
  screenSpacePos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = screenSpacePos;
}`,
      fragmentShader: volumeFrag,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.FrontSide,
    };

    super(shaderParams);
    this.updateDefines();
  }

  updateDefines() {
    this.defines = {
      ISO_MODE: settings.now.modes.VD.isoMode,
    };
    this.needsUpdate = true;
  }
}

export default {
  BackFacePosMaterial,
  BackFacePosMaterialFarPlane,
  FrontFacePosMaterial,
  VolumeMaterial,
};
