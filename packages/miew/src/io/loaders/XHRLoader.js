import _ from 'lodash';
import Loader from './Loader';

// we don't need to detect all kinds of URLs, just the evident ones
const urlStartRegexp = /^(https?|ftp):\/\//i;

export default class XHRLoader extends Loader {
  constructor(source, options) {
    super(source, options);

    options = this._options;
    this._binary = (options.binary === true);
  }

  load() {
    return new Promise((resolve, reject) => {
      if (this._abort) {
        throw new Error('Loading aborted');
      }

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

  static canProbablyLoad(source) {
    return _.isString(source) && urlStartRegexp.test(source);
  }

  static extractName(source) {
    if (source) {
      const last = (source.indexOf('?') + 1 || source.lastIndexOf('#') + 1 || source.length + 1) - 1;
      return source.slice(source.lastIndexOf('/', last) + 1, last);
    }
    return undefined;
  }
}

XHRLoader.types = ['url'];
