import * as THREE from 'three';
import VolumeMaterial from './shaders/VolumeMaterial';
import settings from '../settings';

class VolumeMesh extends THREE.Mesh {
  volumeInfo = {}; // data for noise filter

  constructor() {
    const geo = new THREE.BufferGeometry();
    super(geo);
    this.clipPlane = new THREE.Plane();
    const size = new THREE.Vector3(0.5, 0.5, 0.5);
    this.size = size;

    this.cullFlag = [
      true, true, true, true,
      true, true, true, true,
      false, false, false, false, false, false,
    ];

    this.faces = [
      { indices: [], norm: new THREE.Vector3(0, 0, -1) },
      { indices: [], norm: new THREE.Vector3(0, 0, 1) },
      { indices: [], norm: new THREE.Vector3(0, -1, 0) },
      { indices: [], norm: new THREE.Vector3(0, 1, 0) },
      { indices: [], norm: new THREE.Vector3(-1, 0, 0) },
      { indices: [], norm: new THREE.Vector3(1, 0, 0) },
      { indices: [], norm: new THREE.Vector3(0, 0, 0) },
    ];

    this.vertices = [
      new THREE.Vector3(-size.x, -size.y, -size.z),
      new THREE.Vector3(-size.x, size.y, -size.z),
      new THREE.Vector3(size.x, -size.y, -size.z),
      new THREE.Vector3(size.x, size.y, -size.z),
      new THREE.Vector3(-size.x, -size.y, size.z),
      new THREE.Vector3(-size.x, size.y, size.z),
      new THREE.Vector3(size.x, -size.y, size.z),
      new THREE.Vector3(size.x, size.y, size.z),
      new THREE.Vector3(0.0, 0.0, 0.0), // Placeholder for section
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
    ];

    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.vertices.length * 3), 3));

    this.name = 'VolumeMesh';
  }

  static _corners = [
    // x, y, z, edge1, edge2, edge3
    [-1, -1, -1, 0, 4, 8],
    [1, -1, -1, 0, 5, 9],
    [1, 1, -1, 1, 5, 10],
    [-1, 1, -1, 1, 4, 11],
    [-1, -1, 1, 2, 6, 8],
    [1, -1, 1, 2, 7, 9],
    [1, 1, 1, 3, 7, 10],
    [-1, 1, 1, 3, 6, 11],
  ];

  static _edges = [
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
    [3, 7, 1, 1, 0],
  ];

  static _edgeIntersections = (function () {
    const edgeIntersections = [];
    for (let j = 0; j < 12; ++j) {
      edgeIntersections.push(new THREE.Vector3());
    }
    return edgeIntersections;
  }());

  _updateVertices() {
    // Algorithm:
    // 1. Get plane parameters
    // 2. Compute culling flags for all vertices
    // 3. If intersection occurs => compute from 3 to 6 intersection points
    const corners = VolumeMesh._corners;
    const edges = VolumeMesh._edges;
    const edgeIntersections = VolumeMesh._edgeIntersections;

    let i;

    const norm = this.clipPlane.normal;
    const D = this.clipPlane.constant;

    const vert = this.vertices;
    const { size } = this;

    const cornerMark = [0, 0, 0, 0, 0, 0, 0, 0];
    const edgeMark = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    const curEdge = new THREE.Vector3();
    let curEdgeInter = null;

    function CheckX() {
      if (norm.x === 0) return 0;
      const x = -(norm.dot(curEdge) + D) / norm.x;
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
      const y = -(norm.dot(curEdge) + D) / norm.y;
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
      const z = -(norm.dot(curEdge) + D) / norm.z;
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
      let flag = 0;
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

    const face = {
      indices: [],
      norm: norm.clone().negate(),
    };

    let nextVertex = 8;

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

    const diff = new THREE.Vector3();
    const coplanarPoint = new THREE.Vector3();
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
    const positions = this.geometry.getAttribute('position');
    let idx = 0;
    for (i = 0; i < vert.length; ++i) {
      positions.array[idx++] = vert[i].x;
      positions.array[idx++] = vert[i].y;
      positions.array[idx++] = vert[i].z;
    }
    positions.needsUpdate = true;
  }

  _collectVertices(face, filter) {
    let i;
    const vert = this.vertices;
    face.indices = [];
    for (i = 0; i < vert.length; ++i) {
      if (this.cullFlag[i] && filter(vert[i])) {
        face.indices.push(i);
      }
    }
  }

  _sortIndices(face, right) {
    let i;
    let j;
    const vert = this.vertices;
    const angle = [];

    const dir = new THREE.Vector3();
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
          let t = angle[i];
          angle[i] = angle[j];
          angle[j] = t;

          t = face.indices[i];
          face.indices[i] = face.indices[j];
          face.indices[j] = t;
        }
      }
    }
  }

  _updateIndices() {
    // Algorithm:
    // 1. Get plane vertices (from 3 to 6 vertices)
    // 2. Get "right" vector in plane
    // 3. Sort vertices using Graham-like method
    // 4. Create indices

    let i;
    let faceIdx;
    let face;
    const vert = this.vertices;
    const { size } = this;

    this._collectVertices(this.faces[0], (vertex) => vertex.z === -size.z);
    this._collectVertices(this.faces[1], (vertex) => vertex.z === size.z);
    this._collectVertices(this.faces[2], (vertex) => vertex.y === -size.y);
    this._collectVertices(this.faces[3], (vertex) => vertex.y === size.y);
    this._collectVertices(this.faces[4], (vertex) => vertex.x === -size.x);
    this._collectVertices(this.faces[5], (vertex) => vertex.x === size.x);

    const vCenter = new THREE.Vector3();
    const vRight = new THREE.Vector3();
    const vDir = new THREE.Vector3();

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

      const rightProj = [];
      for (i = 0; i < face.indices.length; ++i) {
        vDir.subVectors(vert[face.indices[i]], vCenter);
        rightProj[i] = vDir.dot(vRight);
      }
      for (i = 1; i < face.indices.length; ++i) {
        if (rightProj[i] < rightProj[0]) {
          // swap
          let t = rightProj[0];
          rightProj[0] = rightProj[i];
          rightProj[i] = t;

          [t] = face.indices;
          face.indices[0] = face.indices[i];
          face.indices[i] = t;
        }
      }

      this._sortIndices(face, vRight);
    }

    let numIndices = 0;
    for (faceIdx = 0; faceIdx < this.faces.length; ++faceIdx) {
      face = this.faces[faceIdx];
      if (face.indices.length >= 3) {
        numIndices += 3 * (face.indices.length - 2);
      }
    }
    let offset = 0;
    const indices = new Uint16Array(numIndices);
    for (faceIdx = 0; faceIdx < this.faces.length; ++faceIdx) {
      face = this.faces[faceIdx];
      for (i = 0; i < face.indices.length - 2; ++i) {
        indices[offset] = face.indices[0]; // eslint-disable-line prefer-destructuring
        indices[offset + 1] = face.indices[i + 1];
        indices[offset + 2] = face.indices[i + 2];
        offset += 3;
      }
    }

    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  setDataSource(dataSource) {
    const vm = new VolumeMaterial.VolumeMaterial();
    const dim = dataSource.getDimensions();
    const stride = dataSource.getTiledTextureStride();
    const texture = dataSource.buildTiledTexture();
    const bbox = dataSource.getBox();
    vm.uniforms.volumeDim.value.set(dim[0], dim[1], dim[2]);
    vm.uniforms.tileTex.value = texture;
    vm.uniforms.tileTexSize.value.set(texture.image.width, texture.image.height);
    vm.uniforms.tileStride.value.set(stride[0], stride[1]);
    Object.assign(this.volumeInfo, dataSource.getVolumeInfo());

    const volInfo = this.volumeInfo;
    vm.uniforms.delta.value.copy(volInfo.delta);
    vm.uniforms.boxAngles.value.set(volInfo.obtuseAngle[0], volInfo.obtuseAngle[1], volInfo.obtuseAngle[2]);

    this.material = vm;

    bbox.getSize(this.scale);
    bbox.getCenter(this.position);
  }

  _updateIsoLevel() {
    const { kSigma, kSigmaMed, kSigmaMax } = settings.now.modes.VD;
    const volInfo = this.volumeInfo;
    const mean = volInfo.dmean - volInfo.dmin;
    const span = volInfo.dmax - volInfo.dmin;
    const level = (k) => (mean + k * volInfo.sd) / span;
    this.material.uniforms._isoLevel0.value.set(level(kSigma), level(kSigmaMed), level(kSigmaMax));
  }

  static _nearClipPlaneOffset = 0.2;

  static _pos = new THREE.Vector3();

  static _norm = new THREE.Vector3();

  static _norm4D = new THREE.Vector4();

  static _matrixWorldToLocal = new THREE.Matrix4();

  static _clipPlane = new THREE.Plane();

  rebuild(camera) {
    const nearClipPlaneOffset = VolumeMesh._nearClipPlaneOffset;
    const pos = VolumeMesh._pos;
    const norm = VolumeMesh._norm;
    const norm4D = VolumeMesh._norm4D;
    const matrixWorldToLocal = VolumeMesh._matrixWorldToLocal;
    const clipPlane = VolumeMesh._clipPlane;

    this._updateIsoLevel();

    // get clip plane in local space
    camera.getWorldDirection(norm);
    camera.getWorldPosition(pos);
    pos.addScaledVector(norm, camera.near + nearClipPlaneOffset);

    // transform pos to local CS
    matrixWorldToLocal.copy(this.matrixWorld).invert();
    pos.applyMatrix4(matrixWorldToLocal);

    // transform norm to local CS
    norm4D.set(norm.x, norm.y, norm.z, 0.0); // NOTE: use homogeneous norm for proper transformation
    norm4D.applyMatrix4(matrixWorldToLocal);
    norm.copy(norm4D);
    norm.normalize();

    clipPlane.setFromNormalAndCoplanarPoint(norm, pos);

    if (!this.clipPlane.equals(clipPlane)) {
      this.clipPlane = clipPlane.clone();
      this._updateVertices();
      this._updateIndices();
    }
  }
}

export default VolumeMesh;
