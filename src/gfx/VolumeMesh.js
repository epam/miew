

import * as THREE from 'three';
import utils from '../utils';
import VolumeMaterial from './shaders/VolumeMaterial';

function VolumeMesh() {
  this.clipPlane = new THREE.Plane();
  var size = new THREE.Vector3(0.5, 0.5, 0.5);
  this.size = size;

  this.cullFlag = [
    true, true, true, true,
    true, true, true, true,
    false, false, false, false, false, false
  ];

  this.faces = [
    {indices: [], norm: new THREE.Vector3(0, 0, -1)},
    {indices: [], norm: new THREE.Vector3(0, 0, 1)},
    {indices: [], norm: new THREE.Vector3(0, -1, 0)},
    {indices: [], norm: new THREE.Vector3(0, 1, 0)},
    {indices: [], norm: new THREE.Vector3(-1, 0, 0)},
    {indices: [], norm: new THREE.Vector3(1, 0, 0)},
    {indices: [], norm: new THREE.Vector3(0, 0, 0)},
  ];

  this.vertices = [
    new THREE.Vector3(-size.x, -size.y, -size.z),
    new THREE.Vector3(-size.x,  size.y, -size.z),
    new THREE.Vector3(size.x, -size.y, -size.z),
    new THREE.Vector3(size.x,  size.y, -size.z),
    new THREE.Vector3(-size.x, -size.y,  size.z),
    new THREE.Vector3(-size.x,  size.y,  size.z),
    new THREE.Vector3(size.x, -size.y,  size.z),
    new THREE.Vector3(size.x,  size.y,  size.z),
    new THREE.Vector3(0.0, 0.0, 0.0),    // Placeholder for section
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.0, 0.0),
    new THREE.Vector3(0.0, 0.0, 0.0),
  ];

  var geo = new THREE.BufferGeometry();
  geo.addAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices.length * 3), 3));

  THREE.Mesh.call(this, geo);
  this.name = 'VolumeMesh';
}

utils.deriveClass(VolumeMesh, THREE.Mesh);

