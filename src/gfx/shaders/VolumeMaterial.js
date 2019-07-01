/* eslint-disable no-magic-numbers */
/* eslint-disable guard-for-in */
import * as THREE from 'three';
import vertexVolumeFaces from './VolumeFaces.vert';
import fragmentVolumeFaces from './VolumeFaces.frag';
import vertexVolume from './Volume.vert';
import fragmentVolume from './Volume.frag';
import vertexFarPlane from './VolumeFarPlane.vert';
import fragmentFarPlane from './VolumeFarPlane.frag';
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
    vertexShader: vertexVolumeFaces,
    fragmentShader: fragmentVolumeFaces,
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

class ShaderParams {
  constructor(params, uniforms, vertexShader, fragmentShader) {
    this.uniforms = overrideUniforms(params, uniforms);
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.transparent = false;
    this.depthTest = false;
    this.depthWrite = false;
    this.side = THREE.FrontSide;
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

    const shaderParams = new ShaderParams(params, matUniforms, vertexFarPlane, fragmentFarPlane);
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
    const shaderParams = new ShaderParams(params, volumeUniforms, vertexVolume, fragmentVolume);
    shaderParams.transparent = true;
    shaderParams.depthTest = true;

    super(shaderParams);
    this.updateDefines();
  }

  updateDefines() {
    this.defines = {
      ISO_MODE: settings.now.modes.VD.isoMode,
      STEPS_COUNT: settings.now.modes.VD.polyComplexity[settings.now.resolution] * 100,
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
