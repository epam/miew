

import * as THREE from 'three';
import utils from '../../utils';

// suppress some JSHint warnings
/*jshint bitwise: false*/

/**
 * Build normals for isosurface, using atoms information
 *
 * @param {number} numAtoms     - Number of atoms in molecule
 * @param {Element} atoms      - Array of atoms
 * @param {Vector3} vBoxMin     - Bounding box min
 * @param {Vector3} vBoxMax     - Bounding box max
 * @param {number} probeRadius     - Normals for output
 *
 */
function IsosurfaceBuildNormals(numAtoms, atoms, vBoxMin, vBoxMax, probeRadius) {
  this._numAtoms = numAtoms;
  this._atoms = atoms;
  this._vBoxMin = new THREE.Vector3();
  this._vBoxMax = new THREE.Vector3();
  this._vBoxMin.copy(vBoxMin);
  this._vBoxMax.copy(vBoxMax);
  this._probeRadius = probeRadius;

  this._atomsList = null;
  this._voxelList = null;
}

IsosurfaceBuildNormals.prototype.createVoxels = function() {
  var numAtomsRefs;
  var rad;
  var ATOM_VOXEL_REF_SCALE = 4.5;

  var numAtoms = this._numAtoms | 0;
  var atoms = this._atoms;
  var dx = this._vBoxMax.x - this._vBoxMin.x;
  var dy = this._vBoxMax.y - this._vBoxMin.y;
  var dz = this._vBoxMax.z - this._vBoxMin.z;
  var w = (dx < dy) ? dx : dy;
  w = (dz < w) ? dz : w;
  var maxRad = 0.0;
  var aveRad = 0.0;

  var i;
  for (i = 0; i < numAtoms; i++) {
    rad = (atoms[i].radius + this._probeRadius) * 2.0;
    maxRad = (rad > maxRad) ? rad : maxRad;
    aveRad += rad;
  }
  var numCells = Math.floor(w / maxRad);
  if (numCells < 2) {
    numCells = 2;
  }
  aveRad /= numAtoms;

  this._numCells = numCells;
  this._aveRad = aveRad;
  this._maxRad = maxRad;

  var side = numCells;
  var side2 = numCells * numCells;
  var side3 = numCells * numCells * numCells;

  var xScale = this._xScale = 1.0 / (this._vBoxMax.x - this._vBoxMin.x);
  var yScale = this._yScale = 1.0 / (this._vBoxMax.y - this._vBoxMin.y);
  var zScale = this._zScale = 1.0 / (this._vBoxMax.z - this._vBoxMin.z);

  // estimate number of individual atom refs in each voxel list
  var maxAtomsRefs = 0;

  var xNumVoxMult = xScale * numCells;
  var yNumVoxMult = yScale * numCells;
  var zNumVoxMult = zScale * numCells;

  for (i = 0; i < numAtoms; i++) {
    var radAffect = (atoms[i].radius + this._probeRadius) * ATOM_VOXEL_REF_SCALE;
    var diaAffect = radAffect * 2.0;
    var numVoxX = Math.floor(xNumVoxMult * diaAffect + 0.8);
    var numVoxY = Math.floor(yNumVoxMult * diaAffect + 0.8);
    var numVoxZ = Math.floor(zNumVoxMult * diaAffect + 0.8);
    // avoid case numVox? == 0
    // also use loop i <=
    numVoxX++;
    numVoxY++;
    numVoxZ++;
    maxAtomsRefs += numVoxX * numVoxY * numVoxZ;
  }     // for (i)
  //maxAtomsRefs = numAtoms * MAX_ATOMS_IN_SINGLE_VOXEL;


  this._voxelList = utils.allocateTyped(Int32Array, side3);
  var atomsList = [];
  atomsList.length = maxAtomsRefs;
  if ((this._voxelList === null) || (atomsList === null)) {
    return 0 - 1;
  }
  // init voxel list
  for (i = 0; i < side3; i++) {
    this._voxelList[i] = -1;
  }
  numAtomsRefs = 0;

  // create voxel lists
  for (i = 0; i < numAtoms; i++) {
    // use multiplier 4 to locate this atom in different voxels
    rad = (atoms[i].radius + this._probeRadius) * ATOM_VOXEL_REF_SCALE;
    var xIndMin = Math.floor((atoms[i].coord.x - this._vBoxMin.x - rad) * numCells * xScale);
    var yIndMin = Math.floor((atoms[i].coord.y - this._vBoxMin.y - rad) * numCells * yScale);
    var zIndMin = Math.floor((atoms[i].coord.z - this._vBoxMin.z - rad) * numCells * zScale);
    var xIndMax = Math.floor((atoms[i].coord.x - this._vBoxMin.x + rad) * numCells * xScale);
    var yIndMax = Math.floor((atoms[i].coord.y - this._vBoxMin.y + rad) * numCells * yScale);
    var zIndMax = Math.floor((atoms[i].coord.z - this._vBoxMin.z + rad) * numCells * zScale);

    xIndMin = (xIndMin >= 0) ? xIndMin : 0;
    yIndMin = (yIndMin >= 0) ? yIndMin : 0;
    zIndMin = (zIndMin >= 0) ? zIndMin : 0;

    xIndMax = (xIndMax < numCells) ? xIndMax : (numCells - 1);
    yIndMax = (yIndMax < numCells) ? yIndMax : (numCells - 1);
    zIndMax = (zIndMax < numCells) ? zIndMax : (numCells - 1);

    for (var z = zIndMin; z <= zIndMax; z++) {
      for (var y = yIndMin; y <= yIndMax; y++) {
        for (var x = xIndMin; x <= xIndMax; x++) {
          // add atom with index "i" to this voxel list
          var indVoxel = x + y * side + z * side2;
          //assert(indVoxel >= 0);
          //assert(indVoxel < side3);

          // add first
          if (this._voxelList[indVoxel] < 0) {
            atomsList[numAtomsRefs * 2 + 0] = i;
            atomsList[numAtomsRefs * 2 + 1] = 0 - 1;
            this._voxelList[indVoxel] = numAtomsRefs;
            numAtomsRefs++;
            //assert(numAtomsRefs < maxAtomsRefs - 1);
            continue;
          }
          // insert into head of list
          var indexNext = this._voxelList[indVoxel];
          this._voxelList[indVoxel] = numAtomsRefs;
          atomsList[numAtomsRefs * 2 + 0] = i;
          atomsList[numAtomsRefs * 2 + 1] = indexNext;
          numAtomsRefs++;
        }     // for (x)
      }       // for (y)
    }         // for (z)
  }           // for (i)

  // convert Array to Int32Array
  this._atomsList = Int32Array.from(atomsList);

  return 0;
};

