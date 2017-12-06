import Loader from './Loader';

export default class XHRLoader extends Loader {
  constructor(source, options) {
    super(source, options);

    options = this._options;
    if (!options.fileName) {
      let last = source.indexOf('?');
      if (last === -1) {
        last = source.length;
      }
      options.fileName = source.slice(source.lastIndexOf('/') + 1, last);
    }
    this._binary = (options.binary === true);
  }

  loadAsync() {
    return new Promise((resolve, reject) => {
      const url = this._source;
      const request = this._agent = new XMLHttpRequest();

      request.addEventListener('load', () => {
        if (request.status === 200) {
          resolve(request.response);
        } else {
          reject(new Error(`HTTP ${request.status} while fetching ${url}`));
        }
      });
      request.addEventListener('error', () => {
        reject(new Error('HTTP request failed'));
      });
      request.addEventListener('abort', () => {
        reject(new Error('Loading aborted'));
      });
      request.addEventListener('progress', (event) => {
        this.dispatchEvent(event);
      });

      request.open('GET', url);
      if (this._binary) {
        request.responseType = 'arraybuffer';
      } else {
        request.responseType = 'text';
      }
      request.send();
    });
  }

  static canLoad(source, options) {
    const sourceType = options.sourceType;
    return (typeof source === 'string') && (!sourceType || sourceType === 'url');
  }
}
