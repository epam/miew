import * as THREE from 'three';
import utils from '../utils';

/**
 * Calculate min & max radius of a sphere slice between zMin & zMax
 *
 * @param {Vector3} center - center of the sphere
 * @param {number} radius  - sphere radius
 * @param {number} zMin - lower bound of the slice
 * @param {number} zMax - upper bound of the slice
 */
function _getSphereSliceRadiusRange(center, radius, zMin, zMax) {
  const dzMin = zMin - center.z;
  const dzMax = zMax - center.z;
  const rzMin = Math.sqrt(Math.max(radius * radius - dzMin * dzMin, 0.0));
  const rzMax = Math.sqrt(Math.max(radius * radius - dzMax * dzMax, 0.0));

  const rMin = Math.min(rzMin, rzMax);
  let rMax;

  if (zMin <= center.z && zMax >= center.z) {
    // sphere's main diameter is inside slice
    rMax = radius;
  } else {
    rMax = Math.max(rzMin, rzMax);
  }

  return [rMin, rMax];
}

/**
 * Calculate min & max radius of a circle slice between yMin & yMax.
 *
 * To maintain analogy with _getSphereSliceRadiusRange we call radius what in fact is
 * half-width (along X axis) of the slice, i.e. 1D-sphere radius.
 *
 * @param {Vector3} center - center of the circle (z can be ignored)
 * @param {number} radius  - circle radius
 * @param {number} yMin - lower bound of the slice
 * @param {number} yMax - upper bound of the slice
 * @returns {Array} - array of two numbers (min & max radius, or half-width)
 */
function _getCircleSliceRadiusRange(center, radius, yMin, yMax) {
  const dyMin = yMin - center.y;
  const dyMax = yMax - center.y;
  const ryMin = Math.sqrt(Math.max(radius * radius - dyMin * dyMin, 0.0));
  const ryMax = Math.sqrt(Math.max(radius * radius - dyMax * dyMax, 0.0));

  const rMin = Math.min(ryMin, ryMax);
  let rMax;

  if (yMin <= center.y && yMax >= center.y) {
    // slice's main diameter is inside slice
    rMax = radius;
  } else {
    rMax = Math.max(ryMin, ryMax);
  }

  return [rMin, rMax];
}

/**
 * VoxelWorld constructor
 *
 * @param {Box3} box - bounding box of the volume to be partitioned
 * @param {Vector3} vCellSizeHint - target voxel size (actual voxel size may differ from this)
 */
class VoxelWorld {
  constructor(box, vCellSizeHint) {
    this._box = box.clone();
    const size = new THREE.Vector3();
    box.getSize(size);
    this._count = size.clone().divide(vCellSizeHint).floor().max(new THREE.Vector3(1, 1, 1));
    this._last = this._count.clone().subScalar(1);
    this._cellSize = size.clone().divide(this._count);
    this._cellInnerR = 0.5 * Math.min(Math.min(this._cellSize.x, this._cellSize.y), this._cellSize.z);
    this._cellOuterR = 0.5 * Math.sqrt(this._cellSize.dot(this._cellSize));

    // array of voxels, each element contains index of first atom in voxel
    const numVoxels = this._count.x * this._count.y * this._count.z;
    this._voxels = utils.allocateTyped(Int32Array, numVoxels);
    for (let i = 0; i < numVoxels; ++i) {
      this._voxels[i] = -1;
    }

    // array of atoms that stores multiple single-linked lists
    // two elements for each atom: Atom ref, index of next atom (in this array
    this._atoms = [];
  }

  /**
   * Add all atoms from a complex to voxel world
   *
   * @param {Complex} complex - complex
   */
  addAtoms(complex) {
    const self = this;

    let idx = this._atoms.length;

    // resize array of atoms
    this._atoms.length += 2 * complex.getAtomCount();

    complex.forEachAtom((atom) => {
      // find which voxel contains this atom
      const voxelIdx = self._findVoxel(atom.position);

      // push current atom to the head of voxel's atom list
      self._atoms[idx] = atom;
      self._atoms[idx + 1] = self._voxels[voxelIdx];
      self._voxels[voxelIdx] = idx;

      idx += 2;
    });
  }

  /**
   * Get voxel that contains specified 3D point (we use clamp at the edges)
   *
   * @param {Vector3} point - a point in 3D
   * @returns {number} - index of voxel
   */
  static _zero = new THREE.Vector3(0, 0, 0);

  static _voxel = new THREE.Vector3();

  _findVoxel(point) {
    const zero = VoxelWorld._zero;
    const voxel = VoxelWorld._voxel;
    voxel.copy(point)
      .sub(this._box.min)
      .divide(this._cellSize)
      .floor()
      .clamp(zero, this._last);
    return voxel.x + this._count.x * (voxel.y + this._count.y * voxel.z);
  }

  /**
   * Call a function for each atom in voxel
   *
   * @param {number} voxel - index of voxel
   * @param {function(Atom)} process - function to call
   */
  _forEachAtomInVoxel(voxel, process) {
    for (let i = this._voxels[voxel]; i >= 0; i = this._atoms[i + 1]) {
      process(this._atoms[i]);
    }
  }

