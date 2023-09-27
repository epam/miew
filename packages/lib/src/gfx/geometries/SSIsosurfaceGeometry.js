import * as THREE from 'three';
import IsoSurfaceGeometry from './IsoSurfaceGeometry';
import IsoSurfaceAtomColored from './IsoSurfaceAtomColored';
import IsosurfaceBuildNormals from './IsosurfaceBuildNormals';
import IsoSurfaceMarchCube from './IsoSurfaceMarchCube';
import IsoSurfaceGeo from './IsoSurfaceGeo';
import chem from '../../chem';
import utils from '../../utils';

const COLOR_SIZE = 3;
const HASH_SIZE = 32768;
const { Element } = chem;

/**
 * This class implements 'quick' isosurface geometry generation algorithm.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */

class SSIsosurfaceGeometry extends IsoSurfaceGeometry {
  _build() {
    // convert geoOut into arrays of positions, indices, normals
    this._innerBuild();
    const geoOut = this.getGeo();
    this.destroy();
    this._fromGeo(geoOut);
  }

  _fromGeo(geoOut) {
    let colors = null;
    const positions = utils.allocateTyped(Float32Array, (1 + 2) * geoOut._numVertices);
    const normals = utils.allocateTyped(Float32Array, (1 + 2) * geoOut._numVertices);
    if (geoOut._colors !== null) {
      colors = utils.allocateTyped(Float32Array, (1 + 2) * geoOut._numVertices);
    }
    const indices = utils.allocateTyped(Uint32Array, (1 + 2) * geoOut._numTriangles);

    for (let i = 0, j = 0; i < geoOut._numVertices; i++) {
      positions[j + 0] = (geoOut._vertices[i].x);
      positions[j + 1] = (geoOut._vertices[i].y);
      positions[j + 2] = (geoOut._vertices[i].z);
      normals[j + 0] = geoOut._normals[i].x;
      normals[j + 1] = geoOut._normals[i].y;
      normals[j + 2] = geoOut._normals[i].z;
      j += 3;
    }
    if (colors !== null) {
      for (let i = 0, j = 0; i < geoOut._numVertices; i++, j += 3) {
        colors[j + 0] = geoOut._colors[i].x;
        colors[j + 1] = geoOut._colors[i].y;
        colors[j + 2] = geoOut._colors[i].z;
      }
    }

    const numTri3 = geoOut._numTriangles * (1 + 2);
    for (let i = 0; i < numTri3; i++) {
      indices[i] = geoOut._indices[i];
    }

    this.setIndex(new THREE.BufferAttribute(indices, 1));
    this.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    this.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.computeBoundingBox();
    this.computeBoundingSphere();

    geoOut.destroy();
  }

  convertToAtomsColored(packedArrays, atomsColored) {
    const { atoms, colors } = packedArrays;
    for (let i = 0, numAtoms = atoms.length; i < numAtoms; i++) {
      const vCenter = atoms[i].position;
      const { radius } = atoms[i].element;
      atomsColored[i] = new IsoSurfaceAtomColored(vCenter, radius);
      const nm = atoms[i].element.number;
      atomsColored[i].atomType = this.getType(nm);
      let cIdx = COLOR_SIZE * i;
      atomsColored[i].colorX = colors[cIdx++];
      atomsColored[i].colorY = colors[cIdx++];
      atomsColored[i].colorZ = colors[cIdx];
      atomsColored[i].srcAtom = atoms[i];
    }
  }

  getGeo() {
    return this.geoOut;
  }

  destroy() {
    this.atoms = null;

    this.hashLines = null;
    this.hashEntries = null;
  }

  /**
   * Calculates bounding box for array with spheres (atoms)
   *
   * @param {Object}  atoms      Atoms array
   * @param {Vector3} vBoxMin    Bounding box min point
   * @param {Vector3} vBoxMax    Bounding box max point
   */
  getBoundingBox(atoms, vBoxMin, vBoxMax) {
    const bigNum = 10000000.0;

    vBoxMin.x = vBoxMin.y = vBoxMin.z = bigNum;
    vBoxMax.x = vBoxMax.y = vBoxMax.z = 0 - bigNum;

    const probeRadius2 = this.probeRadius * this.atomRadiusScale;
    let radMax = 0.0;
    for (let i = 0, num = atoms.length; i < num; i++) {
      const vCenter = atoms[i].coord;
      const rad = atoms[i].radius + probeRadius2;
      radMax = (rad > radMax) ? rad : radMax;
      if (vCenter.x - rad < vBoxMin.x) {
        vBoxMin.x = vCenter.x - rad;
      }
      if (vCenter.y - rad < vBoxMin.y) {
        vBoxMin.y = vCenter.y - rad;
      }
      if (vCenter.z - rad < vBoxMin.z) {
        vBoxMin.z = vCenter.z - rad;
      }
      if (vCenter.x + rad > vBoxMax.x) {
        vBoxMax.x = vCenter.x + rad;
      }
      if (vCenter.y + rad > vBoxMax.y) {
        vBoxMax.y = vCenter.y + rad;
      }
      if (vCenter.z + rad > vBoxMax.z) {
        vBoxMax.z = vCenter.z + rad;
      }
    }
    vBoxMin.x -= radMax;
    vBoxMin.y -= radMax;
    vBoxMin.z -= radMax;
    vBoxMax.x += radMax;
    vBoxMax.y += radMax;
    vBoxMax.z += radMax;
  }

