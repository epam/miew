

import Loader from './Loader';

function XHRLoader(source, options) {
  if (!options.fileName) {
    let last = source.indexOf('?');
    if (last === -1) {
      last = source.length;
    }
    options.fileName = source.slice(source.lastIndexOf('/') + 1, last);
  }
  this._binary = (options.binary === true);
  Loader.call(this, source, options);
}

XHRLoader.prototype = Object.create(Loader.prototype);
XHRLoader.prototype.constructor = XHRLoader;

XHRLoader.prototype.load = function(callback) {
  var url = this._source;
  var request = new XMLHttpRequest();
  this._agent = request;

  if (callback.ready) {
    request.addEventListener('load', function _onLoad() {
      if (request.status === 200) {
        callback.ready(request.response);
      } else if (callback.error) {
        callback.error('HTTP ' + request.status + ' while fetching ' + url);
      }
    });
  }
  Loader.addCommonHandlers(request, callback);

  request.open('GET', url);
  if (this._binary) {
    request.responseType = 'arraybuffer';
  } else {
    request.responseType = 'text';
  }
  request.send();
};

XHRLoader.canLoad = function(source, options) {
  var type = options.sourceType;
  return (
    (typeof source === 'string') &&
      (!type || type === 'url')
  );
};

export default XHRLoader;

