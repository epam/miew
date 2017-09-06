

import Loader from './Loader';

function MessageLoader(source, options) {
  if (!options.data) {
    var idx = source.indexOf(':', 0);
    if (idx > 0) {
      options.data = window.atob(source.substring(idx + 1));
      options.fileType = source.substring(0, idx).toLowerCase();
    }
  }
  Loader.call(this, source, options);
}

MessageLoader.prototype = Object.create(Loader.prototype);
MessageLoader.prototype.constructor = MessageLoader;

MessageLoader.prototype.load = function(callback) {
  if (callback.progress) {
    callback.progress(0);
  }

  if (!this._options.data || this._options.data === null || this._options.data === '') {
    if (callback.error) {
      callback.error('No data found!');
    }
  }

  if (callback.progress) {
    callback.progress(0.5);
  }

  if (!this._options.dataType || this._options.dataType === null || this._options.dataType === '') {
    if (callback.error) {
      callback.error('No dataType found!');
    }
  }

  if (callback.progress) {
    callback.progress(1);
  }

  if (callback.ready) {
    callback.ready(this._options.data);
  }

};

MessageLoader.canLoad = function(source, options) {
  var type = options.sourceType;
  if (typeof source !== 'string') {
    return false;
  }
  var semiIdx = source.indexOf(':', 0);
  return semiIdx === 3 || type === 'message';
};

export default MessageLoader;

