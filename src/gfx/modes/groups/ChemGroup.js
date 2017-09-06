

import RCGroup from '../../RCGroup';
import TransformGroup from '../../meshes/TransformGroup';

function wrapper(Name, args) {
  var params = [Name].concat(args);
  return Name.bind.apply(Name, params);
}

function ChemGroup(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
  RCGroup.call(this);
  if (this.constructor === ChemGroup) {
    throw new Error('Can not instantiate abstract class!');
  }
  this._selection = selection;
  this._geo = new (wrapper(geoParams.Geometry, this._geoArgs))();
  this._chunksIdc = selection.chunks;
  this._mesh = new TransformGroup(this._geo, geoParams, material, transforms);
  this.add(this._mesh);
  this._mode = mode;
  this._colorer = colorer;
  this._build();
}

ChemGroup.prototype = Object.create(RCGroup.prototype);
ChemGroup.prototype.constructor = ChemGroup;

/**
 * Builds subset geometry by ATOMS index list
 *
 * @param {Number} mask - Representation mask
 * @param {Boolean} innerOnly - if true returns inner bonds only - without halves
 * @returns {Array} Subset geometry
 */
ChemGroup.prototype.getSubset = function(mask, innerOnly) {
  innerOnly = innerOnly !== undefined ? innerOnly : false;
  var chunksList = this._calcChunksList(mask, innerOnly);
  if (chunksList.length === 0) {
    return [];
  }
  return this._mesh.getSubset(chunksList);
};

ChemGroup.prototype._changeSubsetOpacity = function(mask, value, innerOnly) {
  var chunksList = this._calcChunksList(mask, innerOnly);
  if (chunksList.length === 0) {
    return;
  }
  this._geo.setOpacity(chunksList, value);
};

ChemGroup.prototype.enableSubset = function(mask, innerOnly) {
  innerOnly = innerOnly !== undefined ? innerOnly : true;
  this._changeSubsetOpacity(mask, 1.0, innerOnly);
};

ChemGroup.prototype.disableSubset = function(mask, innerOnly) {
  innerOnly = innerOnly !== undefined ? innerOnly : true;
  this._changeSubsetOpacity(mask, 0.0, innerOnly);
};

export default ChemGroup;

