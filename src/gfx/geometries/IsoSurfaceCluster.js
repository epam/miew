

// suppress some JSHint warnings
/*jshint bitwise: false*/

import * as THREE from 'three';
import IsoSurfaceAtomColored from './IsoSurfaceAtomColored';
import utils from '../../utils';

function IsoSurfaceCluster(fileIn, pdbAtomsIn, atomsIn, vBoxMinIn, vBoxMaxIn, numVoxelsIn, colorModeIn) {
  this.complex = fileIn;
  this.atoms = atomsIn;
  this.pdbAtoms = pdbAtomsIn;
  this.numVoxels = numVoxelsIn;
  this.colorMode = colorModeIn;
  this.vBoxMin = new THREE.Vector3();
  this.vBoxMax = new THREE.Vector3();
  this.vBoxMin.copy(vBoxMinIn);
  this.vBoxMax.copy(vBoxMaxIn);
  this.voxelsRefs = null;
  this.voxels = null;
}

/* eslint-disable no-magic-numbers */
IsoSurfaceCluster.prototype.atomColors = [
  new THREE.Vector3(0.80, 0.80, 0.80),   // C
  new THREE.Vector3(0.99, 0.99, 0.99),   // H
  new THREE.Vector3(0.90, 0.20, 0.20),   // O
  new THREE.Vector3(0.20, 0.20, 0.90),   // N
  new THREE.Vector3(0.30, 0.90, 0.20),   // P
  new THREE.Vector3(0.90, 0.90, 0.20),   // S

  new THREE.Vector3(0.0, 0.0, 0.0),   // undefined
  new THREE.Vector3(0.60, 0.60, 0.60)    // undefined
];

IsoSurfaceCluster.prototype.resiudeColors = [
  new THREE.Vector3(0.9, 0.9, 0.2),
  new THREE.Vector3(0.0, 0.9, 0.9),
  new THREE.Vector3(0.9, 0.1, 0.9),
  new THREE.Vector3(0.9, 0.4, 0.6),
  new THREE.Vector3(0.9, 0.6, 0.4),
  new THREE.Vector3(0.4, 0.6, 0.9),
  new THREE.Vector3(0.9, 0.4, 0.7),
  new THREE.Vector3(0.7, 0.3, 0.6)
];

IsoSurfaceCluster.prototype.chainColors = [
  new THREE.Vector3(0.1, 0.1, 0.1),
  new THREE.Vector3(0.3, 0.3, 0.3),
  new THREE.Vector3(0.7, 0.7, 0.7),
  new THREE.Vector3(0.9, 0.9, 0.9),
  new THREE.Vector3(0.5, 0.2, 0.2),
  new THREE.Vector3(0.3, 0.7, 0.7),
  new THREE.Vector3(0.7, 0.3, 0.7),
  new THREE.Vector3(0.8, 0.2, 0.5)
];
/* eslint-enable no-magic-numbers */

IsoSurfaceCluster.prototype.destroy = function() {
  this.atoms = null;
  this.vBoxMin = null;
  this.vBoxMax = null;
  this.voxelsRefs = null;
  this.voxels = null;
};