VolumeMesh.prototype._updateVertices = (function() {
  var corners = [
    // x, y, z, edge1, edge2, edge3
    [-1, -1, -1, 0, 4, 8],
    [1, -1, -1, 0, 5, 9],
    [1, 1, -1, 1, 5, 10],
    [-1, 1, -1, 1, 4, 11],
    [-1, -1, 1, 2, 6, 8],
    [1, -1, 1, 2, 7, 9],
    [1, 1, 1, 3, 7, 10],
    [-1, 1, 1, 3, 6, 11]
  ];

  var edges = [
    // corner1, corner2, center_x, center_y, center_z
    [0, 1, 0, -1, -1],
    [2, 3, 0, 1, -1],
    [4, 5, 0, -1, 1],
    [6, 7, 0, 1, 1],
    [0, 3, -1, 0, -1],
    [1, 2, 1, 0, -1],
    [4, 7, -1, 0, 1],
    [5, 6, 1, 0, 1],
    [0, 4, -1, -1, 0],
    [1, 5, 1, -1, 0],
    [2, 6, -1, 1, 0],
    [3, 7, 1, 1, 0]
  ];

  var edgeIntersections = [];
  for (var j = 0; j < 12; ++j) {
    edgeIntersections.push(new THREE.Vector3());
  }


  return function() {
    // Algorithm:
    // 1. Get plane parameters
    // 2. Compute culling flags for all vertices
    // 3. If intersection occurs => compute from 3 to 6 intersection points

    var i;

    var norm = this.clipPlane.normal;
    var D = this.clipPlane.constant;

    var vert = this.vertices;
    var size = this.size;

    var cornerMark = [0, 0, 0, 0, 0, 0, 0, 0];
    var edgeMark = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    const curEdge = new THREE.Vector3();
    let curEdgeInter = null;

    function CheckX() {
      if (norm.x === 0) return 0;
      var x = -(norm.dot(curEdge) + D) / norm.x;
      if (-size.x <= x && x <= size.x) {
        curEdgeInter.set(x, curEdge.y, curEdge.z);
        if (x === size.x) return 2;
        if (x === -size.x) return -2;
        return 1;
      }
      return 0;
    }

    function CheckY() {
      if (norm.y === 0) return 0;
      var y = -(norm.dot(curEdge) + D) / norm.y;
      if (-size.y <= y && y <= size.y) {
        curEdgeInter.set(curEdge.x, y, curEdge.z);
        if (y === size.y) return 2;
        if (y === -size.y) return -2;
        return 1;
      }
      return 0;
    }

    function CheckZ() {
      if (norm.z === 0) return 0;
      var z = -(norm.dot(curEdge) + D) / norm.z;
      if (-size.z <= z && z <= size.z) {
        curEdgeInter.set(curEdge.x, curEdge.y, z);
        if (z === size.z) return 2;
        if (z === -size.z) return -2;
        return 1;
      }
      return 0;
    }

    // for each edge
    for (let curEdgeIdx = 0; curEdgeIdx < 12; ++curEdgeIdx) {
      const curEdgeSource = edges[curEdgeIdx];
      curEdgeInter = edgeIntersections[curEdgeIdx];

      curEdge.set(curEdgeSource[2], curEdgeSource[3], curEdgeSource[4]);
      curEdge.multiply(size);

      // calculate intersection point
      var flag = 0;
      if (curEdgeSource[2] === 0) flag = CheckX();
      if (curEdgeSource[3] === 0) flag = CheckY();
      if (curEdgeSource[4] === 0) flag = CheckZ();

      // mark corresponding corner (if plane cuts through one)
      if (flag === -2) {
        cornerMark[curEdgeSource[0]] = 1;
      } else if (flag === 2) {
        cornerMark[curEdgeSource[1]] = 1;
      } else if (flag === 0) {
        // edge is not intersected by the plane (doesn't produce a vertex)
        edgeMark[curEdgeIdx] = 0;
      }
    }

    var face = {
      indices: [],
      norm: norm.clone().negate()
    };

    var nextVertex = 8;

    // for each marked corner
    for (i = 0; i < 8; ++i) {
      if (cornerMark[i] === 1) {
        // add corner as vertex to the face
        vert[nextVertex].set(corners[i][0], corners[i][1], corners[i][2]).multiply(size);
        face.indices.push(nextVertex++);
        // skip adjacent edges
        edgeMark[corners[i][3]] = 0;
        edgeMark[corners[i][4]] = 0;
        edgeMark[corners[i][5]] = 0;
      }
    }

    // for each edge that has internal intersection
    for (i = 0; i < 12; ++i) {
      if (edgeMark[i] === 1) {
        // add intersection point as vertex to the face
        vert[nextVertex].copy(edgeIntersections[i]);
        face.indices.push(nextVertex++);
      }
    }

    this.faces[6] = face;

    var diff = new THREE.Vector3();
    var coplanarPoint = new THREE.Vector3();
    this.clipPlane.coplanarPoint(coplanarPoint);
    for (i = 0; i < vert.length; ++i) {
      this.cullFlag[i] = false;
      if (i < 8) {
        // corners should be culled by clipping plane
        diff.subVectors(vert[i], coplanarPoint);
        this.cullFlag[i] = (norm.dot(diff) >= 0.0);
      } else if (i < 8 + face.indices.length) {
        // cross section vertices don't get culled
        this.cullFlag[i] = true;
      }
    }

    // write data to vertex buffer
    var positions = this.geometry.getAttribute('position');
    var idx = 0;
    for (i = 0; i < vert.length; ++i) {
      positions.array[idx++] = vert[i].x;
      positions.array[idx++] = vert[i].y;
      positions.array[idx++] = vert[i].z;
    }
    positions.needsUpdate = true;
  };
})();

VolumeMesh.prototype._collectVertices = function(face, filter) {
  var i;
  var vert = this.vertices;
  face.indices = [];
  for (i = 0; i < vert.length; ++i) {
    if (this.cullFlag[i] && filter(vert[i])) {
      face.indices.push(i);
    }
  }
};

VolumeMesh.prototype._sortIndices = function(face, right) {
  var i, j;
  var vert = this.vertices;
  var angle = [];

  var dir = new THREE.Vector3();
  for (i = 1; i < face.indices.length; ++i) {
    dir.subVectors(vert[face.indices[i]], vert[face.indices[0]]);
    dir.normalize();
    dir.cross(right);
    dir.negate();
    angle[i] = face.norm.dot(dir);
  }

  // Exchange sort
  for (i = 1; i < face.indices.length - 1; ++i) {
    for (j = i + 1; j < face.indices.length; ++j) {
      if (angle[j] < angle[i]) {
        // swap
        var t = angle[i];
        angle[i] = angle[j];
        angle[j] = t;

        t = face.indices[i];
        face.indices[i] = face.indices[j];
        face.indices[j] = t;
      }
    }
  }
};

