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

  load(/** @deprecated */ callbacks) {
    if (callbacks) {
      return this._loadOLD(callbacks);
    }
    if (this._abort) {
      return Promise.reject(new Error('Loading aborted'));
    }
    return this.loadAsync();
  }

  /** @deprecated Rename to `load` when transition from callbacks to promises is done */
  loadAsync() {
    return Promise.reject(new Error('Loading from this source is not implemented'));
  }

  /** @deprecated */
  _loadOLD(callbacks) {
    if (callbacks.progress) {
      this.addEventListener('progress', (event) => {
        if (event.lengthComputable && event.total > 0) {
          callbacks.progress(event.loaded / event.total);
        } else {
          callbacks.progress();
        }
      });
    }
    return this.load()
      .then((result) => {
        callbacks.ready(result);
      })
      .catch((error) => {
        callbacks.error(error);
      });
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