  /**
   * Calculate (x,y,z) cordinate of the cell corner point
   *
   * @param {Vector3} vBoxMin Bounding box min point
   * @param {Vector3} vBoxMax Bounding box max point
   * @param {number} x Cell integer x coordinate
   * @param {number} y Cell integer y coordinate
   * @param {number} z Cell integer z coordinate
   * @param {number} numPoints NUm points in cell on side
   * @param {Vector3} vOut Output vector
   */
  getCornerCoord(vBoxMin, vBoxMax, x, y, z, numPoints, vOut) {
    const invNP = 1.0 / (numPoints - 1.0);
    const tx = x * invNP;
    const ty = y * invNP;
    const tz = z * invNP;

    vOut.x = vBoxMin.x * (1.0 - tx) + vBoxMax.x * tx;
    vOut.y = vBoxMin.y * (1.0 - ty) + vBoxMax.y * ty;
    vOut.z = vBoxMin.z * (1.0 - tz) + vBoxMax.z * tz;
  }

  /**
   * Calculate point of intersection of sphere surface
   * and cell edge, given by [indexA, indexB] line
   *
   * @param {number} indexA Cell vertex index in [0..11]
   * @param {number} indexB Cell vertex index in [0..11]
   * @param {array}  sign   Sign array for all 8 vertices
   * @param {object} cube   Cube
   * @param {number} indexPointValue for value placement
   * @param {Vector3} vOut  Point of intersection
   */
  buildEdgePoint(indexA, indexB, sign, cube, indexPointValue, vOut) {
    if (sign[indexA] ^ sign[indexB]) {
      const cTwentyFour = 24;
      const t = (0 - cube.pointsValuesLinear[indexPointValue + cTwentyFour + indexA])
        / (cube.pointsValuesLinear[indexPointValue + cTwentyFour + indexB]
          - cube.pointsValuesLinear[indexPointValue + cTwentyFour + indexA]);
      const xa = cube.pointsValuesLinear[indexPointValue + indexA * (2 + 1) + 0];
      const ya = cube.pointsValuesLinear[indexPointValue + indexA * (2 + 1) + 1];
      const za = cube.pointsValuesLinear[indexPointValue + indexA * (2 + 1) + 2];
      const xb = cube.pointsValuesLinear[indexPointValue + indexB * (2 + 1) + 0];
      const yb = cube.pointsValuesLinear[indexPointValue + indexB * (2 + 1) + 1];
      const zb = cube.pointsValuesLinear[indexPointValue + indexB * (2 + 1) + 2];

      vOut.x = xa * (1.0 - t) + xb * t;
      vOut.y = ya * (1.0 - t) + yb * t;
      vOut.z = za * (1.0 - t) + zb * t;
    }
  }

  /**
   * Check if triangle is visible (vertices are close to atoms included in visibility set)
   *
   * @param {Vector3} v0 Vertex #0
   * @param {Vector3} v1 Vertex #1
   * @param {Vector3} v2 Vertex #2
   * @returns {boolean} true if triangle is visible
   */
  isTriangleVisible(v0, v1, v2) {
    const a0 = this.voxelWorld.getClosestAtom(v0);
    const a1 = this.voxelWorld.getClosestAtom(v1);
    const a2 = this.voxelWorld.getClosestAtom(v2);
    if (a0 === null || a1 === null || a2 === null
      || a0.srcAtom === null || a1.srcAtom === null || a2.srcAtom === null) {
      return false;
    }

    return this.visibilitySelector.includesAtom(a0.srcAtom)
      && this.visibilitySelector.includesAtom(a1.srcAtom)
      && this.visibilitySelector.includesAtom(a2.srcAtom);
  }

