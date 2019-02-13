import EntityList from '../../utils/EntityList';

/**
 * A list of available exporters.
 * @extends EntityList
 */
class ExporterList extends EntityList {
  /**
   * Create a list of exporters.
   * The exporters are indexed by supported data formats (`.formats` and
   * `.extensions` properties of a Exporter subclass).
   * The Exporters can be retrieved later by matching against specs (see {@link ExporterList#find}).
   *
   * @param {!Array<function(new:Exporter)>=} someExporters A list of {@link Exporter} subclasses to
   *   automatically register at creation time.
   * @see ExporterList#register
   */
  constructor(someExporters = []) {
    super(someExporters, ['formats']);
  }

  /**
   * Find a suitable exporter for data.
   *
   * @param {Object} specs Exporter specifications.
   * @param {string=} specs.format Supported data format.
   * @param {*=} specs.data Data to export.
   */
  find(specs) {
    let list = [];
    if (specs.format) {
      list = this._dict.formats[specs.format.toLowerCase()] || [];
    }
    return [...list];
  }
}

export default ExporterList;