VolumeMesh.prototype._updateIndices = function() {
  // Algorithm:
  // 1. Get plane vertices (from 3 to 6 vertices)
  // 2. Get "right" vector in plane
  // 3. Sort vertices using Graham-like method
  // 4. Create indices

  var i, faceIdx, face;
  var vert = this.vertices;
  var size = this.size;

  this._collectVertices(this.faces[0], function(vertex) { return vertex.z === -size.z; });
  this._collectVertices(this.faces[1], function(vertex) { return vertex.z === size.z; });
  this._collectVertices(this.faces[2], function(vertex) { return vertex.y === -size.y; });
  this._collectVertices(this.faces[3], function(vertex) { return vertex.y === size.y; });
  this._collectVertices(this.faces[4], function(vertex) { return vertex.x === -size.x; });
  this._collectVertices(this.faces[5], function(vertex) { return vertex.x === size.x; });

  var vCenter = new THREE.Vector3();
  var vRight = new THREE.Vector3();
  var vDir = new THREE.Vector3();

  for (faceIdx = 0; faceIdx < this.faces.length; ++faceIdx) {
    face = this.faces[faceIdx];

    if (face.indices.length === 0) continue;

    vCenter.set(0, 0, 0);
    for (i = 0; i < face.indices.length; ++i) {
      vCenter.add(vert[face.indices[i]]);
    }
    vCenter.multiplyScalar(1.0 / face.indices.length);
    vRight.subVectors(vert[face.indices[0]], vCenter);
    vRight.normalize();

    var rightProj = [];
    for (i = 0; i < face.indices.length; ++i) {
      vDir.subVectors(vert[face.indices[i]], vCenter);
      rightProj[i] = vDir.dot(vRight);
    }
    for (i = 1; i < face.indices.length; ++i) {
      if (rightProj[i] < rightProj[0]) {
        // swap
        var t = rightProj[0];
        rightProj[0] = rightProj[i];
        rightProj[i] = t;

        t = face.indices[0];
        face.indices[0] = face.indices[i];
        face.indices[i] = t;
      }
    }

    this._sortIndices(face, vRight);
  }

  var numIndices = 0;
  for (faceIdx = 0; faceIdx < this.faces.length; ++faceIdx) {
    face = this.faces[faceIdx];
    if (face.indices.length >= 3) {
      numIndices += 3 * (face.indices.length - 2);
    }
  }
  var offset = 0;
  var indices = new Uint16Array(numIndices);
  for (faceIdx = 0; faceIdx < this.faces.length; ++faceIdx) {
    face = this.faces[faceIdx];
    for (i = 0; i < face.indices.length - 2; ++i) {
      indices[offset + 0] = face.indices[0];
      indices[offset + 1] = face.indices[i + 1];
      indices[offset + 2] = face.indices[i + 2];
      offset += 3;
    }
  }

  this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
};

VolumeMesh.prototype.setDataSource = function(dataSource) {
  var vm = new VolumeMaterial.VolumeMaterial();
  var dim = dataSource.getDimensions();
  var stride = dataSource.getTiledTextureStride();
  var texture = dataSource.buildTiledTexture();
  vm.uniforms.volumeDim.value.set(dim[0], dim[1], dim[2]);
  vm.uniforms.tileTex.value = texture;
  vm.uniforms.tileTexSize.value.set(texture.image.width, texture.image.height);
  vm.uniforms.tileStride.value.set(stride[0], stride[1]);
  this.material = vm;

  var bbox = dataSource.getBox();
  bbox.getSize(this.scale);
  bbox.getCenter(this.position);
};

VolumeMesh.prototype.rebuild = (function() {

  const nearClipPlaneOffset = 0.2;
  const pos = new THREE.Vector3();
  const norm = new THREE.Vector3();
  const norm4D = new THREE.Vector4();
  const matrixWorldToLocal = new THREE.Matrix4();
  const clipPlane = new THREE.Plane();

  return function(camera) {

    // get clip plane in local space
    camera.getWorldDirection(norm);
    camera.getWorldPosition(pos);
    pos.addScaledVector(norm, camera.near + nearClipPlaneOffset);

    // transform pos to local CS
    matrixWorldToLocal.getInverse(this.matrixWorld);
    pos.applyMatrix4(matrixWorldToLocal);

    // transform norm to local CS
    norm4D.set(norm.x, norm.y, norm.z, 0.0);  // NOTE: use homogeneous norm for proper transformation
    norm4D.applyMatrix4(matrixWorldToLocal);
    norm.copy(norm4D);
    norm.normalize();

    clipPlane.setFromNormalAndCoplanarPoint(norm, pos);

    if (!this.clipPlane.equals(clipPlane)) {
      this.clipPlane = clipPlane.clone();
      this._updateVertices();
      this._updateIndices();
    }
  };
})();

export default VolumeMesh;