  /**
   * Call a function for each voxel that is touched by given sphere. Callback also takes flag
   * isInside specifying whether voxel lies inside the sphere entirely.
   *
   * @param {Vector3} center - center of the sphere
   * @param {number} radius  - sphere radius
   * @param {function(number,bool)} process - function to call that takes voxel index and boolean isInside
   */

  static _xRange = new THREE.Vector2();

  static _yRange = new THREE.Vector2();

  static _zRange = new THREE.Vector2();

  _forEachVoxelWithinRadius(center, radius, process) {
    const xRange = VoxelWorld._xRange;
    const yRange = VoxelWorld._yRange;
    const zRange = VoxelWorld._zRange;

    // switch to a faster method unless cell size is much smaller than sphere radius
    if (radius / this._cellInnerR < 10) {
      this._forEachVoxelWithinRadiusSimple(center, radius, process);
      return;
    }

    let rRangeXY;
    let rRangeX;
    let xVal;
    let yVal;
    let zVal;
    let isInsideX;
    let isInsideY;
    let isInsideZ;

    zRange.set(center.z - radius, center.z + radius);
    zRange.subScalar(this._box.min.z)
      .divideScalar(this._cellSize.z)
      .floor()
      .clampScalar(0, this._count.z - 1);

    for (let z = zRange.x; z <= zRange.y; ++z) {
      zVal = [this._box.min.z + z * this._cellSize.z,
        this._box.min.z + (z + 1) * this._cellSize.z];

      isInsideZ = (center.z - radius <= zVal[0]) && (zVal[1] <= center.z + radius);

      rRangeXY = _getSphereSliceRadiusRange(center, radius, zVal[0], zVal[1]);

      yRange.set(center.y - rRangeXY[1], center.y + rRangeXY[1]);
      yRange.subScalar(this._box.min.y)
        .divideScalar(this._cellSize.y)
        .floor()
        .clampScalar(0, this._count.y - 1);

      for (let y = yRange.x; y <= yRange.y; ++y) {
        yVal = [this._box.min.y + y * this._cellSize.y,
          this._box.min.y + (y + 1) * this._cellSize.y];

        isInsideY = (center.y - rRangeXY[0] <= yVal[0]) && (yVal[1] <= center.y + rRangeXY[0]);

        rRangeX = _getCircleSliceRadiusRange(center, rRangeXY[1], yVal[0], yVal[1]);

        xRange.set(center.x - rRangeX[1], center.x + rRangeX[1]);
        xRange.subScalar(this._box.min.x)
          .divideScalar(this._cellSize.x)
          .floor()
          .clampScalar(0, this._count.x - 1);

        for (let { x } = xRange; x <= xRange.y; ++x) {
          xVal = [this._box.min.x + x * this._cellSize.x,
            this._box.min.x + (x + 1) * this._cellSize.x];
          isInsideX = (center.x - rRangeX[0] <= xVal[0]) && (xVal[1] <= center.x + rRangeX[0]);

          process(x + this._count.x * (y + this._count.y * z), isInsideX && isInsideY && isInsideZ);
        }
      }
    }
  }

  /**
   * Call a function for each voxel that is touched by given sphere. Callback also takes flag
   * isInside specifying whether voxel lies inside the sphere entirely.
   * This is a version of method that doesn't try to "calculate" what voxels fall inside radius
   * but instead just checks all voxels inside sphere's bounding box. This should be faster
   * unless cell size is much smaller than sphere radius.
   *
   * @param {Vector3} center - center of the sphere
   * @param {number} radius  - sphere radius
   * @param {function(number,bool)} process - function to call that takes voxel index and boolean isInside
   */

  static _vCenter = new THREE.Vector3();

