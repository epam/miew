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
  const itemSize = 4;
  const nAtoms = posRad.length / itemSize;

  const minX = min[0];
  const minY = min[1];
  const minZ = min[2];

  const maxX = max[0];
  const maxY = max[1];
  const maxZ = max[2];

  function hashFunc(w, minW) {
    return Math.floor((w - minW) / maxDistance);
  }

  const iDim = hashFunc(maxX, minX) + 1;
  const jDim = hashFunc(maxY, minY) + 1;
  const kDim = hashFunc(maxZ, minZ) + 1;

  const nCells = iDim * jDim * kDim;

  const jkDim = jDim * kDim;

  /* Get cellID for cartesian x,y,z */
  const cellID = function (x, y, z) {
    return (((hashFunc(x, minX) * jDim) + hashFunc(y, minY)) * kDim) + hashFunc(z, minZ);
  };

  /* Initial building, could probably be optimized further */
  const preHash = [];
  let i;
  let cid;
  for (i = 0; i < nAtoms; i++) {
    const iIdx = itemSize * i;
    cid = cellID(posRad[iIdx], posRad[iIdx + 1], posRad[iIdx + 2]);

    if (preHash[cid] === undefined) {
      preHash[cid] = [i];
    } else {
      preHash[cid].push(i);
    }
  }

  const cellOffsets = utils.allocateTyped(Uint32Array, nCells);
  const cellLengths = utils.allocateTyped(Uint16Array, nCells);
  const data = utils.allocateTyped(Uint32Array, nAtoms);

  let offset = 0;
  let maxCellLength = 0;
  let j;
  for (i = 0; i < nCells; i++) {
    const start = cellOffsets[i] = offset;

    const subArray = preHash[i];

    if (subArray !== undefined) {
      for (j = 0; j < subArray.length; j++) {
        data[offset] = subArray[j];
        offset++;
      }
    }

    const cellLength = offset - start;
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
  this.withinRadii = function (x, y, z, rExtra, out) {
    let outIdx = 0;

    const nearI = hashFunc(x, minX);
    const nearJ = hashFunc(y, minY);
    const nearK = hashFunc(z, minZ);

    const loI = Math.max(0, nearI - 1);
    const loJ = Math.max(0, nearJ - 1);
    const loK = Math.max(0, nearK - 1);

    const hiI = Math.min(iDim - 1, nearI + 1);
    const hiJ = Math.min(jDim - 1, nearJ + 1);
    const hiK = Math.min(kDim - 1, nearK + 1);

    for (i = loI; i <= hiI; ++i) {
      const iOffset = i * jkDim;

      for (j = loJ; j <= hiJ; ++j) {
        const jOffset = j * kDim;

        for (let k = loK; k <= hiK; ++k) {
          cid = iOffset + jOffset + k;

          const cellStart = cellOffsets[cid];
          const cellEnd = cellStart + cellLengths[cid];

          for (let dataIndex = cellStart; dataIndex < cellEnd; dataIndex++) {
            const atomIndex = data[dataIndex];
            const baseIndex = itemSize * atomIndex;
            const dx = posRad[baseIndex] - x;
            const dy = posRad[baseIndex + 1] - y;
            const dz = posRad[baseIndex + 2] - z;
            const rSum = posRad[baseIndex + 3] + rExtra;

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

  const itemSize = 4;
  const { posRad, colors, atoms } = packedArrays;
  const nAtoms = posRad.length / itemSize;

  const { bbox } = boundaries;

  const min = bbox.minPosRad;
  const max = bbox.maxPosRad;

  let r2; // Atom positions, expanded radii (squared)
  let maxRadius;

  // Parameters
  let probeRadius;
  let scaleFactor;
  let probePositions;

  // Cache last value for obscured test
  let lastClip = -1;

  // Grid params
  let dim;
  let grid;
  let volTex;
  let weights;
  let weightsMap = null;
  let atomMap = null;
  let visibilitySelector = null;

  // grid indices -> xyz coords
  let gridx;
  let gridy;
  let gridz;

  // Lookup tables:
  let sinTable;
  let cosTable;

  // Spatial Hash
  let hash;

  // Neighbour array to be filled by hash
  let neighbours;

  // Vectors for Torus Projection
  const mid = new THREE.Vector3(0.0, 0.0, 0.0);
  const n1 = new THREE.Vector3(0.0, 0.0, 0.0);
  const n2 = new THREE.Vector3(0.0, 0.0, 0.0);

  let ngTorus;

  function uniformArray(TypeName, n, a) {
    const array = utils.allocateTyped(TypeName, n);
    for (let innI = 0; innI < n; ++innI) {
      array[innI] = a;
    }

    return array;
  }

  function fillGridDim(a, start, step) {
    for (let innI = 0; innI < a.length; innI++) {
      a[innI] = start + (step * innI);
    }
  }

  function initializeGrid() {
    ({ scaleFactor } = params);
    ({ dim } = boundaries);

    ngTorus = Math.min(5, 2 + Math.floor(probeRadius * scaleFactor));

    const gridSize = dim[0] * dim[1] * dim[2];
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
    let theta = 0.0;
    const step = 2 * Math.PI / probePositions;

    cosTable = utils.allocateTyped(Float32Array, probePositions);
    sinTable = utils.allocateTyped(Float32Array, probePositions);
    for (let innI = 0; innI < probePositions; innI++) {
      cosTable[innI] = Math.cos(theta);
      sinTable[innI] = Math.sin(theta);
      theta += step;
    }
  }

  function initializeHash() {
    hash = new AVHash(posRad, min, max, 2.01 * maxRadius);
    neighbours = new Int32Array(hash.neighbourListLength);
  }

  function init() {
    ({
      probeRadius,
      scaleFactor,
      probePositions,
      visibilitySelector,
    } = params);
    r2 = utils.allocateTyped(Float32Array, nAtoms);
    maxRadius = 0;
    for (let innI = 0; innI < nAtoms; ++innI) {
      const rExt = posRad[innI * itemSize + 3] += probeRadius;
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

  function singleAtomObscures(ai, innX, innY, innZ) {
    const innCI = itemSize * ai;
    const ra2 = r2[ai];
    const dx = posRad[innCI] - innX;
    const dy = posRad[innCI + 1] - innY;
    const dz = posRad[innCI + 2] - innZ;
    const d2 = dx * dx + dy * dy + dz * dz;

    return d2 < ra2;
  }

  function obscured(innX, innY, innZ, a, b) {
    // Is the point at x,y,z obscured by any of the atoms
    // specifeid by indices in neighbours. Ignore indices
    // a and b (these are the relevant atoms in projectPoints/Torii)

    // Cache the last clipped atom (as very often the same one in
    // subsequent calls)
    let ai;

    if (lastClip !== -1) {
      ai = lastClip;
      if (ai !== a && ai !== b && singleAtomObscures(ai, innX, innY, innZ)) {
        return ai;
      }
      lastClip = -1;
    }

    let ni = 0;
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

  function projectPoints() {
    // For each atom:
    //     Iterate over a subsection of the grid, for each point:
    //         If current value < 0.0, unvisited, set positive
    //
    //         In any case: Project this point onto surface of the atomic sphere
    //         If this projected point is not obscured by any other atom
    //             Calcualte delta distance and set grid value to minimum of
    //             itself and delta

    // Should we alias frequently accessed closure constiables??
    // Assume JS engine capable of optimizing this
    // anyway...
    const maxRad = 4.0;
    const sigma = (maxRad) / 3;
    const sigma2Inv = 1 / (2 * sigma * sigma);

    for (let innI = 0; innI < nAtoms; innI++) {
      const innCI = itemSize * innI;
      const ax = posRad[innCI];
      const ay = posRad[innCI + 1];
      const az = posRad[innCI + 2];
      const ar = posRad[innCI + 3];
      const ar2 = r2[innI];

      hash.withinRadii(ax, ay, az, ar, neighbours);

      // Number of grid points, round this up...
      const ng = Math.ceil(ar * scaleFactor);

      // Center of the atom, mapped to grid points (take floor)
      const iax = Math.floor(scaleFactor * (ax - min[0]));
      const iay = Math.floor(scaleFactor * (ay - min[1]));
      const iaz = Math.floor(scaleFactor * (az - min[2]));

      // Extents of grid to consider for this atom
      const minx = Math.max(0, iax - ng);
      const miny = Math.max(0, iay - ng);
      const minz = Math.max(0, iaz - ng);

      // Add two to these points:
      // - iax are floor'd values so this ensures coverage
      // - these are loop limits (exclusive)
      const maxx = Math.min(dim[0], iax + ng + 2);
      const maxy = Math.min(dim[1], iay + ng + 2);
      const maxz = Math.min(dim[2], iaz + ng + 2);

      const colIdx = innI * 3;
      const cr = colors[colIdx];
      const cg = colors[colIdx + 1];
      const cb = colors[colIdx + 2];

      for (let iz = minz; iz < maxz; iz++) {
        const dz = gridz[iz] - az;
        const zOffset = dim[1] * dim[0] * iz;

        for (let iy = miny; iy < maxy; iy++) {
          const dy = gridy[iy] - ay;
          const dzy2 = dz * dz + dy * dy;
          const zyOffset = zOffset + dim[0] * iy;

          for (let ix = minx; ix < maxx; ix++) {
            const idx = ix + zyOffset;
            const dx = gridx[ix] - ax;
            const d2 = dzy2 + dx * dx;

            if (d2 < ar2) {
              const w = Math.exp(-d2 * sigma2Inv);
              const cIdx = idx * 3;
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
              const d = Math.sqrt(d2);
              const ap = ar / d;
              let spx = dx * ap;
              let spy = dy * ap;
              let spz = dz * ap;

              spx += ax;
              spy += ay;
              spz += az;

              if (obscured(spx, spy, spz, innI, -1) === -1) {
                const dd = ar - d;
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

  function projectTorus(a, b) {
    const aIdx = itemSize * a;
    const bIdx = itemSize * b;
    const xa = posRad[aIdx];
    const ya = posRad[aIdx + 1];
    const za = posRad[aIdx + 2];
    const r1 = posRad[aIdx + 3];
    let dx = mid.x = posRad[bIdx] - xa;
    let dy = mid.y = posRad[bIdx + 1] - ya;
    let dz = mid.z = posRad[bIdx + 2] - za;
    const innR2 = posRad[bIdx + 3];
    let d2 = dx * dx + dy * dy + dz * dz;

    // This check now redundant as already done in AVHash.withinRadii
    // if( d2 > (( r1 + r2 ) * ( r1 + r2 )) ){ return; }

    const d = Math.sqrt(d2);

    // Find angle between a->b vector and the circle
    // of their intersection by cosine rule
    const cosA = (r1 * r1 + d * d - innR2 * innR2) / (2.0 * r1 * d);

    // distance along a->b at intersection
    const dmp = r1 * cosA;

    mid.normalize();

    // Create normal to line
    normalToLine(n1, mid);
    n1.normalize();

    // Cross together for second normal vector
    n2.crossVectors(mid, n1);
    n2.normalize();

    // r is radius of circle of intersection
    const rInt = Math.sqrt(r1 * r1 - dmp * dmp);

    n1.multiplyScalar(rInt);
    n2.multiplyScalar(rInt);
    mid.multiplyScalar(dmp);

    mid.x += xa;
    mid.y += ya;
    mid.z += za;

    lastClip = -1;

    const ng = ngTorus;

    for (let innI = 0; innI < probePositions; innI++) {
      const cost = cosTable[innI];
      const sint = sinTable[innI];

      const px = mid.x + cost * n1.x + sint * n2.x;
      const py = mid.y + cost * n1.y + sint * n2.y;
      const pz = mid.z + cost * n1.z + sint * n2.z;

      if (obscured(px, py, pz, a, b) === -1) {
        // As above, iterate over our grid...
        // px, py, pz in grid coords
        const iax = Math.floor(scaleFactor * (px - min[0]));
        const iay = Math.floor(scaleFactor * (py - min[1]));
        const iaz = Math.floor(scaleFactor * (pz - min[2]));

        const minx = Math.max(0, iax - ng);
        const miny = Math.max(0, iay - ng);
        const minz = Math.max(0, iaz - ng);

        const maxx = Math.min(dim[0], iax + ng + 2);
        const maxy = Math.min(dim[1], iay + ng + 2);
        const maxz = Math.min(dim[2], iaz + ng + 2);

        for (let iz = minz; iz < maxz; iz++) {
          dz = pz - gridz[iz];
          const zOffset = dim[1] * dim[0] * iz;
          for (let iy = miny; iy < maxy; iy++) {
            dy = py - gridy[iy];
            const dzy2 = dz * dz + dy * dy;
            const zyOffset = zOffset + dim[0] * iy;
            for (let ix = minx; ix < maxx; ix++) {
              dx = px - gridx[ix];
              d2 = dzy2 + dx * dx;
              const idx = ix + zyOffset;
              const current = grid[idx];

              if (current > 0.0 && d2 < (current * current)) {
                grid[idx] = Math.sqrt(d2);
              }
            }
          }
        }
      }
    }
  }

  function projectTorii() {
    for (let innI = 0; innI < nAtoms; innI++) {
      const innIdx = itemSize * innI;
      hash.withinRadii(
        posRad[innIdx],
        posRad[innIdx + 1],
        posRad[innIdx + 2],
        posRad[innIdx + 3],
        neighbours,
      );
      let ia = 0;
      let ni = neighbours[ia];
      while (ni >= 0) {
        if (innI < ni) {
          projectTorus(innI, ni);
        }
        ni = neighbours[++ia];
      }
    }
  }

  function fixNegatives() {
    for (let innI = 0, n = grid.length; innI < n; innI++) {
      if (grid[innI] < 0) grid[innI] = 0;
      let w = weights[innI];
      if (w > 0) {
        w = 1 / w;
        const innInnI = innI * 3;
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

  this.build = function () {
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
