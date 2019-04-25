import VolumeSurfaceGeometry from './VolumeSurfaceGeometry';
import chem from '../../chem';

const { Volume } = chem;

/**
 * This class implements 'quick' isosurface geometry generation algorithm.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */

class QuickSurfGeometry extends VolumeSurfaceGeometry {
  _computeSurface(packedArrays, box, boundaries, params) {
    // beware of shifting this multiple times!
    this._shiftByOrigin(packedArrays.posRad);

    const surface = {
      volMap: new Volume(Float32Array, this.numVoxels, box),
      volTexMap: new Volume(Float32Array, this.numVoxels, box, 3),
    };

    if (this._visibilitySelector != null) {
      surface.atomMap = [];
      surface.atomWeightMap = new Volume(Float32Array, this.numVoxels, box);
    }

    this.gaussdensity(surface, packedArrays, null, params);
    return surface;
  }

  gaussdensity(surface, packedArrays, atomicNum, params) {
    const numAtoms = packedArrays.posRad.length / 4;
    const { posRad, colors } = packedArrays;
    const { numVoxels } = this;
    const { radScale, gaussLim, gridSpacing } = params;
    const invIsoValue = 1.0 / params.isoValue;
    const invGridSpacing = 1.0 / gridSpacing;
    const maxVoxelX = numVoxels[0] - 1;
    const maxVoxelY = numVoxels[1] - 1;
    const maxVoxelZ = numVoxels[2] - 1;
    // TODO is densityMap and volTexMap initialized?

    const { volMap, volTexMap } = surface;
    const volData = volMap.getData();
    const strideX = volMap.getStrideX();

    const volTexData = volTexMap.getData();
    const texStrideX = volTexMap.getStrideX();

    let atomWeightData;
    if (this._visibilitySelector != null) {
      atomWeightData = surface.atomWeightMap.getData();
    }

    const { atomMap } = surface;

    for (let i = 0; i < numAtoms; ++i) {
      const ind = i * 4;
      const scaledRad = posRad[ind + 3] * radScale;
      const atomicNumFactor = atomicNum === null ? 1.0 : atomicNum[i];
      const radInv = 1 / (2 * scaledRad * scaledRad);
      let radLim = gaussLim * scaledRad;
      const radLim2 = radLim * radLim;
      radLim *= invGridSpacing;

      let tmp = posRad[ind] * invGridSpacing;
      const xMin = Math.max((tmp - radLim) | 0, 0);
      const xMax = Math.min((tmp + radLim) | 0, maxVoxelX);
      tmp = posRad[ind + 1] * invGridSpacing;
      const yMin = Math.max((tmp - radLim) | 0, 0);
      const yMax = Math.min((tmp + radLim) | 0, maxVoxelY);
      tmp = posRad[ind + 2] * invGridSpacing;
      const zMin = Math.max((tmp - radLim) | 0, 0);
      const zMax = Math.min((tmp + radLim) | 0, maxVoxelZ);

      let dz = zMin * gridSpacing - posRad[ind + 2];
      for (let z = zMin; z <= zMax; ++z, dz += gridSpacing) {
        let dy = yMin * gridSpacing - posRad[ind + 1];
        for (let y = yMin; y <= yMax; ++y, dy += gridSpacing) {
          const dy2dz2 = dy * dy + dz * dz;

          if (dy2dz2 >= radLim2) {
            continue;
          }

          let addr = volMap.getDirectIdx(xMin, y, z);
          let texAddr = volTexMap.getDirectIdx(xMin, y, z);
          let dx = xMin * gridSpacing - posRad[ind];
          for (let x = xMin; x <= xMax; ++x, dx += gridSpacing, addr += strideX, texAddr += texStrideX) {
            const r2 = dx * dx + dy2dz2;
            const expVal = -r2 * radInv;

            let density = Math.exp(expVal) * atomicNumFactor;

            // store most relevant atom (with highest density)
            if (this._visibilitySelector != null
              && density > atomWeightData[addr]) { // NOSONAR
              atomWeightData[addr] = density;
              // we use same index into atom map and atomWeightMap
              atomMap[addr] = packedArrays.atoms[i];
            }

            volData[addr] += density;

            // TODO check for volTexMap routine?
            density *= invIsoValue;
            const colInd = i * 3;
            volTexData[texAddr] += density * colors[colInd];
            volTexData[texAddr + 1] += density * colors[colInd + 1];
            volTexData[texAddr + 2] += density * colors[colInd + 2];
          }
        }
      }
    }
  }

  _shiftByOrigin(posRadArray) {
    const originX = this.origin.x;
    const originY = this.origin.y;
    const originZ = this.origin.z;

    const itemSize = 4;
    const itemsCount = posRadArray.length / itemSize;
    for (let i = 0; i < itemsCount; ++i) {
      const ind = i * itemSize;

      posRadArray[ind] -= originX;
      posRadArray[ind + 1] -= originY;
      posRadArray[ind + 2] -= originZ;
    }
  }
}

export default QuickSurfGeometry;