IsosurfaceBuildNormals.prototype.destroyVoxels = function() {
  this._atomsList = null;
  this._voxelList = null;

  this._atoms = null;
  this._vertices = null;
  this._vBoxMin = null;
  this._vBoxMax = null;
};

/**
 * Enumerate all atoms affecting specified point
 *
 * @param {Vector3}    point    - point in 3D
 * @param {func(atom)} process  - function to call for each atom
 */
IsosurfaceBuildNormals.prototype.forEachRelatedAtom = function(point, process) {
  // find corresponding voxel
  var xInd = Math.floor((point.x - this._vBoxMin.x) * this._numCells * this._xScale);
  var yInd = Math.floor((point.y - this._vBoxMin.y) * this._numCells * this._yScale);
  var zInd = Math.floor((point.z - this._vBoxMin.z) * this._numCells * this._zScale);
  var indVoxel = xInd + yInd * this._numCells + zInd * this._numCells * this._numCells;

  // run through atoms affecting this voxel
  var atoms = this._atoms;
  for (var ref = this._voxelList[indVoxel]; ref >= 0; ref = this._atomsList[ref * 2 + 1]) {
    var indexAtom = this._atomsList[ref * 2];
    process(atoms[indexAtom]);
  }
};

/**
 * Get atom closest to specified point
 *
 * @param {Vector3} point  - point in 3D
 *
 * @returns {IsoSurfaceAtomColored} atom, or null if not found
 */
IsosurfaceBuildNormals.prototype.getClosestAtom = function(point) {
  var closest = null;
  var minDist2 = Number.MAX_VALUE;

  this.forEachRelatedAtom(point, function(atom) {
    var dist2 = point.distanceToSquared(atom.coord);
    if (dist2 < minDist2) {
      minDist2 = dist2;
      closest = atom;
    }
  });

  return closest;
};

/**
 * Build normals for isosurface, using atoms information
 *
 * @param {number} numVertices  - Number of vertices in final geometry (to render)
 * @param {Vector3} vertices    - Geometry vertices (3d coordinates array)
 * @param {Vector3} normals     - Normals for output
 *
 * @returns {number} 0, if success
 */
