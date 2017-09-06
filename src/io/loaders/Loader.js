

//////////////////////////////////////////////////////////////////////////////
import ContextDependent from '../../utils/ContextDependent';
//////////////////////////////////////////////////////////////////////////////

function Loader(source, options) {
  this._source = source;
  this._options = options;
  this._agent = null;
}

Loader.prototype.abort = function() {
  this._agent.abort();
};

ContextDependent(Loader.prototype);

////////////////////////////////////////////////////////////////////////////

Loader.addCommonHandlers = function(obj, callback) {
  if (callback.error) {
    obj.addEventListener('error', function _onError() {
      callback.error('OnError() event fired while loading');
    });
    obj.addEventListener('abort', function _onAbort() {
      callback.error('OnAbort() event fired while loading');
    });
  }
  if (callback.progress) {
    obj.addEventListener('progress', function _onProgress(event) {
      if (event.lengthComputable) {
        callback.progress(event.loaded / event.total);
      } else {
        callback.progress();
      }
    });
  }
};

////////////////////////////////////////////////////////////////////////////

export default Loader;

