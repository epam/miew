import * as THREE from 'three';
import IsoSurfaceMarchCube from './IsoSurfaceMarchCube';
import utils from '../../utils';

const edgeTable = [
  0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
  0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
  0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
  0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
  0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
  0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
  0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac,
  0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
  0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c,
  0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
  0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc,
  0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
  0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c,
  0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
  0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
  0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
  0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
  0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
  0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
  0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
  0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
  0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
  0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
  0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
  0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
  0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
  0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
  0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
  0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
  0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
  0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
  0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0];

function _voxelGradientFast(v, point, grad) {
  const g = v.getValue(point.x, point.y, point.z);
  grad.set(g[0], g[1], g[2]);
}

// Helper class GridCell
class GridCell {
  constructor() {
    this._arrSize = 8;
    this.p = new Array(this._arrSize);
    this.g = new Array(this._arrSize);
    this.val = new Array(this._arrSize);
    for (let i = 0; i < this._arrSize; ++i) {
      this.p[i] = new THREE.Vector3();
      this.g[i] = new THREE.Vector3();
    }
    this.cubeIndex = 0;
  }
}

// Helper class Triangle
class Triangle {
  constructor() {
    this.a = {
      p: new THREE.Vector3(),
      n: new THREE.Vector3(),
    };

    this.b = {
      p: new THREE.Vector3(),
      n: new THREE.Vector3(),
    };

    this.c = {
      p: new THREE.Vector3(),
      n: new THREE.Vector3(),
    };
  }
}

function createArray(arrSize) {
  const arr = new Array(arrSize);
  for (let i = 0; i < arrSize; ++i) {
    arr[i] = new THREE.Vector3();
  }

  return arr;
}

class IsoSurface {
  constructor() {
    this._numTriangles = 0;
    this._numVertices = 0;
    this._position = [];
    this._normals = [];
    this._colors = null;
    this._indices = [];
    this._volumetricData = null;
    this._xAxis = new THREE.Vector3();
    this._yAxis = new THREE.Vector3();
    this._zAxis = new THREE.Vector3();
    this._xDir = new THREE.Vector3();
    this._yDir = new THREE.Vector3();
    this._zDir = new THREE.Vector3();
  }

  _prepareAxesAndDirs() {
    const volData = this._volumetricData;

    const cellSize = volData.getCellSize();

    // calculate cell axes
    const xAxis = this._xAxis;
    const yAxis = this._yAxis;
    const zAxis = this._zAxis;
    const xDir = this._xDir;
    const yDir = this._yDir;
    const zDir = this._zDir;

    xAxis.set(cellSize.x, 0, 0);
    yAxis.set(0, cellSize.y, 0);
    zAxis.set(0, 0, cellSize.z);

    xDir.set(1, 0, 0);
    yDir.set(0, 1, 0);
    zDir.set(0, 0, 1);

    // flip normals if coordinate system is in the wrong handedness
    const tmp = new THREE.Vector3();
    tmp.crossVectors(xDir, yDir);
    if (tmp.dot(zDir) < 0) {
      xDir.negate();
      yDir.negate();
      zDir.negate();
    }

    // check that the grid is in the all-positive octant of the coordinate system
    if (xDir.x < 0 || xDir.y < 0 || xDir.z < 0
      || yDir.x < 0 || yDir.y < 0 || yDir.z < 0
      || zDir.x < 0 || zDir.y < 0 || zDir.z < 0) {
      return false;
    }

    // check that the grid is axis-aligned
    const notZero = (axe) => Math.abs(axe) > Number.EPSILON;
    return !(notZero(xAxis.y) || notZero(xAxis.z)
          || notZero(yAxis.x) || notZero(yAxis.z)
          || notZero(zAxis.x) || notZero(zAxis.y));
  }

  _vertexInterp(isoLevel, grid, ind1, ind2, vertex, normal) {
    const p1 = grid.p[ind1];
    const p2 = grid.p[ind2];
    const n1 = grid.g[ind1];
    const n2 = grid.g[ind2];
    const valP1 = grid.val[ind1];
    const valP2 = grid.val[ind2];
    const isoDiffP1 = isoLevel - valP1;
    const diffValP2P1 = valP2 - valP1;

    let mu = 0.0;

    if (Math.abs(diffValP2P1) > 0.0) {
      mu = isoDiffP1 / diffValP2P1;
    }
    mu = mu > 1.0 ? 1.0 : mu;
    vertex.lerpVectors(p1, p2, mu);
    normal.lerpVectors(n1, n2, mu);
  }

