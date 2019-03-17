import RCGroup from '../../RCGroup';
import TransformGroup from '../../meshes/TransformGroup';

function wrapper(Name, args) {
  const params = [Name].concat(args);
  return Name.bind(...params);
}

class ChemGroup extends RCGroup {
  constructor(geoParams, selection, colorer, mode, transforms, polyComplexity, material) {
    super();
    if (this.constructor === ChemGroup) {
      throw new Error('Can not instantiate abstract class!');
    }
    this._selection = selection;
    this._mode = mode;
    this._colorer = colorer;
    this._chunksIdc = selection.chunks;
    this._polyComplexity = polyComplexity;
    this._geo = new (wrapper(geoParams.Geometry, this._makeGeoArgs()))();
    this._mesh = new TransformGroup(this._geo, geoParams, material, transforms);
    this.add(this._mesh);
    this._build();
  }

  _makeGeoArgs() {
    throw new Error('ChemGroup subclass must override _makeGeoArgs() method');
  }

  /**
   * Builds subset geometry by ATOMS index list
   *
   * @param {Number} mask - Representation mask
   * @param {Boolean} innerOnly - if true returns inner bonds only - without halves
   * @returns {Array} Subset geometry
   */
  getSubset(mask, innerOnly) {
    innerOnly = innerOnly !== undefined ? innerOnly : false;
    const chunksList = this._calcChunksList(mask, innerOnly);
    if (chunksList.length === 0) {
      return [];
    }
    return this._mesh.getSubset(chunksList);
  }

  _changeSubsetOpacity(mask, value, innerOnly) {
    const chunksList = this._calcChunksList(mask, innerOnly);
    if (chunksList.length === 0) {
      return;
    }
    this._geo.setOpacity(chunksList, value);
  }

  enableSubset(mask, innerOnly) {
    innerOnly = innerOnly !== undefined ? innerOnly : true;
    this._changeSubsetOpacity(mask, 1.0, innerOnly);
  }

  disableSubset(mask, innerOnly) {
    innerOnly = innerOnly !== undefined ? innerOnly : true;
    this._changeSubsetOpacity(mask, 0.0, innerOnly);
  }
}

export default ChemGroup;
