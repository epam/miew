/**
 * Create new data source.
 *
 * @exports DataSource
 * @this DataSource
 * @abstract
 * @constructor
 * @classdesc Basic class for primary data sources used by displaying engine.
 */
class DataSource {
  constructor() {
    if (this.constructor === DataSource) {
      throw new Error('Can not instantiate abstract class!');
    }
  }
}

/**
 * Mode identifier.
 * @type {string}
 */
DataSource.prototype.id = '__';

export default DataSource;