IsoSurfaceCluster.prototype.buildSimple = function(complex, colorer) {
  var atomsClustered = [];
  var i, j, indVoxel, indAtomRef;
  var atom;
  var vColorX = 0, vColorY = 0, vColorZ = 0;
  var ind = 0;

  var cNumNeighbours = 8;
  var cMask = 7;
  var histTypes = [];
  histTypes.length = cNumNeighbours;

  var numVoxels = this.numVoxels;
  var n3 = numVoxels * numVoxels * numVoxels;

  var numAtoms = this.atoms.length;

  this.voxelsRefs = utils.allocateTyped(Int32Array, numAtoms * 2);
  this.voxels = utils.allocateTyped(Int32Array, n3);

  // init atoms list
  for (i = 0, j = 0; i < numAtoms; i++, j += 2) {
    this.voxelsRefs[j + 0] = i;
    this.voxelsRefs[j + 1] = 0 - 1;
  }
  // init voxel references (-1 means no atom)
  for (i = 0; i < n3; i++) {
    this.voxels[i] = -1;
  }
  // build atom list for each voxel
  var xScale = 1.0 / (this.vBoxMax.x - this.vBoxMin.x);
  var yScale = 1.0 / (this.vBoxMax.y - this.vBoxMin.y);
  var zScale = 1.0 / (this.vBoxMax.z - this.vBoxMin.z);
  for (i = 0; i < numAtoms; i++) {
    var v = this.atoms[i].coord;
    var xVox = Math.floor((v.x - this.vBoxMin.x) * numVoxels * xScale);
    var yVox = Math.floor((v.y - this.vBoxMin.y) * numVoxels * yScale);
    var zVox = Math.floor((v.z - this.vBoxMin.z) * numVoxels * zScale);
    indVoxel = xVox + yVox * numVoxels + zVox * numVoxels * numVoxels;
    //assert(indVoxel >= 0);
    //assert(indVoxel < n3);
    indAtomRef = this.voxels[indVoxel];

    if (indAtomRef < 0) {
      this.voxels[indVoxel] = i;
      continue;
    }
    while (indAtomRef >= 0) {
      if (this.voxelsRefs[indAtomRef * 2 + 1] < 0) {
        break;
      }
      indAtomRef = this.voxelsRefs[indAtomRef * 2 + 1];
      //assert(indAtomRef < numAtoms);
    }
    // add new atom to list tail
    this.voxelsRefs[indAtomRef * 2 + 1] = i;
  }       // for (i) all source atoms

  // build Output atoms (clustered)
  var numSpheres = 0;
  var maxNumAtomsInVoxel = 0;
  for (var z = 0; z < numVoxels; z++) {
    var indVoxelZ = z * numVoxels * numVoxels;
    for (var y = 0; y < numVoxels; y++) {
      var indVoxelY = y * numVoxels;
      for (var x = 0; x < numVoxels; x++) {
        indVoxel = x + indVoxelY + indVoxelZ;
        indAtomRef = this.voxels[indVoxel];
        if (indAtomRef < 0) {
          continue;
        }
        // get ave position
        var vCenterX = 0.0;
        var vCenterY = 0.0;
        var vCenterZ = 0.0;
        // get num atoms in voxel
        var numAtomsInVoxel = 0;

        while (indAtomRef >= 0) {
          atom = this.atoms[indAtomRef];
          vCenterX += atom.coord.x;
          vCenterY += atom.coord.y;
          vCenterZ += atom.coord.z;

          numAtomsInVoxel++;
          indAtomRef = this.voxelsRefs[indAtomRef * 2 + 1];
        }
        vCenterX *= (1.0 / numAtomsInVoxel);
        vCenterY *= (1.0 / numAtomsInVoxel);
        vCenterZ *= (1.0 / numAtomsInVoxel);

        // find best color (most of in histogram)
        for (i = 0; i < cNumNeighbours; i++) {
          histTypes[i] = 0;
        }

        var rad = 0.0;
        indAtomRef = this.voxels[indVoxel];
        while (indAtomRef >= 0) {
          atom = this.atoms[indAtomRef];
          var vx = atom.coord.x - vCenterX;
          var vy = atom.coord.y - vCenterY;
          var vz = atom.coord.z - vCenterZ;
          var dist = Math.sqrt(vx * vx + vy * vy + vz * vz) + atom.radius;
          if (dist > rad) {
            rad = dist;
          }

          ind = colorer.getIndex(complex, this.atoms[indAtomRef]);
          ind &= cMask;
          histTypes[ind]++;


          // next atom in voxel
          indAtomRef = this.voxelsRefs[indAtomRef * 2 + 1];
        }
        // find maximum in histogram => this is most prevalent atom type in cluster
        var indMax = 0;
        for (i = 1; i < cNumNeighbours; i++) {
          if (histTypes[i] > histTypes[indMax]) {
            indMax = i;
          }
        }

        //TODO: Earnol
        var vCenter = new THREE.Color(colorer.getAtomColor(complex, this.atoms[indMax]));
        if (this.colorMode === 0) {
          vColorX = this.atomColors[indMax].x;
          vColorY = this.atomColors[indMax].y;
          vColorZ = this.atomColors[indMax].z;
        }
        if (this.colorMode === 1) {
          var colRGB = this.complex.monomerTypeArray[ind].color; // FIXME: the array is missing
          vColorX = colRGB.r;
          vColorY = colRGB.g;
          vColorZ = colRGB.b;
        }
        if (this.colorMode !== 1 && this.colorMode !== 0) {
          vColorX = this.atomColors[indMax].x;
          vColorY = this.atomColors[indMax].y;
          vColorZ = this.atomColors[indMax].z;
        }


        vCenter.set(vCenterX, vCenterY, vCenterZ);
        atomsClustered[numSpheres] = new IsoSurfaceAtomColored(vCenter, rad);
        atomsClustered[numSpheres].colorX = vColorX;
        atomsClustered[numSpheres].colorY = vColorY;
        atomsClustered[numSpheres].colorZ = vColorZ;
        numSpheres++;

        maxNumAtomsInVoxel = (numAtomsInVoxel > maxNumAtomsInVoxel) ? numAtomsInVoxel : maxNumAtomsInVoxel;

      }           // for (x)
    }            // for (y)
  }              // for (z)
  this.voxelsRefs = null;
  this.voxels = null;
  return atomsClustered;
};

export default IsoSurfaceCluster;

