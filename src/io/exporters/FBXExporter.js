import Exporter from './Exporter';
import FBXInfoExtractor from './fbx/FBXInfoExtractor';
import FBXResult from './fbx/FBXResult';
import ComplexVisual from '../../ComplexVisual';

export default class FBXExporter extends Exporter {
  constructor(source, options) {
    super(source, options);
    // Data
    this._data = source;
    this._version = options.miewVersion || '0.0-UNSPECIFIED';
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
    info.version = this._version;
    this._result = result.getResult(info);
    return this._result;
  }
}

FBXExporter.formats = ['fbx'];
FBXExporter.SourceClass = ComplexVisual;
