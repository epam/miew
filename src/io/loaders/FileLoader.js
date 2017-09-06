

import Loader from './Loader';

function FileLoader(source, options) {
  if (!options.fileName) {
    options.fileName = source.name;
  }
  this._binary = options.binary === true;
  Loader.call(this, source, options);
}

FileLoader.prototype = Object.create(Loader.prototype);
FileLoader.prototype.constructor = FileLoader;

FileLoader.prototype.load = function(callback) {
  var reader = new FileReader();
  this._agent = reader;

  if (callback.ready) {
    reader.addEventListener('load', function _onLoad(event) {
      callback.ready(event.target.result);
    });
  }
  Loader.addCommonHandlers(reader, callback);

  if (this._binary) {
    reader.readAsArrayBuffer(this._source);
  } else {
    reader.readAsText(this._source);
  }
};

FileLoader.canLoad = function(source, options) {
  var type = options.sourceType;
  return (
    (source instanceof File) &&
      (!type || type === 'file')
  );
};

export default FileLoader;