  /**
   * Add triangle to result geometry
   *
   * @param {Vector3} v0 Vertex #0
   * @param {Vector3} v1 Vertex #1
   * @param {Vector3} v2 Vertex #2
   * @returns {boolean} false if no more triangles can be added
   */
  addTriangle(v0, v1, v2) {
    if (this.visibilitySelector && !this.isTriangleVisible(v0, v1, v2)) {
      return true;
    }

    const geo = this.geoOut;

    if (geo._numTriangles >= this.maxNumTriangles) {
      return false;
    }

    // Add vertex with optimize
    const indInGeo0 = this.addVertexToGeo(geo, v0);
    const indInGeo1 = this.addVertexToGeo(geo, v1);
    const indInGeo2 = this.addVertexToGeo(geo, v2);
    if ((indInGeo0 | indInGeo1 | indInGeo2) < 0) {
      return false;
    }

    const itr = 3 * geo._numTriangles;
    geo._indices[itr + 0] = indInGeo0;
    geo._indices[itr + 1] = indInGeo1;
    geo._indices[itr + 2] = indInGeo2;
    geo._numTriangles++;
    return true;
  }

  /**
   * Build result geometry (triangle mesh) from marching cube cells
   *
   * @param {number} meshRes Marchnig cube vertex count on each side
   * @param {Vector3} vBoxMin Bounding box point min
   * @param {Vector3} vBoxMax Bounding box point max
   * @param {number} corners float values array for each cube point
   * @param {Vector3} vCellStep vector to next cube cell diagonal point
   * @param {object} cube IsoSurfaceMarchCube object
   * @returns {number} 0, if success (<0) is error
   */
  buildGeoFromCorners(meshRes, vBoxMin, vBoxMax, corners, vCellStep, cube) {
    const arrSize = 12;
    const cNumVerts = 8;
    const numCells = meshRes - 1;
    const side = meshRes;
    const side2 = meshRes * meshRes;

    const vaEdges = new Array(arrSize);
    for (let i = 0; i < arrSize; i++) {
      vaEdges[i] = new THREE.Vector3();
    }
    const sign = [];
    for (let i = 0; i < cNumVerts; i++) {
      sign[i] = 1.0;
    }
    const vCorner = new THREE.Vector3();
    let indCell = 0;
    let indY = 0;
    for (let y = 0; y < numCells; y++, indY += side2) {
      let indZ = 0;
      for (let z = 0; z < numCells; z++, indZ += side) {
        for (let x = 0; x < numCells; x++) {
          if (!cube.hasIntersection[indCell]) {
            // next cell
            indCell++;
            continue;
          }
          const bitsInside = cube.bitsInside[indCell];

          this.getCornerCoord(vBoxMin, vBoxMax, x, y, z, meshRes, vCorner);

          const indPointValues = indCell * (2 << (2 + 2));
          for (let i = 0, j = 0; i < cNumVerts; i++) {
            cube.pointsValuesLinear[indPointValues + j++] = vCorner.x;
            cube.pointsValuesLinear[indPointValues + j++] = vCorner.y;
            cube.pointsValuesLinear[indPointValues + j++] = vCorner.z;
          }

          cube.pointsValuesLinear[indPointValues + 3] += vCellStep.x;
          cube.pointsValuesLinear[indPointValues + 2 * 3] += vCellStep.x;
          cube.pointsValuesLinear[indPointValues + 5 * 3] += vCellStep.x;
          cube.pointsValuesLinear[indPointValues + 6 * 3] += vCellStep.x;

          cube.pointsValuesLinear[indPointValues + 2 * 3 + 2] += vCellStep.z;
          cube.pointsValuesLinear[indPointValues + 3 * 3 + 2] += vCellStep.z;
          cube.pointsValuesLinear[indPointValues + 6 * 3 + 2] += vCellStep.z;
          cube.pointsValuesLinear[indPointValues + 7 * 3 + 2] += vCellStep.z;

          cube.pointsValuesLinear[indPointValues + 4 * 3 + 1] += vCellStep.y;
          cube.pointsValuesLinear[indPointValues + 5 * 3 + 1] += vCellStep.y;
          cube.pointsValuesLinear[indPointValues + 6 * 3 + 1] += vCellStep.y;
          cube.pointsValuesLinear[indPointValues + 7 * 3 + 1] += vCellStep.y;

          // now current cell has intersections (from -x to +x) on some cube edges
          const indValues = indPointValues + 24;
          for (let i = 0; i < cNumVerts; ++i) {
            sign[i] = (cube.pointsValuesLinear[indValues + i] < 0.0) ? 1 : 0;
          }

          this.buildEdgePoint(0, 1, sign, cube, indPointValues, vaEdges[0]);
          this.buildEdgePoint(1, 2, sign, cube, indPointValues, vaEdges[1]);
          this.buildEdgePoint(2, 3, sign, cube, indPointValues, vaEdges[2]);
          this.buildEdgePoint(3, 0, sign, cube, indPointValues, vaEdges[3]);

          this.buildEdgePoint(4, 5, sign, cube, indPointValues, vaEdges[4]);
          this.buildEdgePoint(5, 6, sign, cube, indPointValues, vaEdges[5]);
          this.buildEdgePoint(6, 7, sign, cube, indPointValues, vaEdges[6]);
          this.buildEdgePoint(7, 4, sign, cube, indPointValues, vaEdges[7]);

          this.buildEdgePoint(0, 4, sign, cube, indPointValues, vaEdges[8]);
          this.buildEdgePoint(1, 5, sign, cube, indPointValues, vaEdges[9]);
          this.buildEdgePoint(2, 6, sign, cube, indPointValues, vaEdges[10]);
          this.buildEdgePoint(3, 7, sign, cube, indPointValues, vaEdges[11]);

          const offs = bitsInside * (2 << (1 + 2));
          for (let numTri = 0, indTri = 0; numTri < (2 + 2 + 2); numTri++, indTri += 3) {
            // s_triIndicesMarchCube is external array, defined in mold_ind.js
            const i0 = cube.striIndicesMarchCube[offs + indTri];
            if (i0 < 0) {
              break;
            }
            const i1 = cube.striIndicesMarchCube[offs + indTri + 1];
            const i2 = cube.striIndicesMarchCube[offs + indTri + 2];

            if (!this.addTriangle(vaEdges[i0], vaEdges[i1], vaEdges[i2])) {
              return 0 - 2;
            }
          } // for numTri

          // next cell (cube)
          indCell++;
        } // for (x)
      } // for (z)
    } // for (y)
    return 0;
  }