  _forEachVoxelWithinRadiusSimple(center, radius, process) {
    const xRange = VoxelWorld._xRange;
    const yRange = VoxelWorld._yRange;
    const zRange = VoxelWorld._zRange;
    const vCenter = VoxelWorld._vCenter;

    const distTouch2 = (radius + this._cellOuterR) * (radius + this._cellOuterR);
    let distInside2 = -1.0;
    if (radius > this._cellOuterR) {
      distInside2 = (radius - this._cellOuterR) * (radius - this._cellOuterR);
    }

    // calculate bounding box for the sphere
    xRange.set(center.x - radius, center.x + radius);
    xRange.subScalar(this._box.min.x)
      .divideScalar(this._cellSize.x)
      .floor();
    xRange.x = Math.min(Math.max(xRange.x, 0), this._count.x - 1);
    xRange.y = Math.min(Math.max(xRange.y, 0), this._count.x - 1);

    yRange.set(center.y - radius, center.y + radius);
    yRange.subScalar(this._box.min.y)
      .divideScalar(this._cellSize.y)
      .floor();
    yRange.x = Math.min(Math.max(yRange.x, 0), this._count.y - 1);
    yRange.y = Math.min(Math.max(yRange.y, 0), this._count.y - 1);

    zRange.set(center.z - radius, center.z + radius);
    zRange.subScalar(this._box.min.z)
      .divideScalar(this._cellSize.z)
      .floor();
    zRange.x = Math.min(Math.max(zRange.x, 0), this._count.z - 1);
    zRange.y = Math.min(Math.max(zRange.y, 0), this._count.z - 1);

    for (let z = zRange.x; z <= zRange.y; ++z) {
      const zVal = [this._box.min.z + z * this._cellSize.z,
        this._box.min.z + (z + 1) * this._cellSize.z];
      vCenter.z = 0.5 * (zVal[0] + zVal[1]);

      for (let y = yRange.x; y <= yRange.y; ++y) {
        const yVal = [this._box.min.y + y * this._cellSize.y,
          this._box.min.y + (y + 1) * this._cellSize.y];
        vCenter.y = 0.5 * (yVal[0] + yVal[1]);

        for (let { x } = xRange; x <= xRange.y; ++x) {
          const xVal = [this._box.min.x + x * this._cellSize.x,
            this._box.min.x + (x + 1) * this._cellSize.x];
          vCenter.x = 0.5 * (xVal[0] + xVal[1]);

          const d2 = center.distanceToSquared(vCenter);
          if (d2 <= distTouch2) {
            process(x + this._count.x * (y + this._count.y * z), d2 <= distInside2);
          }
        }
      }
    }
  }

  /**
   * Call a function for each atom within given sphere
   *
   * @param {Vector3} center - center of the sphere
   * @param {number} radius  - sphere radius
   * @param {function(Atom)} process - function to call
   */
  forEachAtomWithinRadius(center, radius, process) {
    const self = this;
    const r2 = radius * radius;

    self._forEachVoxelWithinRadius(center, radius, (voxel, isInside) => {
      if (isInside) {
        self._forEachAtomInVoxel(voxel, process);
      } else {
        self._forEachAtomInVoxel(voxel, (atom) => {
          if (center.distanceToSquared(atom.position) <= r2) {
            process(atom);
          }
        });
      }
    });
  }

  /**
   * Call a function for each atom of given complex within given distance from group of atoms defined by mask
   *
   * @param {Complex} complex - complex
   * @param {number} mask - bit mask
   * @param {number} dist - distance
   * @param {function(Atom)} process - function to call
   */
  forEachAtomWithinDistFromMasked(complex, mask, dist, process) {
    this._forEachAtomWithinDistFromGroup((atomProc) => {
      complex.forEachAtom((atom) => {
        if ((atom.mask & mask) !== 0) {
          atomProc(atom);
        }
      });
    }, dist, process);
  }

  /**
   * Call a function for each atom of given complex within given distance from group of atoms defined by selector
   *
   * @param {Complex} complex - complex
   * @param {number} selector - selector
   * @param {number} dist - distance
   * @param {function(Atom)} process - function to call
   */
  forEachAtomWithinDistFromSelected(complex, selector, dist, process) {
    this._forEachAtomWithinDistFromGroup((atomProc) => {
      complex.forEachAtom((atom) => {
        if (selector.includesAtom(atom)) {
          atomProc(atom);
        }
      });
    }, dist, process);
  }

  /**
   * Call a function for each atom of given complex within given distance from group of atoms
   *
   * @param {function} forEachAtom - enumerator of atoms in the group
   * @param {number} dist - distance
   * @param {function(Atom)} process - function to call
   */
  _forEachAtomWithinDistFromGroup(forEachAtom, dist, process) {
    const self = this;
    const r2 = dist * dist;

    const voxels = [];
    const atoms = [];
    let idx = 0;

    // build "within radius" atom list for each voxel
    forEachAtom((atom) => {
      self._forEachVoxelWithinRadius(atom.position, dist, (voxel, isInside) => {
        if (isInside) {
          // this voxel is inside circle -- no check will be required
          voxels[voxel] = -1;
        } else if (typeof voxels[voxel] === 'undefined') {
          // this voxel isn't covered yet -- start building list of atoms
          atoms.push(atom);
          atoms.push(-1);
          voxels[voxel] = idx;
          idx += 2;
        } else if (voxels[voxel] !== -1) {
          // this voxel has a list of atoms required for distance check -- add atom to the list
          atoms.push(atom);
          atoms.push(voxels[voxel]);
          voxels[voxel] = idx;
          idx += 2;
        }
      });
    });

    let voxel;

    const processIfWithin = function (atom) {
      if (typeof voxels[voxel] === 'undefined') {
        return;
      }

      idx = voxels[voxel];
      if (idx === -1) {
        // this voxel is fully covered
        process(atom);
        return;
      }

      // check distance to each atom within radius from this voxel
      for (; idx >= 0; idx = atoms[idx + 1]) {
        if (atom.position.distanceToSquared(atoms[idx].position) < r2) {
          process(atom);
          break;
        }
      }
    };

    // for each marked voxel
    for (voxel in voxels) {
      if (voxels.hasOwnProperty(voxel)) {
        self._forEachAtomInVoxel(voxel, processIfWithin);
      }
    }
  }
}

export default VoxelWorld;
