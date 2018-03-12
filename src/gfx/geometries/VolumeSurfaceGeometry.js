

import * as THREE from 'three';
import IsoSurfaceGeometry from './IsoSurfaceGeometry';
import IsoSurface from './IsoSurface';
import utils from '../../utils';

/**
 * This is a base class for volumetric maps based isosurface algorithms.
 * @param spheresCount - number of atoms/spheres
 * @param opts - geometry specific options
 * @constructor
 */
function VolumeSurfaceGeometry(spheresCount, opts) {
  IsoSurfaceGeometry.call(this, spheresCount, opts);
}

VolumeSurfaceGeometry.prototype = Object.create(IsoSurfaceGeometry.prototype);
VolumeSurfaceGeometry.prototype.constructor = VolumeSurfaceGeometry;

VolumeSurfaceGeometry.prototype._build = function() {
  var params = this._opts;
  this.numVoxels = [128, 128, 128];
  this.xAxis = new THREE.Vector3(1.0, 0.0, 0.0);
  this.yAxis = new THREE.Vector3(0.0, 1.0, 0.0);
  this.zAxis = new THREE.Vector3(0.0, 0.0, 1.0);

  this.origin = new THREE.Vector3(0.0, 0.0, 0.0);
  this._visibilitySelector = params.visibilitySelector;

  this._calcSurface(params);
};

VolumeSurfaceGeometry.prototype._findMinMax = function(posRadArray) {
  var itemSize = 4;
  var itemsCount = posRadArray.length / itemSize;
  var maxPosRad = [posRadArray[0], posRadArray[1], posRadArray[2], posRadArray[3]];
  var minPosRad = [posRadArray[0], posRadArray[1], posRadArray[2], posRadArray[3]];
  for (var i = 1; i < itemsCount; ++i) {
    var ind = i * itemSize;

    for (var itemIdx = 0; itemIdx < itemSize; ++itemIdx) {
      var tmpVal = posRadArray[ind + itemIdx];
      maxPosRad[itemIdx] = Math.max(tmpVal, maxPosRad[itemIdx]);
      minPosRad[itemIdx] = Math.min(tmpVal, minPosRad[itemIdx]);
    }
  }
  return {maxPosRad: maxPosRad, minPosRad: minPosRad};
};

VolumeSurfaceGeometry.prototype._findNumVoxels = function(posRadArray, params) {
  var numVoxels = this.numVoxels;
  var minMaxValues = this._findMinMax(posRadArray);
  var minCoordRad = minMaxValues.minPosRad;
  var maxCoordRad = minMaxValues.maxPosRad;

  // minrad
  if (minCoordRad[3] > 4.0) {
    params.gridSpacing *= minCoordRad[3];
  }

  var gridPadding = params.radScale * maxCoordRad[3] * 1.7;
  var padRad = gridPadding;
  padRad = 0.65 * Math.sqrt(4.0 / 3.0 * Math.PI * padRad * padRad * padRad);
  gridPadding = Math.max(gridPadding, padRad);

  var i = 0;
  for (; i < 3; ++i) {
    minCoordRad[i] -= gridPadding;
    maxCoordRad[i] += gridPadding;
  }

  for (i = 0; i < 3; ++i) {
    numVoxels[i] = Math.ceil((maxCoordRad[i] - minCoordRad[i]) / params.gridSpacing);
  }
  this.xAxis.x = (numVoxels[0] - 1) * params.gridSpacing;
  this.yAxis.y = (numVoxels[1] - 1) * params.gridSpacing;
  this.zAxis.z = (numVoxels[2] - 1) * params.gridSpacing;

  this.origin.x = minCoordRad[0];
  this.origin.y = minCoordRad[1];
  this.origin.z = minCoordRad[2];

  return {bbox: minMaxValues, dim: numVoxels};
};

VolumeSurfaceGeometry.prototype._makeSurface = function(surface, params) {
  var isoSurf = new IsoSurface();
  isoSurf.compute(surface.volMap, this.origin, params.isoValue, 1);
  isoSurf.vertexFusion(9, 9);//normalization is included

  if (isoSurf._numTriangles > 0) {
    isoSurf.setColorVolTex(surface.volTexMap, surface.atomMap, surface.atomWeightMap, this._visibilitySelector);
    this.setIndex(new THREE.BufferAttribute(isoSurf._indices, 1));
    this.addAttribute('position', new THREE.BufferAttribute(isoSurf._position, 3));
    this.addAttribute('normal', new THREE.BufferAttribute(isoSurf._normals, 3));
    this.addAttribute('color', new THREE.BufferAttribute(isoSurf._colors, 3));
  } else { // geometry should have at least empty position attributes to be processed in wireframe mode by three.js
    this.addAttribute('position', new THREE.BufferAttribute(utils.allocateTyped(Float32Array, 0), 3));
  }
};

VolumeSurfaceGeometry.prototype._calcSurface = function(params) {
  var packedArrays = {
    posRad: this._posRad,
    colors: this._colors,
    atoms: this._opts.atoms,
  };

  if (packedArrays.posRad.length === 0) {
    return;
  }
  var boundaries = this._findNumVoxels(packedArrays.posRad, params);

  var box = new THREE.Box3(
    this.origin,
    new THREE.Vector3(this.xAxis.x, this.yAxis.y, this.zAxis.z).add(this.origin)
  );
  var surface = this._computeSurface(packedArrays, box, boundaries, params);

  this._makeSurface(surface, params);
};


export default VolumeSurfaceGeometry;