  /**
   * Returns number of cell with intersection with at least one sphere.
   * Using this number, we can estimate required number of vertices
   * and triangles to build result mesh.
   *
   * @param {number} side Number of points in cube voxels
   * @param {number} numCells Number of cells in cube voxels (per direction)
   * @param {array} corners Array of float values for cube corner points
   * @param {object} cube IsoSurfaceMarchCube object
   * @returns {number} numIntersectedCells
   */
  getNumIntersectedCells(side, numCells, corners, cube) {
    const side2 = side * side;
    const cNumVerts = 8;
    let numIntersectedCells = 0;

    let indCell = 0;
    let indY = 0;
    for (let y = 0; y < numCells; y++, indY += side2) {
      let indZ = 0;
      for (let z = 0; z < numCells; z++, indZ += side) {
        for (let x = 0; x < numCells; x++) {
          const cubeValuesIndex = indCell * (2 << (2 + 2)) + 24;
          const indCorner = x + indZ + indY;

          cube.pointsValuesLinear[cubeValuesIndex] = corners[indCorner];
          cube.pointsValuesLinear[cubeValuesIndex + 1] = corners[indCorner + 1];
          cube.pointsValuesLinear[cubeValuesIndex + 2] = corners[indCorner + side + 1];
          cube.pointsValuesLinear[cubeValuesIndex + 3] = corners[indCorner + side];
          cube.pointsValuesLinear[cubeValuesIndex + 4] = corners[side2 + indCorner];
          cube.pointsValuesLinear[cubeValuesIndex + 5] = corners[side2 + indCorner + 1];
          cube.pointsValuesLinear[cubeValuesIndex + 6] = corners[side2 + indCorner + side + 1];
          cube.pointsValuesLinear[cubeValuesIndex + 7] = corners[side2 + indCorner + side];

          // check read exception
          // assert(side2 + indCorner + side + 1 < side3);

          // get bit flags inside
          let bitsInside = 0;
          for (let i = 0; i < cNumVerts; ++i) {
            if (cube.pointsValuesLinear[cubeValuesIndex + i] < 0.0) {
              bitsInside |= (1 << i);
            }
          }

          if ((bitsInside === 0) || (bitsInside === ((1 << cNumVerts) - 1))) {
            cube.hasIntersection[indCell] = false;
          } else {
            cube.hasIntersection[indCell] = true;
            numIntersectedCells++;
          }
          cube.bitsInside[indCell] = bitsInside;
          // next cell
          indCell++;
        } // for (x)
      } // for (z)
    } // for (y)
    return numIntersectedCells;
  }