IsosurfaceBuildNormals.prototype.buildNormals = function(numVertices, vertices, normals) {
  var self = this;
  var numCloseAtoms = 0;
  var vx = 0, vy = 0, vz = 0;
  var dist2;
  var vNormalX = 0, vNormalY = 0, vNormalZ = 0;
  var koef = 0, w = 0;
  var r25 = 2.5;
  var r01 = 0.1;

  var maxRadAffect = this._aveRad * r25;
  var maxRadAffect2 = maxRadAffect * maxRadAffect;
  var expScale = -this._aveRad * r01;

  // some stats
  //numSlowAtoms = 0;

  var gatherNormals = function(atom) {
    var dx = vx - atom.coord.x;
    var dy = vy - atom.coord.y;
    var dz = vz - atom.coord.z;
    dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 > maxRadAffect2) {
      return;
    }

    // get weight for gaussian smoothing
    var rad = atom.radius + self._probeRadius;
    koef = dist2 - (rad * rad);
    if (koef < 0.0) {
      koef = -koef;
    }
    w = Math.exp(expScale * koef);

    vNormalX += dx * w;
    vNormalY += dy * w;
    vNormalZ += dz * w;
    numCloseAtoms++;
  };

  var maxClosedAtoms = 0;
  // process all vertices, one by one
  for (var i = 0; i < numVertices; i++) {
    vx = vertices[i].x;
    vy = vertices[i].y;
    vz = vertices[i].z;

    numCloseAtoms = 0;
    vNormalX = vNormalY = vNormalZ = 0.0;

    this.forEachRelatedAtom(vertices[i], gatherNormals);

    maxClosedAtoms = (numCloseAtoms > maxClosedAtoms) ? numCloseAtoms : maxClosedAtoms;

    // normalize vNormal
    dist2 = vNormalX * vNormalX + vNormalY * vNormalY + vNormalZ * vNormalZ;
    if (numCloseAtoms > 0) {
      koef = 1.0 / Math.sqrt(dist2);
      vNormalX *= koef;
      vNormalY *= koef;
      vNormalZ *= koef;
    }
    normals[i].x = vNormalX;
    normals[i].y = vNormalY;
    normals[i].z = vNormalZ;
  }   // for (i) all vertices

  return 0;
};

/**
 * Build vertex colors for isosurface, using atoms information
 *
 * @param {number} numVertices  - Number of vertices in final geometry (to render)
 * @param {Vector3} vertices    - Geometry vertices (3d coordinates array)
 * @param {Vector3} colors                - Colors for output
 * @param {number} radiusColorSmoothness  - Radius of smoothness sphere
 *
 * @returns {number} 0, if success
 */
IsosurfaceBuildNormals.prototype.buildColors = function(numVertices, vertices, colors, radiusColorSmoothness) {
  var self = this;
  var vx = 0.0, vy = 0.0, vz = 0.0;
  var koef = 0.0, w = 0.0;
  //var KOEF_ALPHA = 1.0;
  var KOEF_ADD = 0.8;

  var maxRadAffect = radiusColorSmoothness;
  var maxRadAffect2 = maxRadAffect * maxRadAffect;

  //koefAlpha = 4.4 / radiusColorSmoothness;

  var colorsClose = [];
  var weights = [];
  var weightsSum = 0;

  var gatherColors = function(atom) {
    var dx = vx - atom.coord.x;
    var dy = vy - atom.coord.y;
    var dz = vz - atom.coord.z;
    var dist2 = dx * dx + dy * dy + dz * dz;
    if (dist2 > maxRadAffect2) {
      return;
    }

    // get weight for gaussian smoothing
    var rad = atom.radius + self._probeRadius;
    koef = dist2 - (rad * rad);
    if (koef < 0.0) {
      koef = -koef;
    }
    //w = Math.exp(expScale * koef);
    //w = 1.0 / (KOEF_ADD + Math.pow(koef, KOEF_ALPHA));
    w = 1.0 / (KOEF_ADD + koef);

    colorsClose.push([atom.colorX, atom.colorY, atom.colorZ]);
    weights.push(w); // save weights for use
    weightsSum += w; // calc sum of weights fo further normalization
  };

    // process all vertices, one by one
  for (var i = 0; i < numVertices; i++) {
    vx = vertices[i].x;
    vy = vertices[i].y;
    vz = vertices[i].z;

    colorsClose = [];
    weights = [];
    weightsSum = 0;

    this.forEachRelatedAtom(vertices[i], gatherColors);

    // normalized weighted sum of colors
    for (var j = 0; j < colorsClose.length; ++j) {
      var weightNormalized = weights[j] / weightsSum;
      colors[i].x += colorsClose[j][0] * weightNormalized;
      colors[i].y += colorsClose[j][1] * weightNormalized;
      colors[i].z += colorsClose[j][2] * weightNormalized;
    }
  }   // for (i) all vertices
  return 0;
};

export default IsosurfaceBuildNormals;

