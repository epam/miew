

import * as THREE from 'three';
import utils from '../../utils';

/**
 * Modifed from SpatialHash
 *
 * Main differences are:
 * - Optimized grid size to ensure we only ever need to look +/-1 cell
 * - Aware of atomic radii and will only output atoms within rAtom + rExtra
 *   (see withinRadii method)
 *
 * (Uses rounding rather than bitshifting as consequence of arbitrary grid size)
 * @class
 * @param {Float32Array} posRad - x, y, z coordinates and radiuses
 * @param {Float32Array} min - xyz min coordinates
 * @param {Float32Array} max - xyz max coordinates
 * @param {number} maxDistance - max distance
 */
function AVHash(posRad, min, max, maxDistance) {
  var itemSize = 4;
  var nAtoms = posRad.length / itemSize;

  var minX = min[0];
  var minY = min[1];
  var minZ = min[2];

  var maxX = max[0];
  var maxY = max[1];
  var maxZ = max[2];

  function hashFunc(w, minW) {
    return Math.floor((w - minW) / maxDistance);
  }

  var iDim = hashFunc(maxX, minX) + 1;
  var jDim = hashFunc(maxY, minY) + 1;
  var kDim = hashFunc(maxZ, minZ) + 1;

  var nCells = iDim * jDim * kDim;

  var jkDim = jDim * kDim;


  /* Get cellID for cartesian x,y,z */
  var cellID = function(x, y, z) {
    return (((hashFunc(x, minX) * jDim) + hashFunc(y, minY)) * kDim) + hashFunc(z, minZ);
  };


    /* Initial building, could probably be optimized further */
  var preHash = []; // preHash[ cellID ] = [ atomId1, atomId2 ];
  var i;
  var cid;
  for (i = 0; i < nAtoms; i++) {
    var iIdx = itemSize * i;
    cid = cellID(posRad[iIdx], posRad[iIdx + 1], posRad[iIdx + 2]);

    if (preHash[cid] === undefined) {
      preHash[cid] = [i];
    } else {
      preHash[cid].push(i);
    }

  }

  var cellOffsets = utils.allocateTyped(Uint32Array, nCells);
  var cellLengths = utils.allocateTyped(Uint16Array, nCells);
  var data = utils.allocateTyped(Uint32Array, nAtoms);

  var offset = 0;
  var maxCellLength = 0;
  var j;
  for (i = 0; i < nCells; i++) {
    var start = cellOffsets[i] = offset;

    var subArray = preHash[i];

    if (subArray !== undefined) {
      for (j = 0; j < subArray.length; j++) {
        data[offset] = subArray[j];
        offset++;
      }
    }

    var cellLength = offset - start;
    cellLengths[i] = cellLength;

    if (cellLength > maxCellLength) {
      maxCellLength = cellLength;
    }
  }

  // Maximum number of neighbours we could ever produce (27 adjacent cells of equal population)
  this.neighbourListLength = (27 * maxCellLength) + 1;

  /**
   * Populate the supplied out array with atom indices that are within rAtom + rExtra
   * of x,y,z
   *
   * -1 in out array indicates the end of the list
   *
   * @param  {number} x - x coordinate
   * @param  {number} y - y coordinate
   * @param  {number} z - z coordinate
   * @param  {number} rExtra - additional radius
   * @param  {Float32Array} out - pre-allocated output array
   * @return {undefined}
   */
  this.withinRadii = function(x, y, z, rExtra, out) {
    var outIdx = 0;

    var nearI = hashFunc(x, minX);
    var nearJ = hashFunc(y, minY);
    var nearK = hashFunc(z, minZ);

    var loI = Math.max(0, nearI - 1);
    var loJ = Math.max(0, nearJ - 1);
    var loK = Math.max(0, nearK - 1);

    var hiI = Math.min(iDim - 1, nearI + 1);
    var hiJ = Math.min(jDim - 1, nearJ + 1);
    var hiK = Math.min(kDim - 1, nearK + 1);

    for (i = loI; i <= hiI; ++i) {

      var iOffset = i * jkDim;

      for (j = loJ; j <= hiJ; ++j) {

        var jOffset = j * kDim;

        for (var k = loK; k <= hiK; ++k) {

          cid = iOffset + jOffset + k;

          var cellStart = cellOffsets[cid];
          var cellEnd = cellStart + cellLengths[cid];

          for (var dataIndex = cellStart; dataIndex < cellEnd; dataIndex++) {

            var atomIndex = data[dataIndex];
            var baseIndex = itemSize * atomIndex;
            var dx = posRad[baseIndex] - x;
            var dy = posRad[baseIndex + 1] - y;
            var dz = posRad[baseIndex + 2] - z;
            var rSum = posRad[baseIndex + 3] + rExtra;

            if ((dx * dx + dy * dy + dz * dz) <= (rSum * rSum)) {
              out[outIdx++] = data[dataIndex];
            }
          }
        }
      }
    }
    // Add terminator
    out[outIdx] = -1;
  };
}
function ContactSurface(packedArrays, boundaries, params, _indexList) {

  // Field generation method adapted from AstexViewer (Mike Hartshorn)
  // by Fred Ludlow.
  // Other parts based heavily on NGL (Alexander Rose) EDT Surface class
  //
  // Should work as a drop-in alternative to EDTSurface (though some of
  // the EDT paramters are not relevant in this method).

  var itemSize = 4;
  var posRad = packedArrays.posRad;
  var colors = packedArrays.colors;
  var atoms = packedArrays.atoms;
  var nAtoms = posRad.length / itemSize;

  var bbox = boundaries.bbox;

  var min = bbox.minPosRad;
  var max = bbox.maxPosRad;

  var r2;  // Atom positions, expanded radii (squared)
  var maxRadius;

  // Parameters
  var probeRadius, scaleFactor, probePositions;

  // Cache last value for obscured test
  var lastClip = -1;

  // Grid params
  var dim, grid;
  var volTex, weights, weightsMap = null, atomMap = null;
  var visibilitySelector = null;


  // grid indices -> xyz coords
  var gridx, gridy, gridz;

  // Lookup tables:
  var sinTable, cosTable;

  // Spatial Hash
  var hash;

  // Neighbour array to be filled by hash
  var neighbours;

  // Vectors for Torus Projection
  var mid = new THREE.Vector3(0.0, 0.0, 0.0);
  var n1 = new THREE.Vector3(0.0, 0.0, 0.0);
  var n2 = new THREE.Vector3(0.0, 0.0, 0.0);

  var ngTorus;

  function init() {
    probeRadius = params.probeRadius;
    scaleFactor = params.scaleFactor;
    probePositions = params.probePositions;
    visibilitySelector = params.visibilitySelector;

    r2 = utils.allocateTyped(Float32Array, nAtoms);
    maxRadius = 0;
    for (var innI = 0; innI < nAtoms; ++innI) {
      var rExt = posRad[innI * itemSize + 3] += probeRadius;
      if (rExt > maxRadius) {
        maxRadius = rExt;
      }
      r2[innI] = rExt * rExt;
    }

    initializeGrid();
    initializeAngleTables();
    initializeHash();

    lastClip = -1;
  }

  function uniformArray(TypeName, n, a) {
    var array = utils.allocateTyped(TypeName, n);
    for (var innI = 0; innI < n; ++innI) {
      array[innI] = a;
    }

    return array;
  }


  function fillGridDim(a, start, step) {
    for (var innI = 0; innI < a.length; innI++) {
      a[innI] = start + (step * innI);
    }
  }

  function initializeGrid() {
    scaleFactor = params.scaleFactor;
    dim = boundaries.dim;

    ngTorus = Math.min(5, 2 + Math.floor(probeRadius * scaleFactor));

    var gridSize = dim[0] * dim[1] * dim[2];
    grid = uniformArray(Float32Array, gridSize, -1001.0);
    volTex = utils.allocateTyped(Float32Array, gridSize * 3);
    weights = utils.allocateTyped(Float32Array, gridSize);
    if (visibilitySelector) {
      weightsMap = utils.allocateTyped(Float32Array, gridSize);
      atomMap = [];
    }


    gridx = utils.allocateTyped(Float32Array, dim[0]);
    gridy = utils.allocateTyped(Float32Array, dim[1]);
    gridz = utils.allocateTyped(Float32Array, dim[2]);

    fillGridDim(gridx, min[0], 1 / scaleFactor);
    fillGridDim(gridy, min[1], 1 / scaleFactor);
    fillGridDim(gridz, min[2], 1 / scaleFactor);
  }

  function initializeAngleTables() {
    var theta = 0.0;
    var step = 2 * Math.PI / probePositions;

    cosTable = utils.allocateTyped(Float32Array, probePositions);
    sinTable = utils.allocateTyped(Float32Array, probePositions);
    for (var innI = 0; innI < probePositions; innI++) {
      cosTable[innI] = Math.cos(theta);
      sinTable[innI] = Math.sin(theta);
      theta += step;
    }
  }

  function initializeHash() {
    hash = new AVHash(posRad, min, max, 2.01 * maxRadius);
    neighbours = new Int32Array(hash.neighbourListLength);
  }

  function obscured(innX, innY, innZ, a, b) {
    // Is the point at x,y,z obscured by any of the atoms
    // specifeid by indices in neighbours. Ignore indices
    // a and b (these are the relevant atoms in projectPoints/Torii)

    // Cache the last clipped atom (as very often the same one in
    // subsequent calls)
    var ai;

    if (lastClip !== -1) {
      ai = lastClip;
      if (ai !== a && ai !== b && singleAtomObscures(ai, innX, innY, innZ)) {
        return ai;
      } else {
        lastClip = -1;
      }
    }

    var ni = 0;
    ai = neighbours[ni];
    while (ai >= 0) {
      if (ai !== a && ai !== b && singleAtomObscures(ai, innX, innY, innZ)) {
        lastClip = ai;
        return ai;
      }
      ai = neighbours[++ni];
    }

    lastClip = -1;

    return -1;
  }

  function singleAtomObscures(ai, innX, innY, innZ) {
    var innCI = itemSize * ai;
    var ra2 = r2[ai];
    var dx = posRad[innCI] - innX;
    var dy = posRad[innCI + 1] - innY;
    var dz = posRad[innCI + 2] - innZ;
    var d2 = dx * dx + dy * dy + dz * dz;

    return d2 < ra2;
  }

  function projectPoints() {

    // For each atom:
    //     Iterate over a subsection of the grid, for each point:
    //         If current value < 0.0, unvisited, set positive
    //
    //         In any case: Project this point onto surface of the atomic sphere
    //         If this projected point is not obscured by any other atom
    //             Calcualte delta distance and set grid value to minimum of
    //             itself and delta

    // Should we alias frequently accessed closure variables??
    // Assume JS engine capable of optimizing this
    // anyway...
    var maxRad = 4.0;
    var sigma = (maxRad) / 3;
    var sigma2Inv = 1 / (2 * sigma * sigma);

    for (var innI = 0; innI < nAtoms; innI++) {
      var innCI = itemSize * innI;
      var ax = posRad[innCI];
      var ay = posRad[innCI + 1];
      var az = posRad[innCI + 2];
      var ar = posRad[innCI + 3];
      var ar2 = r2[innI];

      hash.withinRadii(ax, ay, az, ar, neighbours);

      // Number of grid points, round this up...
      var ng = Math.ceil(ar * scaleFactor);

      // Center of the atom, mapped to grid points (take floor)
      var iax = Math.floor(scaleFactor * (ax - min[0]));
      var iay = Math.floor(scaleFactor * (ay - min[1]));
      var iaz = Math.floor(scaleFactor * (az - min[2]));

      // Extents of grid to consider for this atom
      var minx = Math.max(0, iax - ng);
      var miny = Math.max(0, iay - ng);
      var minz = Math.max(0, iaz - ng);

      // Add two to these points:
      // - iax are floor'd values so this ensures coverage
      // - these are loop limits (exclusive)
      var maxx = Math.min(dim[0], iax + ng + 2);
      var maxy = Math.min(dim[1], iay + ng + 2);
      var maxz = Math.min(dim[2], iaz + ng + 2);

      var colIdx = innI * 3;
      var cr = colors[colIdx];
      var cg = colors[colIdx + 1];
      var cb = colors[colIdx + 2];

      for (var iz = minz; iz < maxz; iz++) {
        var dz = gridz[iz] - az;
        var zOffset = dim[1] * dim[0] * iz;

        for (var iy = miny; iy < maxy; iy++) {

          var dy = gridy[iy] - ay;
          var dzy2 = dz * dz + dy * dy;
          var zyOffset = zOffset + dim[0] * iy;

          for (var ix = minx; ix < maxx; ix++) {
            var idx = ix + zyOffset;
            var dx = gridx[ix] - ax;
            var d2 = dzy2 + dx * dx;


            if (d2 < ar2) {
              var w = Math.exp(-d2 * sigma2Inv);
              var cIdx = idx * 3;
              volTex[cIdx] += cr * w;
              volTex[cIdx + 1] += cg * w;
              volTex[cIdx + 2] += cb * w;
              weights[idx] += w;
              if (visibilitySelector !== null && w > weightsMap[idx]) {
                weightsMap[idx] = w;
                atomMap[idx] = atoms[innI];
              }

              if (grid[idx] < 0.0) {
                // Unvisited, make positive
                grid[idx] = -grid[idx];
              }
              // Project on to the surface of the sphere
              // sp is the projected point ( dx, dy, dz ) * ( ra / d )
              var d = Math.sqrt(d2);
              var ap = ar / d;
              var spx = dx * ap;
              var spy = dy * ap;
              var spz = dz * ap;

              spx += ax;
              spy += ay;
              spz += az;

              if (obscured(spx, spy, spz, innI, -1) === -1) {
                var dd = ar - d;
                if (dd < grid[idx]) {
                  grid[idx] = dd;
                }
              }
            }
          }
        }
      }
    }

  }

  function projectTorii() {
    for (var innI = 0; innI < nAtoms; innI++) {
      var innIdx = itemSize * innI;
      hash.withinRadii(
        posRad[innIdx], posRad[innIdx + 1], posRad[innIdx + 2],
        posRad[innIdx + 3], neighbours
      );
      var ia = 0;
      var ni = neighbours[ia];
      while (ni >= 0) {
        if (innI < ni) {
          projectTorus(innI, ni);
        }
        ni = neighbours[++ia];
      }
    }
  }

  function projectTorus(a, b) {

    var aIdx = itemSize * a;
    var bIdx = itemSize * b;
    var xa = posRad[aIdx];
    var ya = posRad[aIdx + 1];
    var za = posRad[aIdx + 2];
    var r1 = posRad[aIdx + 3];
    var dx = mid.x = posRad[bIdx] - xa;
    var dy = mid.y = posRad[bIdx + 1] - ya;
    var dz = mid.z = posRad[bIdx + 2] - za;
    var innR2 = posRad[bIdx + 3];
    var d2 = dx * dx + dy * dy + dz * dz;

    // This check now redundant as already done in AVHash.withinRadii
    // if( d2 > (( r1 + r2 ) * ( r1 + r2 )) ){ return; }

    var d = Math.sqrt(d2);

    // Find angle between a->b vector and the circle
    // of their intersection by cosine rule
    var cosA = (r1 * r1 + d * d - innR2 * innR2) / (2.0 * r1 * d);

    // distance along a->b at intersection
    var dmp = r1 * cosA;

    mid.normalize();

    // Create normal to line
    normalToLine(n1, mid);
    n1.normalize();

    // Cross together for second normal vector
    n2.crossVectors(mid, n1);
    n2.normalize();

    // r is radius of circle of intersection
    var rInt = Math.sqrt(r1 * r1 - dmp * dmp);

    n1.multiplyScalar(rInt);
    n2.multiplyScalar(rInt);
    mid.multiplyScalar(dmp);

    mid.x += xa;
    mid.y += ya;
    mid.z += za;

    lastClip = -1;

    var ng = ngTorus;

    for (var innI = 0; innI < probePositions; innI++) {

      var cost = cosTable[innI];
      var sint = sinTable[innI];

      var px = mid.x + cost * n1.x + sint * n2.x;
      var py = mid.y + cost * n1.y + sint * n2.y;
      var pz = mid.z + cost * n1.z + sint * n2.z;

      if (obscured(px, py, pz, a, b) === -1) {

        // As above, iterate over our grid...
        // px, py, pz in grid coords
        var iax = Math.floor(scaleFactor * (px - min[0]));
        var iay = Math.floor(scaleFactor * (py - min[1]));
        var iaz = Math.floor(scaleFactor * (pz - min[2]));

        var minx = Math.max(0, iax - ng);
        var miny = Math.max(0, iay - ng);
        var minz = Math.max(0, iaz - ng);

        var maxx = Math.min(dim[0], iax + ng + 2);
        var maxy = Math.min(dim[1], iay + ng + 2);
        var maxz = Math.min(dim[2], iaz + ng + 2);

        for (var iz = minz; iz < maxz; iz++) {

          dz = pz - gridz[iz];
          var zOffset = dim[1] * dim[0] * iz;
          for (var iy = miny; iy < maxy; iy++) {

            dy = py - gridy[iy];
            var dzy2 = dz * dz + dy * dy;
            var zyOffset = zOffset + dim[0] * iy;
            for (var ix = minx; ix < maxx; ix++) {

              dx = px - gridx[ix];
              d2 = dzy2 + dx * dx;
              var idx = ix + zyOffset;
              var current = grid[idx];

              if (current > 0.0 && d2 < (current * current)) {
                grid[idx] = Math.sqrt(d2);
              }
            }
          }
        }
      }
    }

  }


  function normalToLine(out, p) {
    out.x = out.y = out.z = 1.0;
    if (p.x !== 0) {
      out.x = (p.y + p.z) / -p.x;
    } else if (p.y !== 0) {
      out.y = (p.x + p.z) / -p.y;
    } else if (p.z !== 0) {
      out.z = (p.x + p.y) / -p.z;
    }
    return out;
  }

  function fixNegatives() {
    for (var innI = 0, n = grid.length; innI < n; innI++) {
      if (grid[innI] < 0) grid[innI] = 0;
      var w = weights[innI];
      if (w > 0) {
        w = 1 / w;
        var innInnI = innI * 3;
        volTex[innInnI] *= w;
        volTex[innInnI + 1] *= w;
        volTex[innInnI + 2] *= w;
      }
    }
  }

  function getVolume() {

    // Basic steps are:
    // 1) Initialize
    // 2) Project points
    // 3) Project torii
    console.time('ContactSurface.getVolume');

    console.time('ContactSurface.init');
    init();
    console.timeEnd('ContactSurface.init');

    console.time('ContactSurface.projectPoints');
    projectPoints();
    console.timeEnd('ContactSurface.projectPoints');

    console.time('ContactSurface.projectTorii');
    projectTorii();
    console.timeEnd('ContactSurface.projectTorii');
    fixNegatives();
    console.timeEnd('ContactSurface.getVolume');
  }

  this.build = function() {
    // type and cutoff left in for compatibility with EDTSurface.getSurface
    // function signature
    getVolume();
    this.volTexMap = volTex;
    this.weightsMap = weightsMap;
    this.atomMap = atomMap;
    this.volMap = grid;
  };

}
export default ContactSurface;