  getType(letter) {
    /* eslint-disable no-magic-numbers */
    const atomT = [0, 0, 1, 1, 2, 6, 3, 6, 4, 6, 5, 6, 6, 0, 7, 3, 8, 2, 9, 6, 10, 6, 11, 6, 12, 6, 13, 6, 14, 6, 15, 4,
      16, 5, 17, 6, 18, 6, 19, 6, 20, 6, 21, 6, 22, 6, 23, 6, 24, 6, 25, 6, 26, 6, 27, 6, 28, 6, 29, 6, 30, 6, 31, 6,
      32, 6, 33, 6, 34, 6, 35, 6, 36, 6, 37, 6, 38, 6, 39, 6, 40, 6, 41, 6, 42, 6, 43, 6, 44, 6, 45, 6, 46, 6, 47, 6,
      48, 6, 49, 6, 50, 6, 51, 6, 52, 6, 53, 6, 54, 6, 55, 6, 56, 6, 57, 6, 58, 6, 59, 6, 60, 6, 61, 6, 62, 6, 63, 6,
      64, 6, 65, 6, 66, 6, 67, 6, 68, 6, 69, 6, 70, 6, 71, 6, 72, 6, 73, 6, 74, 6, 75, 6, 76, 6, 77, 6, 78, 6, 79, 6,
      80, 6, 81, 6, 82, 6, 83, 6, 84, 6, 85, 6, 86, 6, 87, 6, 88, 6, 89, 6, 90, 6, 91, 6, 92, 6, 93, 6, 94, 6, 95, 6,
      96, 6, 97, 6, 98, 6, 99, 6, 100, 6, 101, 6, 102, 6, 103, 6, 104, 6, 105, 6, 106, 6, 107, 6, 108, 6, 109, 6];
    /* eslint-enable no-magic-numbers */

    if (letter < 1 || letter > atomT.length / 2
      || (Object.keys(Element.ByAtomicNumber).length * 2) !== atomT.length) {
      throw new Error('atomT.length  should be equal Element.ByAtomicNumber.length * 2');
    }
    return atomT[letter * 2];
  }

  /**
   * Calculate values for marching cube grid points
   * positive values are outside sphere, negative - is inside
   *
   * @param {array} corners array of float values
   * @param {number} side Number of point in cube in 1 dimennsion
   * @param {Vector3} vBoxMin Bounding box min point
   * @param {Vector3} vBoxMax Bounding box max point
   * @param {array} atoms Array of input atoms
   * @param {number} probeRad radius for atom probing
   */
  calculateGridCorners(corners, side, vBoxMin, vBoxMax, atoms, probeRad) {
    const side2 = side * side;
    const side3 = side2 * side;
    const vCorner = new THREE.Vector3();
    const vDif = new THREE.Vector3();
    /* eslint-disable no-magic-numbers */
    const aLot = +1.0e12;
    /* eslint-enable no-magic-numbers */

    for (let i = 0; i < side3; i++) {
      corners[i] = aLot; // to large value
    }

    const xScale = (side - 1) / (vBoxMax.x - vBoxMin.x);
    const yScale = (side - 1) / (vBoxMax.y - vBoxMin.y);
    const zScale = (side - 1) / (vBoxMax.z - vBoxMin.z);

    for (let s = 0, numAtoms = atoms.length; s < numAtoms; s++) {
      const atom = atoms[s];
      const radius = atom.radius + probeRad;

      const fx = ((atom.coord.x - radius) - vBoxMin.x) * xScale;
      const fy = ((atom.coord.y - radius) - vBoxMin.y) * yScale;
      const fz = ((atom.coord.z - radius) - vBoxMin.z) * zScale;

      const indXMin = Math.floor(fx);
      const indYMin = Math.floor(fy);
      const indZMin = Math.floor(fz);

      let indXMax = Math.floor(((atom.coord.x + radius) - vBoxMin.x) * xScale);
      let indYMax = Math.floor(((atom.coord.y + radius) - vBoxMin.y) * yScale);
      let indZMax = Math.floor(((atom.coord.z + radius) - vBoxMin.z) * zScale);

      indXMax++;
      indYMax++;
      indZMax++;
      indXMax = (indXMax <= (side - 1)) ? indXMax : (side - 1);
      indYMax = (indYMax <= (side - 1)) ? indYMax : (side - 1);
      indZMax = (indZMax <= (side - 1)) ? indZMax : (side - 1);

      for (let y = indYMin; y <= indYMax; y++) {
        const indY = y * side2;
        for (let z = indZMin; z <= indZMax; z++) {
          const indZ = z * side;
          for (let x = indXMin; x <= indXMax; x++) {
            const ind = indY + indZ + x;
            this.getCornerCoord(vBoxMin, vBoxMax, x, y, z, side, vCorner);
            vDif.x = vCorner.x - atom.coord.x;
            vDif.y = vCorner.y - atom.coord.y;
            vDif.z = vCorner.z - atom.coord.z;
            const distToSphere = Math.sqrt(vDif.x * vDif.x + vDif.y * vDif.y + vDif.z * vDif.z);
            // val: < 0, if inside sphere
            // val: > 0, if outside sphere
            const val = distToSphere - radius;
            if (val < corners[ind]) {
              corners[ind] = val;
            }
          } // for (x)
        } // for (z)
      } // for (y)
    } // for (s)
  }

