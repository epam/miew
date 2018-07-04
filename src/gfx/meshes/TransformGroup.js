

import * as THREE from 'three';
function TransformGroup(geometry, geoParams, material, transforms) {
  THREE.Object3D.call(this);
  this._geometry = geometry;
  this._geoParams = geoParams;
  const mat = material.createInstance();
  geoParams.initMaterial(mat);
  this._material = mat;
  this._transforms = transforms.length > 0 ? transforms : [new THREE.Matrix4()];
  const meshes = this._createMeshes(geometry);
  for (let i = 0, n = meshes.length; i < n; ++i) {
    this.add(meshes[i]);
  }
}

TransformGroup.prototype = Object.create(THREE.Object3D.prototype);
TransformGroup.prototype.constructor = TransformGroup;

TransformGroup.prototype.raycast = (function() {
  const inverseMatrix = new THREE.Matrix4();
  const ray = new THREE.Ray();

  return function(raycaster, intersects) {
    const children   = this.children;
    ray.copy(raycaster.ray);
    for (let i = 0, n = children.length; i < n; ++i) {
      const child = children[i];
      child.updateMatrixWorld();
      const mtx = child.matrixWorld;
      // TODO check near / far?
      inverseMatrix.getInverse(mtx);
      raycaster.ray.copy(ray).applyMatrix4(inverseMatrix);
      const childIntersects = [];
      this._geometry.raycast(raycaster, childIntersects);

      for (let j = 0, ciCount = childIntersects.length; j < ciCount; ++j) {
        const inters = childIntersects[j];
        if (inters.point) {
          inters.point.applyMatrix4(mtx);
          inters.distance = ray.origin.distanceTo(inters.point);
        }
        inters.object = child;
        // TODO: check raycaster near/far?
        intersects[intersects.length] = inters;
      }
    }
    raycaster.ray.copy(ray);
  };
})();

TransformGroup.prototype.getSubset = function(chunkIndices) {
  const geos = this._geometry.getSubset(chunkIndices);
  const subset = [];
  let subIdx = 0;

  for (let i = 0, n = geos.length; i < n; ++i) {
    const meshes = this._createMeshes(geos[i]);
    for (let j = 0, meshCnt = meshes.length; j < meshCnt; ++j) {
      subset[subIdx++] = meshes[j];
    }
  }

  return subset;
};

TransformGroup.prototype._createMeshes = function(geometry) {
  const transforms = this._transforms;
  const Mesh = this._geoParams.Object;
  const material = this._material;
  const meshes = [];
  for (let i = 0, n = transforms.length; i < n; ++i) {
    const mesh = new Mesh(geometry, material);
    mesh.applyMatrix(transforms[i]);

    meshes[i] = mesh;
  }

  return meshes;
};

export default TransformGroup;

