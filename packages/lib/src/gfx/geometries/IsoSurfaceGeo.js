import * as THREE from 'three';

/**
 * Class for geometry (triangle mesh) representation
 *
 *
 * @param {number} maxNumVertices Maximum possible number of vertices in mesh
 * @param {number} maxNumTriangles Maximum possible number of triangles in mesh
 * @param {boolean} needVertexColors Obvious
 */
class IsoSurfaceGeo {
  constructor(maxNumVertices, maxNumTriangles, needVertexColors) {
    this._maxNumVertices = maxNumVertices;
    this._maxNumTriangles = maxNumTriangles;
    this._vertices = new Array(maxNumVertices);
    this._normals = new Array(maxNumVertices);
    this._colors = null;
    if (needVertexColors) {
      this._colors = new Array(maxNumVertices);
    }
    this._indices = new Array(maxNumTriangles * (1 + 2));
    this._numVertices = 0;
    this._numTriangles = 0;

    let i;
    for (i = 0; i < maxNumVertices; i++) {
      this._vertices[i] = new THREE.Vector3();
      this._normals[i] = new THREE.Vector3();
    }
    for (i = 0; i < maxNumTriangles * (1 + 2); i++) {
      this._indices[i] = -1;
    }
    if (needVertexColors) {
      for (i = 0; i < maxNumVertices; i++) {
        this._colors[i] = new THREE.Vector3();
      }
    }
  }

  destroy() {
    this._vertices = null;
    this._normals = null;
    this._indices = null;
  }
}
export default IsoSurfaceGeo;
