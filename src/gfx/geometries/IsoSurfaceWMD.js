

import * as THREE from 'three';
import IsoSurfaceMarchCube from './IsoSurfaceMarchCube';
import utils from '../../utils';
var edgeTable = [
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
  var g = v.getValue(point.x, point.y, point.z);
  grad.set(g[0], g[1], g[2]);
}

// Helper class GridCell
function GridCell() {
  this._arrSize = 8;
  this.p = new Array(this._arrSize);
  this.g = new Array(this._arrSize);
  this.val = new Array(this._arrSize);
  for (var i = 0; i < this._arrSize; ++i) {
    this.p[i] = new THREE.Vector3();
    this.g[i] = new THREE.Vector3();
  }
  this.cubeIndex = 0;
}

GridCell.prototype.constructor = GridCell;

// Helper class Triangle
function Triangle() {
  this.a = {
    p: new THREE.Vector3(),
    n: new THREE.Vector3()
  };

  this.b = {
    p: new THREE.Vector3(),
    n: new THREE.Vector3()
  };

  this.c = {
    p: new THREE.Vector3(),
    n: new THREE.Vector3()
  };
}

Triangle.prototype.constructor = Triangle;


function IsoSurface() {
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

IsoSurface.prototype.constructor = IsoSurface;

IsoSurface.prototype._prepareAxesAndDirs = function() {
  var volData = this._volumetricData;

  var cellSize = volData.getCellSize();

  // calculate cell axes
  var xAxis = this._xAxis;
  var yAxis = this._yAxis;
  var zAxis = this._zAxis;
  var xDir = this._xDir;
  var yDir = this._yDir;
  var zDir = this._zDir;
  //    volData.cellAxes(xAxis, yAxis, zAxis);
  //    volData.cellDirs(xDir, yDir, zDir);

  xAxis.set(cellSize.x, 0, 0);
  yAxis.set(0, cellSize.y, 0);
  zAxis.set(0, 0, cellSize.z);

  xDir.set(1, 0, 0);
  yDir.set(0, 1, 0);
  zDir.set(0, 0, 1);

  // flip normals if coordinate system is in the wrong handedness
  var tmp = new THREE.Vector3();
  tmp.crossVectors(xDir, yDir);
  if (tmp.dot(zDir) < 0) {
    xDir.negate();
    yDir.negate();
    zDir.negate();
  }

  // check that the grid is in the all-positive octant of the coordinate system
  if (xDir.x < 0 || xDir.y < 0 || xDir.z < 0 ||
        yDir.x < 0 || yDir.y < 0 || yDir.z < 0 ||
        zDir.x < 0 || zDir.y < 0 || zDir.z < 0) {
    return false;
  }

  // check that the grid is axis-aligned
  // TODO This is a VMD way. Is it correct in our case to compare with floating zero?
  return !(xAxis.y !== 0 || xAxis.z !== 0 ||
             yAxis.x !== 0 || yAxis.z !== 0 ||
             zAxis.x !== 0 || zAxis.y !== 0);
};

IsoSurface.prototype._vertexInterp = function(isoLevel, grid, ind1, ind2, vertex, normal) {
  var p1 = grid.p[ind1];
  var p2 = grid.p[ind2];
  var n1 = grid.g[ind1];
  var n2 = grid.g[ind2];
  var valP1 = grid.val[ind1];
  var valP2 = grid.val[ind2];
  var isoDiffP1   = isoLevel - valP1;
  var diffValP2P1 = valP2 - valP1;

  var mu = 0.0;

  if (Math.abs(diffValP2P1) > 0.0) {
    mu = isoDiffP1 / diffValP2P1;
  }
  mu = mu > 1.0 ? 1.0 : mu;
  vertex.lerpVectors(p1, p2, mu);
  normal.lerpVectors(n1, n2, mu);
};

IsoSurface.prototype._polygonize = (function() {
  var triTable = IsoSurfaceMarchCube.prototype.striIndicesMarchCube;
  var arrSize = 12;
  var firstIndices = [0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3];
  var secondIndices = [1, 2, 3, 0, 5, 6, 7, 4, 4, 5, 6, 7];
  var vertexList = new Array(arrSize);
  var normalList = new Array(arrSize);
  var i = 0;
  for (; i < arrSize; ++i) {
    vertexList[i] = new THREE.Vector3();
    normalList[i] = new THREE.Vector3();
  }
  return function(grid, isoLevel, triangles) {
    var cubeIndex = grid.cubeIndex;
    for (i = 0; i < arrSize; ++i) {
      if (edgeTable[cubeIndex] & (1 << i)) {
        this._vertexInterp(isoLevel, grid, firstIndices[i], secondIndices[i], vertexList[i], normalList[i]);
      }
    }

    var triCount = 0;
    var triTblIdx = cubeIndex * 16;
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
  };
}());

IsoSurface.prototype._doGridPosNorms = function(isoValue, step, appendSimple) {
  var vol = this._volumetricData;
  var volData = this._volumetricData.getData();
  var dim = vol.getDimensions();
  var xSize = dim[0];
  var ySize = dim[1];
  var zSize = dim[2];
  var stepX = step * vol.getStrideX();
  var stepY = step * vol.getStrideY();
  var stepZ = step * vol.getStrideZ();

  var gc = new GridCell();
  var gcVal = gc.val;
  var gcValSize = gc.val.length;
  var additions = [
    new THREE.Vector3(0, 0, 0), // 0
    new THREE.Vector3(step, 0, 0), // 1
    new THREE.Vector3(step, step, 0), // 2
    new THREE.Vector3(0, step, 0), // 3
    new THREE.Vector3(0, 0, step), // 4
    new THREE.Vector3(step, 0, step), // 5
    new THREE.Vector3(step, step, step), // 6
    new THREE.Vector3(0, step, step)// 7
  ];

  var tmpTriCount = 5;
  var triangles = new Array(tmpTriCount);
  for (var j = 0; j < tmpTriCount; ++j) {
    triangles[j] = new Triangle();
  }


  var appendVertex;
  var self = this;
  var positions = this._position;
  var normals = this._normals;
  if (appendSimple) {
    // Special case for axis-aligned grid with positive unit vector normals
    appendVertex = (function() {
      var axis = new THREE.Vector3(self._xAxis.x, self._yAxis.y, self._zAxis.z);
      return function(triVertex) {
        var vertex = triVertex.p.clone();
        vertex.multiply(axis);
        positions.push(vertex.add(self._origin));
        normals.push(triVertex.n.clone());
      };
    }());
  } else {
    appendVertex = (function() {
      var posMtx = new THREE.Matrix3();
      posMtx.set(
        self._xAxis.x, self._yAxis.x, self._zAxis.x,
        self._xAxis.y, self._yAxis.y, self._zAxis.y,
        self._xAxis.z, self._yAxis.z, self._zAxis.z
      );
      var normMtx = new THREE.Matrix3();
      normMtx.set(
        self._xDir.x, self._yDir.x, self._zDir.x,
        self._xDir.y, self._yDir.y, self._zDir.y,
        self._xDir.z, self._yDir.z, self._zDir.z
      );

      return function(triVertex) {
        positions.push(triVertex.p.clone().applyMatrix3(posMtx).add(self._origin));
        normals.push(triVertex.n.clone().applyMatrix3(normMtx));
      };
    }());
  }
  var indices = this._indices;

  var globTriCount = 0;

  for (var z = 0; z < (zSize - step); z += step) {
    for (var y = 0; y < (ySize - step); y += step) {
      var idx = vol.getDirectIdx(0, y, z);
      for (var x = 0; x < (xSize - step); x += step, idx += stepX) {
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
        var cubeIndex = 0;
        var i = 0;
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
        var triCount = this._polygonize(gc, isoValue, triangles);
        globTriCount += triCount;

        //append triangles using different techniques
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
};

IsoSurface.prototype.compute = function(volData, origin, isoValue, step) {
  this._volumetricData = volData;
  this._origin = origin;

  this._gradient = volData.computeGradient();

  this._doGridPosNorms(isoValue, step, this._prepareAxesAndDirs());
};

IsoSurface.prototype._remapIndices = function(vertexMap, idcCount) {
  var indices = this._indices;
  var newIndices = utils.allocateTyped(Uint32Array, idcCount);
  for (var i = 0; i < idcCount; ++i) {
    indices[i] = vertexMap[indices[i]];
    newIndices[i] = indices[i];
  }
  this._indices = newIndices;
};

IsoSurface.prototype._remapVertices = function(vertices, normals, count) {
  var newPositions = utils.allocateTyped(Float32Array, count * 3);
  var newNormals = utils.allocateTyped(Float32Array, count * 3);
  for (var i = 0; i < count; ++i) {
    var pos = vertices[i];
    newPositions[i * 3] = pos.x;
    newPositions[i * 3 + 1] = pos.y;
    newPositions[i * 3 + 2] = pos.z;
    var norm = normals[i].normalize();
    newNormals[i * 3] = norm.x;
    newNormals[i * 3 + 1] = norm.y;
    newNormals[i * 3 + 2] = norm.z;
  }
  this._position = newPositions;
  this._normals = newNormals;
};

IsoSurface.prototype.vertexFusion = function(offset, len) {
  var faceVer = this._indices.length;
  var vertices = this._position;
  var normals = this._normals;
  var oldVerCount = vertices.length | 0;
  if (faceVer === 0 || oldVerCount === 0) {
    return;
  }
  var vMap = utils.allocateTyped(Uint32Array, oldVerCount);
  vMap[0] = 0;
  var newVer = 1;

  var i = 1;
  for (; i < oldVerCount; ++i) {
    var start = newVer - offset < 0 ? 0 : newVer - offset;
    var end = start + len > newVer ? newVer : start + len;
    var matchedIndex = -1;

    for (var j = start; j < end; ++j) {
      // TODO we are comparing floating number for exact match. What is wrong with us?
      if (vertices[i].equals(vertices[j])) {
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
};

/// Assign per-vertex colors from a volumetric texture map (same dimensions as the original volumetric data).
/// Along with color dominating atom is determined for each vertex
/// and vertices with atom out of "visible" subset get filtered out.
/// XXX only handles orthogonal volumes currently
IsoSurface.prototype.setColorVolTex = function(colorMap, atomMap, atomWeightMap, visibilitySelector) {
  var i, idx;
  var numVerts = this._position.length / 3;
  var vertices = this._position;
  var origin = this._origin;
  var dim = this._volumetricData.getDimensions();
  var xs = dim[0] - 1;
  var ys = dim[1] - 1;
  var zs = dim[2] - 1;

  var colorData = colorMap.getData();
  var strideX = colorMap.getStrideX();
  var strideY = colorMap.getStrideY();
  var strideZ = colorMap.getStrideZ();

  var atomWeightData;
  var atomStrideX;
  var atomStrideY;
  var atomStrideZ;

  if (visibilitySelector !== null) {
    atomWeightData = atomWeightMap.getData();
    atomStrideX = atomWeightMap.getStrideX();
    atomStrideY = atomWeightMap.getStrideY();
    atomStrideZ = atomWeightMap.getStrideZ();
  }

  var xInv = 1.0 / this._xAxis.x;
  var yInv = 1.0 / this._yAxis.y;
  var zInv = 1.0 / this._zAxis.z;

  var atomLookup = [];
  var atomWeights = [];
  var colors = utils.allocateTyped(Float32Array, numVerts * 3);

  function interp(mu, idx1, idx2, c) {
    c[0] = (1 - mu) * colorData[idx1]     + mu * colorData[idx2];
    c[1] = (1 - mu) * colorData[idx1 + 1] + mu * colorData[idx2 + 1];
    c[2] = (1 - mu) * colorData[idx1 + 2] + mu * colorData[idx2 + 2];
  }

  function collectWeight(ai, coefX, coefY, coefZ) {
    var a = atomMap[ai]; // atomWeightMap is a scalar field, so index into atom map should be the same
    if (a != null) {
      atomLookup[a._index] = a;
      var w = coefX * coefY * coefZ * atomWeightData[ai];
      if (typeof atomWeights[a._index] === 'undefined') {
        atomWeights[a._index] = w;
      } else {
        atomWeights[a._index] += w;
      }
    }
  }

  var vMap = utils.allocateTyped(Int32Array, numVerts);
  var newVerCount = 0;

  for (i = 0; i < numVerts; i++) {
    var ind = i * 3;
    var vx = (vertices[ind] - origin.x) * xInv;
    var vy = (vertices[ind + 1] - origin.y) * yInv;
    var vz = (vertices[ind + 2] - origin.z) * zInv;
    var x = Math.min(Math.max(vx, 0), xs) | 0;
    var y = Math.min(Math.max(vy, 0), ys) | 0;
    var z = Math.min(Math.max(vz, 0), zs) | 0;

    var mux = (vx - x);
    var muy = (vy - y);
    var muz = (vz - z);

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
      var maxWeight = 0.0;
      var dominantIdx = -1;
      for (var atomIdx in atomWeights) {
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
    var dx = (x < xs) ? strideX : 0;
    var dy = (y < ys) ? strideY : 0;
    var dz = (z < zs) ? strideZ : 0;

    var c0 = [0, 0, 0];
    var c1 = [0, 0, 0];
    var c2 = [0, 0, 0];
    var c3 = [0, 0, 0];

    idx = colorMap.getDirectIdx(x, y, z);
    interp(mux, idx,  idx + dx,  c0);
    interp(mux, idx + dy, idx + dx + dy, c1);
    interp(mux, idx + dz, idx + dx + dz, c2);
    interp(mux, idx + dy + dz, idx + dx + dy + dz, c3);

    var cz0 = [0, 0, 0];
    cz0[0] = (1 - muy) * c0[0] + muy * c1[0];
    cz0[1] = (1 - muy) * c0[1] + muy * c1[1];
    cz0[2] = (1 - muy) * c0[2] + muy * c1[2];

    var cz1 = [0, 0, 0];
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
      var j = vMap[i];
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
    var numTriangles = this._indices.length / 3;
    var newTriCount = 0;
    for (i = 0; i < numTriangles; ++i) {
      var i0 = vMap[this._indices[3 * i]];
      var i1 = vMap[this._indices[3 * i + 1]];
      var i2 = vMap[this._indices[3 * i + 2]];
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
};

IsoSurface.prototype.toMesh = function() {
  var geo = new THREE.BufferGeometry();
  geo.setIndex(new THREE.BufferAttribute(this._indices, 1));
  geo.addAttribute('position', new THREE.BufferAttribute(this._position, 3));
  geo.addAttribute('normal', new THREE.BufferAttribute(this._normals, 3));
  geo.addAttribute('color', new THREE.BufferAttribute(this._colors, 3));
  geo.computeBoundingSphere();
  return geo;
};

export default IsoSurface;

