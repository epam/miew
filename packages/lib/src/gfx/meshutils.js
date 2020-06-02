/**
 * Utils functions which is worked with meshes
 *
 * functions for doing something with all/specified meshes
 * functions for traversihg tree and create auxiliary meshes for transparency/shadowmaps...
 * functions for calculating data connected with meshes
 */
import * as THREE from 'three';
import UberMaterial from './shaders/UberMaterial';
import gfxutils from './gfxutils';

function _gatherObjects(root, meshTypes) {
  const meshes = [];
  root.traverse((object) => {
    for (let i = 0; i < meshTypes.length; i++) {
      if (object instanceof meshTypes[i]) {
        meshes[meshes.length] = object;
        break;
      }
    }
  });
  return meshes;
}

// new mesh with the same geometry and specified material values and layer
function createDerivativeMesh(mesh, values, layer) {
  const material = mesh.material.createInstance();
  material.setValues(values);

  const newMesh = new mesh.constructor(mesh.geometry, material);
  newMesh.material.needsUpdate = true;
  newMesh.applyMatrix4(mesh.matrix);
  newMesh.layers.set(layer);
  return newMesh;
}

function traverseMeshes(root, meshTypes, func) {
  const meshes = _gatherObjects(root, meshTypes);

  for (let i = 0, n = meshes.length; i < n; ++i) {
    const mesh = meshes[i];
    if (!mesh.parent) {
      continue;
    }
    func(mesh);
  }
}

function applyTransformsToMeshes(root, mtc) {
  const mtcCount = mtc.length;
  if (mtcCount < 1) {
    return;
  }

  const meshTypes = [THREE.Mesh, THREE.LineSegments, THREE.Line];
  traverseMeshes(root, meshTypes, (mesh) => {
    mesh.applyMatrix4(mtc[0]);
    for (let j = 1; j < mtcCount; ++j) {
      const newMesh = new mesh.constructor(mesh.geometry, mesh.material);
      mesh.parent.add(newMesh);
      newMesh.applyMatrix4(mtc[j]);
    }
  });
}

const processTransparentMaterial = (function () {
  const matValues = {
    prepassTransparancy: true,
    fakeOpacity: false,
    transparent: false,
    colorFromDepth: false,
    lights: false,
    shadowmap: false,
    fog: false,
  };

  return function (root, material) {
    if (!(material instanceof UberMaterial)) {
      return;
    }

    traverseMeshes(root, [THREE.Mesh, THREE.LineSegments], (mesh) => {
      mesh.material.setValues({ prepassTransparancy: false, fakeOpacity: false });
      mesh.material.needsUpdate = true;
      mesh.layers.set(gfxutils.LAYERS.TRANSPARENT);

      const prepassTranspMesh = createDerivativeMesh(mesh, matValues, gfxutils.LAYERS.PREPASS_TRANSPARENT);
      mesh.parent.add(prepassTranspMesh);
    });
  };
}());

const processColFromPosMaterial = (function () {
  const matValues = {
    colorFromPos: true,
    transparent: false,
    colorFromDepth: false,
    lights: false,
    shadowmap: false,
    fog: false,
    overrideColor: false,
    fogTransparent: false,
    attrColor: false,
    attrColor2: false,
    attrAlphaColor: false,
    fakeOpacity: false,
  };

  return function (root, material) {
    if (!(material instanceof UberMaterial)) {
      return;
    }

    traverseMeshes(root, [THREE.Mesh, THREE.LineSegments], (mesh) => {
      const colFromPosMesh = createDerivativeMesh(mesh, matValues, gfxutils.LAYERS.COLOR_FROM_POSITION);
      mesh.parent.add(colFromPosMesh);
    });
  };
}());

const createShadowmapMaterial = (function () {
  const matValues = {
    colorFromDepth: true,
    orthoCam: true,
    lights: false,
    shadowmap: false,
    fog: false,
  };

  return function (root, material) {
    if (!(material instanceof UberMaterial)) {
      return;
    }
    traverseMeshes(root, [THREE.Mesh, THREE.LineSegments], (mesh) => {
      if (!mesh.receiveShadow && mesh.material.shadowmap) { // remove shadow from non-receivers
        mesh.material.setValues({ shadowmap: false });
      }
      if (!mesh.material.lights) { // skip creating shadowmap meshes for materials without lighting
        return;
      }
      if (!mesh.castShadow) { // skip creating shadowmap meshes for non-casters
        return;
      }
      if (!gfxutils.belongToSelectLayers(mesh)) { // skip creating shadowmap meshes for selection layer
        return;
      }

      const shadowmapMesh = createDerivativeMesh(mesh, matValues, gfxutils.LAYERS.SHADOWMAP);
      shadowmapMesh.isShadowmapMesh = true;
      mesh.parent.add(shadowmapMesh);
    });
  };
}());

function removeShadowmapMaterial(root, material) {
  if (!(material instanceof UberMaterial)) {
    return;
  }

  traverseMeshes(root, [THREE.Mesh, THREE.LineSegments], (mesh) => {
    if (mesh.isShadowmapMesh) {
      mesh.parent.remove(mesh);
    }
  });
}

function forEachMeshInGroup(group, process) {
  function processObj(object) {
    if (object instanceof THREE.Mesh) {
      process(object);
    }
    for (let i = 0, l = object.children.length; i < l; i++) {
      processObj(object.children[i]);
    }
  }
  processObj(group);
}

function _countMeshTriangles(mesh) {
  const geom = mesh.geometry;
  if (geom instanceof THREE.InstancedBufferGeometry) {
    const attribs = geom.attributes;
    for (const property in attribs) {
      if (attribs.hasOwnProperty(property) && attribs[property] instanceof THREE.InstancedBufferAttribute) {
        const currAttr = attribs[property];
        const indexSize = geom.index ? geom.index.array.length / 3 : 0;
        return indexSize * currAttr.array.length / currAttr.itemSize;
      }
    }
    return 0;
  }
  if (geom instanceof THREE.BufferGeometry) {
    return geom.index ? geom.index.array.length / 3 : 0;
  }
  return geom.faces ? geom.faces.length : 0;
}

function countTriangles(group) {
  let totalCount = 0;
  forEachMeshInGroup(group, (mesh) => {
    totalCount += _countMeshTriangles(mesh);
  });
  return totalCount;
}

export default {
  applyTransformsToMeshes,
  processTransparentMaterial,
  processColFromPosMaterial,
  createShadowmapMaterial,
  removeShadowmapMaterial,
  forEachMeshInGroup,
  countTriangles,
};
