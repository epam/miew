

import * as THREE from 'three';
function TransformGroup(geometry, geoParams, material, transforms) {
  THREE.Object3D.call(this);
  this._geometry = geometry;
  this._geoParams = geoParams;
  var mat = material.createInstance();
  geoParams.initMaterial(mat);
  this._material = mat;
  this._transforms = transforms.length > 0 ? transforms : [new THREE.Matrix4()];
  var meshes = this._createMeshes(geometry);
  for (var i = 0, n = meshes.length; i < n; ++i) {
    this.add(meshes[i]);
  }
}

TransformGroup.prototype = Object.create(THREE.Object3D.prototype);
TransformGroup.prototype.constructor = TransformGroup;

TransformGroup.prototype.raycast = (function() {
  var inverseMatrix = new THREE.Matrix4();
  var ray = new THREE.Ray();

  return function(raycaster, intersects) {
    var children   = this.children;
    ray.copy(raycaster.ray);
    for (var i = 0, n = children.length; i < n; ++i) {
      var child = children[i];
      child.updateMatrixWorld();
      var mtx = child.matrixWorld;
      // TODO check near / far?
      inverseMatrix.getInverse(mtx);
      raycaster.ray.copy(ray).applyMatrix4(inverseMatrix);
      var childIntersects = [];
      this._geometry.raycast(raycaster, childIntersects);

      for (var j = 0, ciCount = childIntersects.length; j < ciCount; ++j) {
        var inters = childIntersects[j];
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
  var geos = this._geometry.getSubset(chunkIndices);
  var subset = [];
  var subIdx = 0;

  for (var i = 0, n = geos.length; i < n; ++i) {
    var meshes = this._createMeshes(geos[i]);
    for (var j = 0, meshCnt = meshes.length; j < meshCnt; ++j) {
      subset[subIdx++] = meshes[j];
    }
  }

  return subset;
};

TransformGroup.prototype._createMeshes = function(geometry) {
  var transforms = this._transforms;
  var Mesh = this._geoParams.Object;
  var material = this._material;
  material.forceUniformsUpdate = true;
  var meshes = [];
  for (var i = 0, n = transforms.length; i < n; ++i) {
    var mesh = new Mesh(geometry, material);
    mesh.applyMatrix(transforms[i]);

    meshes[i] = mesh;
  }

  return meshes;
};

export default TransformGroup;

