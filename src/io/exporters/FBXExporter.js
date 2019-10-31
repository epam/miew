import Exporter from './Exporter';
import FBXInfoExtractor from './FBXInfoExtractor';
import FBXResult from './FBXResult';
import ComplexVisual from '../../ComplexVisual';

/**
 * FBX file format exporter.
 *
 * @param {}     -
 *
 * @exports FBXExporter
 * @constructor
 */
export default class FBXExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    // Data
    this._data = source;
    this._extractor = new FBXInfoExtractor();
  }

  /**
   * Entry point to exporter.
   */
  exportSync() {
    // Creating mandatory blocks
    const result = new FBXResult();
    if (!this._source) {
      return this._result;
    }

    const info = this._extractor.process(this._data);
    this._result = result.getResult(info);
    return this._result;
  }
}

FBXExporter.formats = ['fbx'];
FBXExporter.SourceClass = ComplexVisual;
