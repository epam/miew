import * as THREE from 'three';
import VolumeMaterial from './shaders/VolumeMaterial';
import meshes from './meshes/meshes';
import gfxutils from './gfxutils';

// Thes geometric far plane is required for correct filling in the BFTexture in case, when far plane cuts the volume
// cube. In cut place of cube there is no correct data in BFTexture and volume rendering integral is calculated
// with errors.
// Far plane cuts the cube in case of large volume scale (zoom), because farplane doesn't change
class VolumeFarPlane {
  // create plane with unit corners coords (for future rescale in vshader according to camera properties)
  constructor(volume, width, height) {
    const planeGeo = this._initPlaneGeo(width, height);

    const mat = new VolumeMaterial.BackFacePosMaterialFarPlane();
    this._plane = new meshes.Mesh(planeGeo, mat);
    this._plane.frustumCulled = false;
    this._plane.doubleSided = true;
    const matWorldToVolume = new THREE.Matrix4();

    this._plane._onBeforeRender = function (_renderer, _scene, camera, _geometry, _material, _group) {
      const { material } = this;
      if (!volume || !material) {
        return;
      }

      // count point in world at farplane place
      const planeCamPos = new THREE.Vector4(0, 0, -(camera.far - 0.1), 1);
      planeCamPos.applyMatrix4(camera.matrixWorld);

      // recalc matrices to make plane be placed as farplane in the World relative to camera
      this.matrix.identity();
      this.matrix.makeTranslation(planeCamPos.x, planeCamPos.y, planeCamPos.z);
      this.matrixWorld.copy(this.matrix);
      this.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);
      this.normalMatrix.getNormalMatrix(this.modelViewMatrix);

      // build worldToVolume matrix to transform plane into volumeCS (volumeCS coords are written to BackFaceTexture)
      const volumeMatrix = volume.matrixWorld;
      matWorldToVolume.copy(volumeMatrix).invert();

      // update material props
      material.uniforms.aspectRatio.value = camera.aspect;
      material.uniforms.farZ.value = camera.far;
      material.uniforms.tanHalfFOV.value = Math.tan(THREE.MathUtils.DEG2RAD * 0.5 * camera.fov);
      material.uniforms.matWorld2Volume.value = matWorldToVolume;
    };

    // set it to special layer to draw only into BFTexture
    this._plane.layers.set(gfxutils.LAYERS.VOLUME_BFPLANE);
  }

  _initPlaneGeo(width, height) {
    const planeGeo = new THREE.BufferGeometry();

    width = width || 1;
    height = height || 1;

    const vertices = new Float32Array([
      -0.5 * width, 0.5 * height, 0,
      0.5 * width, 0.5 * height, 0,
      -0.5 * width, -0.5 * height, 0,
      0.5 * width, -0.5 * height, 0,
    ]);

    planeGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    planeGeo.setIndex([0, 2, 1, 2, 3, 1]);

    return planeGeo;
  }

  getMesh() {
    return this._plane;
  }
}

export default VolumeFarPlane;