  /**
   * Create memory pool for vertex hash management
   *
   * @param {number} maxNumVertices Maximum possible number of vertices (that will be build)
   * @param {number} maxNumTriangles Maximum possible number of triangles (that will be build)
   * @returns {number} 0, if success. (<0) is non memory
   */
  createVertexHash(maxNumVertices, maxNumTriangles) {
    this.hashLines = utils.allocateTyped(Int32Array, HASH_SIZE * 2);
    if (this.hashLines === null) {
      return 0 - 1;
    }
    for (let i = 0, j = 0; i < HASH_SIZE; i++) {
      this.hashLines[j++] = 0; // num vertices in this hash line
      this.hashLines[j++] = 0 - 1; // index of the first entry
    }

    this.maxNumVertices = maxNumVertices;
    this.maxNumTriangles = maxNumTriangles;

    this.numHashEtriesAllocated = maxNumVertices;
    this.hashEntries = utils.allocateTyped(Int32Array, 2 * this.numHashEtriesAllocated);
    if (this.hashEntries === null) {
      return 0 - 1;
    }
    for (let i = 0, j = 0; i < this.numHashEtriesAllocated; i++) {
      this.hashEntries[j++] = 0 - 1; // index of vertex
      this.hashEntries[j++] = 0 - 1; // next hash entry index
    }
    this.numHashEntryIndex = 0;
    return 0;
  }

  /**
   * Allocate and return new hash entry. Just check possible amount.
   *
   * @returns {number} index of hash entry, that can be used for geometry add vertex functionality
   */
  getNewHashEntry() {
    if (this.numHashEntryIndex < this.numHashEtriesAllocated) {
      const i = this.numHashEntryIndex;
      this.numHashEntryIndex++;
      return i;
    }
    return 0 - 1;
  }

  /**
   * Add vertex to geometry structure
   * using vertex hash table to quickly check, is this vertex already exist in geometry
   *
   * @param {object} geoOut Geometry to build
   * @param {Vector3} vAdd Vertex to add
   * @returns {number} index of added (or existing) vertex in geometry.
   */
  addVertexToGeo(geoOut, vAdd) {
    let entry;
    const oneHynberes = 0.01;
    const n815851 = 815851;
    const n37633 = 37633;
    const n2453543 = 2453543;
    const r106 = 1.0e-6;

    const hashResolution = this.marCubeResoultion << 2;
    const v = new THREE.Vector3();
    const ix = Math.floor(hashResolution * (vAdd.x - this.vBoxMin.x) / (this.vBoxMax.x + oneHynberes - this.vBoxMin.x));
    const iy = Math.floor(hashResolution * (vAdd.y - this.vBoxMin.y) / (this.vBoxMax.y + oneHynberes - this.vBoxMin.y));
    const iz = Math.floor(hashResolution * (vAdd.z - this.vBoxMin.z) / (this.vBoxMax.z + oneHynberes - this.vBoxMin.z));
    let iHash = ix * n815851 + iz * n37633 + iy * n2453543;
    iHash &= (HASH_SIZE - 1);
    const hLineIndex = iHash + iHash;

    // search vertex via hash
    // search in hash list
    if (this.vBoxMin !== null && this.vBoxMax !== null) {
      for (entry = this.hashLines[hLineIndex + 1]; entry >= 0; entry = this.hashEntries[entry * 2 + 1]) {
        const ind = this.hashEntries[entry * 2 + 0]; // vertex index
        v.copy(geoOut._vertices[ind]);
        v.x -= vAdd.x;
        v.y -= vAdd.y;
        v.z -= vAdd.z;
        const dot2 = v.x * v.x + v.y * v.y + v.z * v.z;
        if (dot2 < r106) {
          return ind;
        } // if (found)
      } // for (entry)
    } // search

    // add new vertex to geometry
    if (geoOut._numVertices >= this.maxNumVertices) {
      return 0 - 1;
    }

    const iVertAdd = geoOut._numVertices;
    geoOut._vertices[iVertAdd].copy(vAdd);

    // add to hash
    if (this.vBoxMin !== null && this.vBoxMax !== null) {
      entry = this.getNewHashEntry();
      if (entry < 0) {
        return 0 - 1;
      }
      const entryFirst = this.hashLines[hLineIndex + 1];
      this.hashLines[hLineIndex + 1] = entry;
      this.hashEntries[entry * 2 + 0] = iVertAdd;
      this.hashEntries[entry * 2 + 1] = entryFirst;

      this.hashLines[hLineIndex + 0]++; // num vertices in line ++
    }
    geoOut._numVertices++;
    return iVertAdd;
  }

