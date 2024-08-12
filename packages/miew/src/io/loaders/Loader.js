import EventDispatcher from '../../utils/EventDispatcher';
import makeContextDependent from '../../utils/makeContextDependent';

export default class Loader extends EventDispatcher {
  constructor(source, options) {
    super();
    this._source = source;
    this._options = options || {};
    this._abort = false;
    this._agent = null;
  }

  load() {
    return Promise.reject(new Error('Loading from this source is not implemented'));
  }

  abort() {
    this._abort = true;
    if (this._agent) {
      this._agent.abort();
    }
  }

  static extractName(_source) {
    return undefined;
  }
}

makeContextDependent(Loader.prototype);
