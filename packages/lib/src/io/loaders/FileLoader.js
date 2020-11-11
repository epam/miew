import Loader from './Loader';

export default class FileLoader extends Loader {
  constructor(source, options) {
    super(source, options);

    options = this._options;
    this._binary = options.binary === true;
  }

  load() {
    return new Promise((resolve, reject) => {
      if (this._abort) {
        throw new Error('Loading aborted');
      }

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

  static canProbablyLoad(source) {
    return (File && source instanceof File) || (Blob && source instanceof Blob);
  }

  static extractName(source) {
    return source && source.name;
  }
}

FileLoader.types = ['file', 'blob'];
