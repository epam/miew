import utils from './utils';
import VolumeMesh from './gfx/VolumeMesh';
import Visual from './Visual';
import VolumeMaterial from './gfx/shaders/VolumeMaterial';
import * as THREE from 'three';
import gfxutils from './gfx/gfxutils';
import meshes from './gfx/meshes/meshes';

function VolumeVisual(name, dataSource) {
  Visual.call(this, name, dataSource);

  this._mesh = new VolumeMesh();
  this._mesh.setDataSource(dataSource);
  this.add(this._mesh);

  this.buildFarPlane();
}

utils.deriveClass(VolumeVisual, Visual);

// Thes geometric far plane is required for correct filling in the BFTexture in case, when far plane cuts the volume
// cube. In cut place of cube there is no correct data in BFTexture and volume rendering integral is calculated
// with errors.
// Far plane cuts the cube in case of large volume scale (zoom), because farplane doesn't change
VolumeVisual.prototype.buildFarPlane = function() {
  // create plane with unit corners coords (for future rescale in vshader according to camera properties)
  const planeGeo = new THREE.PlaneGeometry(2, 2, 1, 1); // FIXME create custom plane geometry (without normals and uvs)
  const mat = VolumeMaterial.BackFacePosMaterialFarPlane();
  this._plane = new meshes.Mesh(planeGeo, mat);
  this._plane.frustumCulled = false;
  this._plane.doubleSided = true;
  const matWorldToVolume = new THREE.Matrix4();

  this._plane._onBeforeRender = function(_renderer, _scene, camera) {
    const volume = this.parent.getObjectByName('VolumeMesh');
    const material = this.material;
    if (!volume  || !material) {
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
    const volumeMatrix = this.parent.getObjectByName('VolumeMesh').matrixWorld;
    matWorldToVolume.getInverse(volumeMatrix);

    // update material props
    material.uniforms.aspectRatio.value = camera.aspect;
    material.uniforms.farZ.value = camera.far;
    material.uniforms.tanHalfFOV.value = Math.tan(THREE.Math.DEG2RAD * 0.5 * camera.fov);
    material.uniforms.matWorld2Volume.value = matWorldToVolume;
  };
  this.add(this._plane);

  // set it to special layer to draw only into BFTexture
  this._plane.layers.set(gfxutils.LAYERS.VOLUME_BFPLANE);
};

VolumeVisual.prototype.getBoundaries = function() {
  var box = this._dataSource.getBox();

  return {
    boundingBox: box,
    boundingSphere: box.getBoundingSphere()
  };
};

VolumeVisual.prototype.getMesh = function() {
  return this._mesh;
};

export default VolumeVisual;