  /**
   *
   * @param {number} side some placeholder description
   * @param {number} probeSphereRadius some placeholder description
   * @param {object} vBoxMin some placeholder description
   * @param {object} vBoxMax some placeholder description
   * @param {object} geoOut some placeholder description
   * @param {object} corners some placeholder description
   * @returns {number} always 0
   */
  modifyExcludedFromGeo(
    side,
    probeSphereRadius,
    vBoxMin,
    vBoxMax,
    geoOut,
    corners,
  ) {
    let ind;
    let distToSphere;
    let distToBorder;
    const r11 = 1.1;

    function innerBlockWorkAround() {
      if (distToBorder > 0.0) {
        // point is inside probe sphere
        if (corners[ind] < 0.0) {
          corners[ind] = distToBorder; // was inside surface, now is oustide ( > 0)
        }
        if (distToBorder > corners[ind]) {
          corners[ind] = distToBorder; // find positive maximum
        }
      } else if (distToBorder > corners[ind]) { // point is outside sphere
        corners[ind] = distToBorder; // find negative maximum
      }
    }

    const side2 = side * side;
    const xScale = (side - 1) / (vBoxMax.x - vBoxMin.x);
    const yScale = (side - 1) / (vBoxMax.y - vBoxMin.y);
    const zScale = (side - 1) / (vBoxMax.z - vBoxMin.z);

    const probeSpRad2 = (probeSphereRadius * 2) * (probeSphereRadius * 2);
    const sideInv = 1.0 / (side - 1);

    for (let i = 0; i < geoOut._numVertices; i++) {
      const vCenter = geoOut._vertices[i];

      const radEst = probeSphereRadius * r11;

      let indXMin = Math.floor(((vCenter.x - radEst) - vBoxMin.x) * xScale);
      let indYMin = Math.floor(((vCenter.y - radEst) - vBoxMin.y) * yScale);
      let indZMin = Math.floor(((vCenter.z - radEst) - vBoxMin.z) * zScale);

      let indXMax = Math.floor(((vCenter.x + radEst) - vBoxMin.x) * xScale);
      let indYMax = Math.floor(((vCenter.y + radEst) - vBoxMin.y) * yScale);
      let indZMax = Math.floor(((vCenter.z + radEst) - vBoxMin.z) * zScale);

      indXMin = (indXMin >= 0) ? indXMin : 0;
      indYMin = (indYMin >= 0) ? indYMin : 0;
      indZMin = (indZMin >= 0) ? indZMin : 0;
      indXMax = (indXMax <= (side - 1)) ? indXMax : (side - 1);
      indYMax = (indYMax <= (side - 1)) ? indYMax : (side - 1);
      indZMax = (indZMax <= (side - 1)) ? indZMax : (side - 1);

      for (let iy = indYMin; iy <= indYMax; iy++) {
        const indY = iy * side2;
        for (let iz = indZMin; iz <= indZMax; iz++) {
          const indZ = iz * side;
          for (let ix = indXMin; ix <= indXMax; ix++) {
            ind = indY + indZ + ix;
            // getCornerCoord(vBoxMin, vBoxMax, ix, iy, iz, side, &vCorner);
            let t = ix * sideInv;
            const xCorner = vBoxMin.x * (1.0 - t) + vBoxMax.x * t;
            t = iy * sideInv;
            const yCorner = vBoxMin.y * (1.0 - t) + vBoxMax.y * t;
            t = iz * sideInv;
            const zCorner = vBoxMin.z * (1.0 - t) + vBoxMax.z * t;

            const dx = xCorner - vCenter.x;
            const dy = yCorner - vCenter.y;
            const dz = zCorner - vCenter.z;
            const dist2 = dx * dx + dy * dy + dz * dz;
            if (dist2 < probeSpRad2) {
              distToSphere = Math.sqrt(dist2);
              distToBorder = -(distToSphere - probeSphereRadius);
              innerBlockWorkAround();
            } // if (dist from corner point to sphere center more 2 radiuses)
          } // for (ix)
        } // for (iz)
      } // for (iy)
    } // for (i) all geo vertices
    return 0;
  }

