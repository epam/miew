import Loader from './Loader';

export default class FileLoader extends Loader {
  constructor(source, options) {
    super(source, options);

    options = this._options;
    this._binary = options.binary === true;
  }

  loadAsync() {
    return new Promise((resolve, reject) => {
      const blob = this._source;
      const reader = this._agent = new FileReader();

      reader.addEventListener('load', () => {
        resolve(reader.result);
      });
      reader.addEventListener('error', () => {
        reject(reader.error);
      });
      reader.addEventListener('abort', () => {
        reject(new Error('Loading aborted'));
      });
      reader.addEventListener('progress', (event) => {
        this.dispatchEvent(event);
      });

      if (this._binary) {
        reader.readAsArrayBuffer(blob);
      } else {
        reader.readAsText(blob);
      }
    });
  }

  /** @deprecated */
  static canLoad(source, options) {
    const sourceType = options.sourceType;
    return source instanceof File && (!sourceType || sourceType === 'file');
  }

  static canProbablyLoad(source) {
    return File && source instanceof File || Blob && source instanceof Blob;
  }

  static extractName(source) {
    return source && source.name;
  }
}

FileLoader.types = ['file', 'blob'];
