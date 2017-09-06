

import VolumeSurfaceGeometry from './VolumeSurfaceGeometry';
import chem from '../../chem';

var Volume = chem.Volume;

/**
 * This class implements 'quick' isosurface geometry generation algorithm.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */
function QuickSurfGeometry(spheresCount, opts) {
  VolumeSurfaceGeometry.call(this, spheresCount, opts);
}

QuickSurfGeometry.prototype = Object.create(VolumeSurfaceGeometry.prototype);
QuickSurfGeometry.prototype.constructor = QuickSurfGeometry;

QuickSurfGeometry.prototype._computeSurface = function(packedArrays, box, boundaries, params) {
  // FIXME beware of shifting this multiple times!
  this._shiftByOrigin(packedArrays.posRad);

  var surface = {
    volMap: new Volume(Float32Array, this.numVoxels, box),
    volTexMap: new Volume(Float32Array, this.numVoxels, box, 3),
  };

  if (this._visibilitySelector != null) {
    surface.atomMap = [];
    surface.atomWeightMap = new Volume(Float32Array, this.numVoxels, box);
  }

  this.gaussdensity(surface, packedArrays, null, params);
  return surface;
};

QuickSurfGeometry.prototype.gaussdensity = function(surface, packedArrays, atomicNum, params) {
  var numAtoms = packedArrays.posRad.length / 4;
  var posRad = packedArrays.posRad;
  var colors = packedArrays.colors;
  var numVoxels = this.numVoxels;
  var radScale = params.radScale;
  var gaussLim = params.gaussLim;
  var gridSpacing = params.gridSpacing;
  var invIsoValue = 1.0 / params.isoValue;
  var invGridSpacing = 1.0 / gridSpacing;
  var maxVoxelX = numVoxels[0] - 1;
  var maxVoxelY = numVoxels[1] - 1;
  var maxVoxelZ = numVoxels[2] - 1;
  //TODO is densityMap and volTexMap initialized?

  var volMap = surface.volMap;
  var volTexMap = surface.volTexMap;
  var volData = volMap.getData();
  var strideX = volMap.getStrideX();

  var volTexData = volTexMap.getData();
  var texStrideX = volTexMap.getStrideX();

  var atomWeightData;
  if (this._visibilitySelector != null) {
    atomWeightData = surface.atomWeightMap.getData();
  }

  var atomMap = surface.atomMap;

  for (var i = 0; i < numAtoms; ++i) {
    var ind = i * 4;
    var scaledRad = posRad[ind + 3] * radScale;
    var atomicNumFactor = atomicNum === null ? 1.0 : atomicNum[i];
    var radInv = 1 / (2 * scaledRad * scaledRad);
    var radLim = gaussLim * scaledRad;
    var radLim2 = radLim * radLim;
    radLim *= invGridSpacing;

    var tmp = posRad[ind] * invGridSpacing;
    var xMin = Math.max((tmp - radLim) | 0, 0);
    var xMax = Math.min((tmp + radLim) | 0, maxVoxelX);
    tmp = posRad[ind + 1] * invGridSpacing;
    var yMin = Math.max((tmp - radLim) | 0, 0);
    var yMax = Math.min((tmp + radLim) | 0, maxVoxelY);
    tmp = posRad[ind + 2] * invGridSpacing;
    var zMin = Math.max((tmp - radLim) | 0, 0);
    var zMax = Math.min((tmp + radLim) | 0, maxVoxelZ);

    var dz = zMin * gridSpacing - posRad[ind + 2];
    for (var z = zMin; z <= zMax; ++z, dz += gridSpacing) {
      var dy = yMin * gridSpacing - posRad[ind + 1];
      for (var y = yMin; y <= yMax; ++y, dy += gridSpacing) {
        var dy2dz2 = dy * dy + dz * dz;

        if (dy2dz2 >= radLim2) {
          continue;
        }

        var addr = volMap.getDirectIdx(xMin, y, z);
        var texAddr = volTexMap.getDirectIdx(xMin, y, z);
        var dx = xMin * gridSpacing - posRad[ind];
        for (var x = xMin; x <= xMax; ++x, dx += gridSpacing, addr += strideX, texAddr += texStrideX) {
          var r2 = dx * dx + dy2dz2;
          var expVal = -r2 * radInv;

          // TODO use faster exp?
          var density = Math.exp(expVal) * atomicNumFactor;

          // store most relevant atom (with highest density)
          if (this._visibilitySelector != null &&
              density > atomWeightData[addr]) { //NOSONAR
            atomWeightData[addr] = density;
            // we use same index into atom map and atomWeightMap
            atomMap[addr] = packedArrays.atoms[i];
          }

          volData[addr] += density;

          // TODO check for volTexMap routine?
          density *= invIsoValue;
          var colInd = i * 3;
          volTexData[texAddr] += density * colors[colInd];
          volTexData[texAddr + 1] += density * colors[colInd + 1];
          volTexData[texAddr + 2] += density * colors[colInd + 2];
        }
      }
    }
  }
};

QuickSurfGeometry.prototype._shiftByOrigin = function(posRadArray) {
  var originX = this.origin.x;
  var originY = this.origin.y;
  var originZ = this.origin.z;

  var itemSize = 4;
  var itemsCount = posRadArray.length / itemSize;
  for (var i = 0; i < itemsCount; ++i) {
    var ind = i * itemSize;

    posRadArray[ind] -= originX;
    posRadArray[ind + 1] -= originY;
    posRadArray[ind + 2] -= originZ;
  }
};

export default QuickSurfGeometry;