  static _triTable = IsoSurfaceMarchCube.prototype.striIndicesMarchCube;

  static _arrSize = 12;

  static _firstIndices = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3];

  static _secondIndices = [1, 2, 3, 0, 5, 6, 7, 4, 4, 5, 6, 7];

  static _vertexList = createArray(IsoSurface._arrSize);

  static _normalList = createArray(IsoSurface._arrSize);

  _polygonize(grid, isoLevel, triangles) {
    const { cubeIndex } = grid;
    let i = 0;
    const arrSize = IsoSurface._arrSize;
    const firstIndices = IsoSurface._firstIndices;
    const secondIndices = IsoSurface._secondIndices;
    const vertexList = IsoSurface._vertexList;
    const normalList = IsoSurface._normalList;

    for (; i < arrSize; ++i) {
      if (edgeTable[cubeIndex] & (1 << i)) {
        this._vertexInterp(
          isoLevel,
          grid,
          firstIndices[i],
          secondIndices[i],
          vertexList[i],
          normalList[i],
        );
      }
    }

    let triCount = 0;
    const triTblIdx = cubeIndex * 16;
    const triTable = IsoSurface._triTable;

    for (i = 0; triTable[triTblIdx + i] !== -1; i += 3) {
      triangles[triCount].a.p.copy(vertexList[triTable[triTblIdx + i]]);
      triangles[triCount].a.n.copy(normalList[triTable[triTblIdx + i]]);

      triangles[triCount].b.p.copy(vertexList[triTable[triTblIdx + i + 1]]);
      triangles[triCount].b.n.copy(normalList[triTable[triTblIdx + i + 1]]);

      triangles[triCount].c.p.copy(vertexList[triTable[triTblIdx + i + 2]]);
      triangles[triCount].c.n.copy(normalList[triTable[triTblIdx + i + 2]]);
      ++triCount;
    }

    return triCount;
  }

  _doGridPosNorms(isoValue, step, appendSimple) {
    const vol = this._volumetricData;
    const volData = this._volumetricData.getData();
    const dim = vol.getDimensions();
    const xSize = dim[0];
    const ySize = dim[1];
    const zSize = dim[2];
    const stepX = step * vol.getStrideX();
    const stepY = step * vol.getStrideY();
    const stepZ = step * vol.getStrideZ();

    const gc = new GridCell();
    const gcVal = gc.val;
    const gcValSize = gc.val.length;
    const additions = [
      new THREE.Vector3(0, 0, 0), // 0
      new THREE.Vector3(step, 0, 0), // 1
      new THREE.Vector3(step, step, 0), // 2
      new THREE.Vector3(0, step, 0), // 3
      new THREE.Vector3(0, 0, step), // 4
      new THREE.Vector3(step, 0, step), // 5
      new THREE.Vector3(step, step, step), // 6
      new THREE.Vector3(0, step, step), // 7
    ];

    const tmpTriCount = 5;
    const triangles = new Array(tmpTriCount);
    for (let j = 0; j < tmpTriCount; ++j) {
      triangles[j] = new Triangle();
    }

    let appendVertex;
    const self = this;
    const positions = this._position;
    const normals = this._normals;
    if (appendSimple) {
      // Special case for axis-aligned grid with positive unit vector normals
      appendVertex = (function () {
        const axis = new THREE.Vector3(self._xAxis.x, self._yAxis.y, self._zAxis.z);
        return function (triVertex) {
          const vertex = triVertex.p.clone();
          vertex.multiply(axis);
          positions.push(vertex.add(self._origin));
          normals.push(triVertex.n.clone());
        };
      }());
    } else {
      appendVertex = (function () {
        const posMtx = new THREE.Matrix3();
        posMtx.set(
          self._xAxis.x,
          self._yAxis.x,
          self._zAxis.x,
          self._xAxis.y,
          self._yAxis.y,
          self._zAxis.y,
          self._xAxis.z,
          self._yAxis.z,
          self._zAxis.z,
        );
        const normMtx = new THREE.Matrix3();
        normMtx.set(
          self._xDir.x,
          self._yDir.x,
          self._zDir.x,
          self._xDir.y,
          self._yDir.y,
          self._zDir.y,
          self._xDir.z,
          self._yDir.z,
          self._zDir.z,
        );

        return function (triVertex) {
          positions.push(triVertex.p.clone().applyMatrix3(posMtx).add(self._origin));
          normals.push(triVertex.n.clone().applyMatrix3(normMtx));
        };
      }());
    }
    const indices = this._indices;

    let globTriCount = 0;

    for (let z = 0; z < (zSize - step); z += step) {
      for (let y = 0; y < (ySize - step); y += step) {
        let idx = vol.getDirectIdx(0, y, z);
        for (let x = 0; x < (xSize - step); x += step, idx += stepX) {
          /* eslint-disable no-multi-spaces */
          /* eslint-disable computed-property-spacing */
          gcVal[0] = volData[idx];
          gcVal[1] = volData[idx + stepX];
          gcVal[3] = volData[idx + stepY];
          gcVal[2] = volData[idx + stepX + stepY];
          gcVal[4] = volData[idx + stepZ];
          gcVal[5] = volData[idx + stepX + stepZ];
          gcVal[7] = volData[idx + stepY + stepZ];
          gcVal[6] = volData[idx + stepX + stepY + stepZ];
          /* eslint-enable no-multi-spaces */
          /* eslint-enable computed-property-spacing */

          // Determine the index into the edge table which
          // tells us which vertices are inside of the surface
          let cubeIndex = 0;
          let i = 0;
          for (; i < gcValSize; ++i) {
            if (gcVal[i] < isoValue) {
              cubeIndex |= (1 << i);
            }
          }

          if (edgeTable[cubeIndex] === 0) {
            continue;
          }

          gc.cubeIndex = cubeIndex;
          for (i = 0; i < gcValSize; ++i) {
            gc.p[i].set(x + additions[i].x, y + additions[i].y, z + additions[i].z);
            _voxelGradientFast(this._gradient, gc.p[i], gc.g[i]);
          }

          // calculate vertices and facets for this cube,
          // calculate normals by interpolating between the negated
          // normalized volume gradients for the 8 reference voxels
          const triCount = this._polygonize(gc, isoValue, triangles);
          globTriCount += triCount;

          // append triangles using different techniques
          for (i = 0; i < triCount; ++i) {
            indices.push(this._numTriangles * 3);
            indices.push(this._numTriangles * 3 + 1);
            indices.push(this._numTriangles * 3 + 2);
            ++this._numTriangles;

            appendVertex(triangles[i].a);
            appendVertex(triangles[i].b);
            appendVertex(triangles[i].c);
          }
        }
      }
    }

    return globTriCount;
  }

  compute(volData, origin, isoValue, step) {
    this._volumetricData = volData;
    this._origin = origin;

    this._gradient = volData.computeGradient();

    this._doGridPosNorms(isoValue, step, this._prepareAxesAndDirs());
  }

  _remapIndices(vertexMap, idcCount) {
    const indices = this._indices;
    const newIndices = utils.allocateTyped(Uint32Array, idcCount);
    for (let i = 0; i < idcCount; ++i) {
      indices[i] = vertexMap[indices[i]];
      newIndices[i] = indices[i];
    }
    this._indices = newIndices;
  }

  _remapVertices(vertices, normals, count) {
    const newPositions = utils.allocateTyped(Float32Array, count * 3);
    const newNormals = utils.allocateTyped(Float32Array, count * 3);
    for (let i = 0; i < count; ++i) {
      const pos = vertices[i];
      newPositions[i * 3] = pos.x;
      newPositions[i * 3 + 1] = pos.y;
      newPositions[i * 3 + 2] = pos.z;
      const norm = normals[i].normalize();
      newNormals[i * 3] = norm.x;
      newNormals[i * 3 + 1] = norm.y;
      newNormals[i * 3 + 2] = norm.z;
    }
    this._position = newPositions;
    this._normals = newNormals;
  }

  vertexFusion(offset, len) {
    const faceVer = this._indices.length;
    const vertices = this._position;
    const normals = this._normals;
    const oldVerCount = vertices.length | 0;
    if (faceVer === 0 || oldVerCount === 0) {
      return;
    }
    const vMap = utils.allocateTyped(Uint32Array, oldVerCount);
    vMap[0] = 0;
    let newVer = 1;

    let i = 1;
    for (; i < oldVerCount; ++i) {
      const start = newVer - offset < 0 ? 0 : newVer - offset;
      const end = start + len > newVer ? newVer : start + len;
      let matchedIndex = -1;

      for (let j = start; j < end; ++j) {
        if (Math.abs(vertices[i] - vertices[j]) < Number.EPSILON) {
          matchedIndex = j;
          break;
        }
      }

      if (matchedIndex !== -1) {
        vMap[i] = matchedIndex;
      } else {
        vertices[newVer].copy(vertices[i]);
        normals[newVer].copy(normals[i]);
        vMap[i] = newVer;
        ++newVer;
      }
    }

    this._remapIndices(vMap, faceVer);
    this._remapVertices(vertices, normals, newVer);
  }

  // Assign per-vertex colors from a volumetric texture map (same dimensions as the original volumetric data).
  // Along with color dominating atom is determined for each vertex
  // and vertices with atom out of "visible" subset get filtered out.
  // XXX only handles orthogonal volumes currently
  setColorVolTex(colorMap, atomMap, atomWeightMap, visibilitySelector) {
    let i;
    let idx;
    const numVerts = this._position.length / 3;
    const vertices = this._position;
    const origin = this._origin;
    const dim = this._volumetricData.getDimensions();
    const xs = dim[0] - 1;
    const ys = dim[1] - 1;
    const zs = dim[2] - 1;

    const colorData = colorMap.getData();
    const strideX = colorMap.getStrideX();
    const strideY = colorMap.getStrideY();
    const strideZ = colorMap.getStrideZ();

    let atomWeightData;
    let atomStrideX;
    let atomStrideY;
    let atomStrideZ;

    if (visibilitySelector !== null) {
      atomWeightData = atomWeightMap.getData();
      atomStrideX = atomWeightMap.getStrideX();
      atomStrideY = atomWeightMap.getStrideY();
      atomStrideZ = atomWeightMap.getStrideZ();
    }

    const xInv = 1.0 / this._xAxis.x;
    const yInv = 1.0 / this._yAxis.y;
    const zInv = 1.0 / this._zAxis.z;

    let atomLookup = [];
    let atomWeights = [];
    const colors = utils.allocateTyped(Float32Array, numVerts * 3);

    function interp(mu, idx1, idx2, c) {
      c[0] = (1 - mu) * colorData[idx1] + mu * colorData[idx2];
      c[1] = (1 - mu) * colorData[idx1 + 1] + mu * colorData[idx2 + 1];
      c[2] = (1 - mu) * colorData[idx1 + 2] + mu * colorData[idx2 + 2];
    }

    function collectWeight(ai, coefX, coefY, coefZ) {
      const a = atomMap[ai]; // atomWeightMap is a scalar field, so index into atom map should be the same
      if (a != null) {
        atomLookup[a.index] = a;
        const w = coefX * coefY * coefZ * atomWeightData[ai];
        if (typeof atomWeights[a.index] === 'undefined') {
          atomWeights[a.index] = w;
        } else {
          atomWeights[a.index] += w;
        }
      }
    }

    const vMap = utils.allocateTyped(Int32Array, numVerts);
    let newVerCount = 0;

    for (i = 0; i < numVerts; i++) {
      const ind = i * 3;
      const vx = (vertices[ind] - origin.x) * xInv;
      const vy = (vertices[ind + 1] - origin.y) * yInv;
      const vz = (vertices[ind + 2] - origin.z) * zInv;
      const x = Math.min(Math.max(vx, 0), xs) | 0;
      const y = Math.min(Math.max(vy, 0), ys) | 0;
      const z = Math.min(Math.max(vz, 0), zs) | 0;

      const mux = (vx - x);
      const muy = (vy - y);
      const muz = (vz - z);

      if (visibilitySelector != null) {
        // collect atom weights
        atomLookup = [];
        atomWeights = [];
        idx = atomWeightMap.getDirectIdx(x, y, z);
        collectWeight(idx, 1 - mux, 1 - muy, 1 - muz);
        collectWeight(idx + atomStrideX, mux, 1 - muy, 1 - muz);
        collectWeight(idx + atomStrideY, 1 - mux, muy, 1 - muz);
        collectWeight(idx + atomStrideX + atomStrideY, mux, muy, 1 - muz);
        collectWeight(idx + atomStrideZ, 1 - mux, 1 - muy, muz);
        collectWeight(idx + atomStrideX + atomStrideZ, mux, 1 - muy, muz);
        collectWeight(idx + atomStrideY + atomStrideZ, 1 - mux, muy, muz);
        collectWeight(idx + atomStrideX + atomStrideY + atomStrideZ, mux, muy, muz);

        // find dominant atom
        let maxWeight = 0.0;
        let dominantIdx = -1;
        for (const atomIdx in atomWeights) {
          if (atomWeights[atomIdx] > maxWeight) {
            dominantIdx = atomIdx;
            maxWeight = atomWeights[atomIdx];
          }
        }

        if (dominantIdx < 0 || !visibilitySelector.includesAtom(atomLookup[dominantIdx])) {
          // this vertex doesn't belong to visible subset and will be skipped
          vMap[i] = -1;
          continue;
        }
      }

      vMap[i] = newVerCount++;

      // color tri-linear interpolation
      const dx = (x < xs) ? strideX : 0;
      const dy = (y < ys) ? strideY : 0;
      const dz = (z < zs) ? strideZ : 0;

      const c0 = [0, 0, 0];
      const c1 = [0, 0, 0];
      const c2 = [0, 0, 0];
      const c3 = [0, 0, 0];

      idx = colorMap.getDirectIdx(x, y, z);
      interp(mux, idx, idx + dx, c0);
      interp(mux, idx + dy, idx + dx + dy, c1);
      interp(mux, idx + dz, idx + dx + dz, c2);
      interp(mux, idx + dy + dz, idx + dx + dy + dz, c3);

      const cz0 = [0, 0, 0];
      cz0[0] = (1 - muy) * c0[0] + muy * c1[0];
      cz0[1] = (1 - muy) * c0[1] + muy * c1[1];
      cz0[2] = (1 - muy) * c0[2] + muy * c1[2];

      const cz1 = [0, 0, 0];
      cz1[0] = (1 - muy) * c2[0] + muy * c3[0];
      cz1[1] = (1 - muy) * c2[1] + muy * c3[1];
      cz1[2] = (1 - muy) * c2[2] + muy * c3[2];

      colors[ind] = (1 - muz) * cz0[0] + muz * cz1[0];
      colors[ind + 1] = (1 - muz) * cz0[1] + muz * cz1[1];
      colors[ind + 2] = (1 - muz) * cz0[2] + muz * cz1[2];
    }
    this._colors = colors;

    if (visibilitySelector != null) {
      // shift visible vertices towards beginning of array
      for (i = 0; i < numVerts; ++i) {
        const j = vMap[i];
        if (j < 0) {
          continue;
        }

        // assert: j <= i
        this._position[j * 3] = this._position[i * 3];
        this._position[j * 3 + 1] = this._position[i * 3 + 1];
        this._position[j * 3 + 2] = this._position[i * 3 + 2];
        this._normals[j * 3] = this._normals[i * 3];
        this._normals[j * 3 + 1] = this._normals[i * 3 + 1];
        this._normals[j * 3 + 2] = this._normals[i * 3 + 2];
        this._colors[j * 3] = this._colors[i * 3];
        this._colors[j * 3 + 1] = this._colors[i * 3 + 1];
        this._colors[j * 3 + 2] = this._colors[i * 3 + 2];
      }

      // rebuild index list
      const numTriangles = this._indices.length / 3;
      let newTriCount = 0;
      for (i = 0; i < numTriangles; ++i) {
        const i0 = vMap[this._indices[3 * i]];
        const i1 = vMap[this._indices[3 * i + 1]];
        const i2 = vMap[this._indices[3 * i + 2]];
        if (i0 >= 0 && i1 >= 0 && i2 >= 0) {
          this._indices[3 * newTriCount] = i0;
          this._indices[3 * newTriCount + 1] = i1;
          this._indices[3 * newTriCount + 2] = i2;
          ++newTriCount;
        }
      }

      // shrink arrays to data size
      this._position = new Float32Array(this._position.buffer.slice(0, newVerCount * 3 * 4));
      this._normals = new Float32Array(this._normals.buffer.slice(0, newVerCount * 3 * 4));
      this._colors = new Float32Array(this._colors.buffer.slice(0, newVerCount * 3 * 4));
      this._indices = new Uint32Array(this._indices.buffer.slice(0, newTriCount * 3 * 4));
    }
  }

  toMesh() {
    const geo = new THREE.BufferGeometry();
    geo.setIndex(new THREE.BufferAttribute(this._indices, 1));
    geo.setAttribute('position', new THREE.BufferAttribute(this._position, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(this._normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this._colors, 3));
    geo.computeBoundingSphere();
    return geo;
  }
}
export default IsoSurface;