  _innerBuild() {
    let ok;
    const expandFactor = 1.2;

    // performance test
    // this.performanceTest();

    // Create temporary atoms (but colored)
    const packedArrays = {
      posRad: this._posRad,
      colors: this._colors,
      atoms: this._opts.atoms,
    };
    this.complex = this._opts.parent;
    this.atoms = packedArrays.atoms;
    this.meshResolution = this._opts.gridSpacing;
    this.atomRadiusScale = this._opts.radScale;
    this.colorMode = this._opts.colorMode;
    this.probeRadius = this._opts.probeRadius;
    this.useVertexColors = true;
    this.excludeProbe = this._opts.excludeProbe;
    this.visibilitySelector = this._opts.visibilitySelector;

    this.geoOut = null;

    this.hashLines = null;
    this.hashEntries = null;
    this.numHashEtriesAllocated = 0;
    this.numHashEntryIndex = 0;
    this.maxNumVertices = 0;
    this.maxNumTriangles = 0;

    const atomsColored = new Array(this.atoms.length);
    this.convertToAtomsColored(packedArrays, atomsColored);

    // find bbox for spheres scene
    const vBoxMin = this.vBoxMin = new THREE.Vector3();
    const vBoxMax = this.vBoxMax = new THREE.Vector3();
    this.getBoundingBox(atomsColored, vBoxMin, vBoxMax);

    const marCubeResoultion = this.marCubeResoultion = this.meshResolution * (2 + 2);

    // build grid corners for Marching cube algorithm
    const side = marCubeResoultion;
    const side2 = side * side;
    const side3 = side2 * side;
    const corners = utils.allocateTyped(Float32Array, side3);
    const rProbeRadius = this.probeRadius * this.atomRadiusScale;

    this.calculateGridCorners(corners, side, vBoxMin, vBoxMax, atomsColored, rProbeRadius);

    const numCells = marCubeResoultion - 1;
    const cube = new IsoSurfaceMarchCube();
    ok = cube.create(numCells);
    if (ok < 0) {
      return ok;
    }
    // copy corners to cells
    const vCellStep = new THREE.Vector3();
    vCellStep.x = (vBoxMax.x - vBoxMin.x) / numCells;
    vCellStep.y = (vBoxMax.y - vBoxMin.y) / numCells;
    vCellStep.z = (vBoxMax.z - vBoxMin.z) / numCells;

    let numIntersectedCellsEstim = this.getNumIntersectedCells(side, numCells, corners, cube);
    let maxNumVertices = Math.floor(numIntersectedCellsEstim * expandFactor);
    let maxNumTriangles = Math.floor(numIntersectedCellsEstim * expandFactor * 2);

    this.geoOut = new IsoSurfaceGeo(maxNumVertices, maxNumTriangles, this.useVertexColors);

    ok = this.createVertexHash(maxNumVertices, maxNumTriangles);
    if (ok < 0) {
      return ok;
    }

    // build voxel world (used to check triangle-to-atom tie and to calculate normals and colors)
    let probeRadForNormalsColors = rProbeRadius;
    if (this.excludeProbe) {
      probeRadForNormalsColors = 0.01;
    }
    this.voxelWorld = new IsosurfaceBuildNormals(
      atomsColored.length,
      atomsColored,
      vBoxMin,
      vBoxMax,
      probeRadForNormalsColors,
    );
    this.voxelWorld.createVoxels();

    ok = this.buildGeoFromCorners(marCubeResoultion, vBoxMin, vBoxMax, corners, vCellStep, cube);
    if (this.excludeProbe) {
      // using 3d mesh (geoOut) as a surface points
      // move probe sphere and try to minimuze corners values
      this.modifyExcludedFromGeo(side, rProbeRadius, vBoxMin, vBoxMax, this.geoOut, corners);

      // delete old builded geo
      this.geoOut._vertices = null;
      this.geoOut._colors = null;
      this.geoOut._indices = null;
      this.geoOut._normals = null;
      this.geoOut._numVertices = 0;
      this.geoOut._numTriangles = 0;
      this.geoOut = null;

      // estimage geo vertices budget again
      numIntersectedCellsEstim = this.getNumIntersectedCells(side, numCells, corners, cube);
      maxNumVertices = Math.floor(numIntersectedCellsEstim * expandFactor);
      maxNumTriangles = Math.floor(numIntersectedCellsEstim * expandFactor * 2);

      // creates empty new geometry
      this.geoOut = new IsoSurfaceGeo(maxNumVertices, maxNumTriangles, this.useVertexColors);
      ok = this.createVertexHash(maxNumVertices, maxNumTriangles);
      if (ok < 0) {
        return ok;
      }
      // build vertices and triangles from corners values
      ok = this.buildGeoFromCorners(side, vBoxMin, vBoxMax, corners, vCellStep, cube);
    }

    // build vertex normals
    this.voxelWorld.buildNormals(this.geoOut._vertices.length, this.geoOut._vertices, this.geoOut._normals);
    // More value : more smooth color mixing
    // value about 0.7: very rough colors borders
    let radiusColorSmoothness = 6.5;
    if (this.excludeProbe) {
      radiusColorSmoothness -= 1.5;
    }
    if (this.useVertexColors) {
      this.voxelWorld.buildColors(
        this.geoOut._vertices.length,
        this.geoOut._vertices,
        this.geoOut._colors,
        radiusColorSmoothness,
      );
    }
    this.voxelWorld.destroyVoxels();
    this.voxelWorld = null;

    // remove objects
    cube.destroy();

    return ok;
  }
}

// All code below must be erased from every device and each developer's memory

export default SSIsosurfaceGeometry;
